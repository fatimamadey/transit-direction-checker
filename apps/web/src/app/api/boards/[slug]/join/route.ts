import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { syncProfileAction } from "@/actions/sync-profile";

export async function POST(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
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

  const { error } = await supabase.from("board_members").upsert(
    {
      board_id: board.id,
      user_id: profile.id
    },
    {
      onConflict: "board_id,user_id"
    }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, boardSlug: slug });
}
