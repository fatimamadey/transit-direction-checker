import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { syncProfileAction } from "@/actions/sync-profile";

export async function PATCH(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  const payload = (await request.json()) as { name?: string; description?: string; isPublic?: boolean };
  const name = payload.name?.trim();
  const description = payload.description?.trim() ?? null;
  const isPublic = payload.isPublic ?? true;

  if (!name) {
    return NextResponse.json({ error: "Board name is required." }, { status: 400 });
  }

  const user = await currentUser();
  const profile = await syncProfileAction({
    clerkUserId: userId,
    email: user?.emailAddresses[0]?.emailAddress ?? "unknown@example.com",
    githubLogin: user?.username ?? null
  });

  const supabase = getServiceRoleClient();
  const { data: board, error: boardError } = await supabase.from("boards").select("id").eq("slug", slug).single();

  if (boardError || !board) {
    return NextResponse.json({ error: boardError?.message ?? "Board not found." }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from("board_members")
    .select("id")
    .eq("board_id", board.id)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Join the board before editing it." }, { status: 403 });
  }

  const { error } = await supabase
    .from("boards")
    .update({
      name,
      description,
      is_public: isPublic
    })
    .eq("id", board.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, name, description, isPublic });
}
