import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { slugifyBoardName } from "@take-this-one/shared";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { syncProfileAction } from "@/actions/sync-profile";

export async function GET() {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("boards")
    .select("id, slug, name, description, is_public")
    .eq("is_public", true)
    .order("created_at", {
      ascending: false
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ boards: data ?? [] });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  const slug = await makeUniqueSlug(slugifyBoardName(name), supabase);
  const { data: board, error } = await supabase
    .from("boards")
    .insert({
      slug,
      name,
      description,
      is_public: isPublic,
      created_by_user_id: profile.id
    })
    .select("id, slug, name, is_public")
    .single();

  if (error || !board) {
    return NextResponse.json({ error: error?.message ?? "Failed to create board." }, { status: 500 });
  }

  const { error: memberError } = await supabase.from("board_members").insert({
    board_id: board.id,
    user_id: profile.id
  });

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  return NextResponse.json(board, { status: 201 });
}

async function makeUniqueSlug(initialSlug: string, supabase: ReturnType<typeof getServiceRoleClient>) {
  const base = initialSlug || "board";
  let candidate = base;
  let attempt = 1;

  while (true) {
    const { data } = await supabase.from("boards").select("id").eq("slug", candidate).maybeSingle();

    if (!data) {
      return candidate;
    }

    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
}
