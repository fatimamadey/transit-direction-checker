import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { normalizeSourceValue, type SourceType } from "@take-this-one/shared";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { syncProfileAction } from "@/actions/sync-profile";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  const payload = (await request.json()) as { type?: SourceType; value?: string };

  if (!payload.type || !payload.value) {
    return NextResponse.json({ error: "Source type and value are required." }, { status: 400 });
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
    return NextResponse.json({ error: "Join the board before adding sources." }, { status: 403 });
  }

  const normalizedValue = normalizeSourceValue(payload.type, payload.value);
  const displayName = normalizedValue;

  const { data: source, error: sourceError } = await supabase
    .from("sources")
    .upsert(
      {
        type: payload.type,
        value: normalizedValue,
        display_name: displayName
      },
      {
        onConflict: "type,value"
      }
    )
    .select("id, type, value, display_name")
    .single();

  if (sourceError || !source) {
    return NextResponse.json({ error: sourceError?.message ?? "Failed to save source." }, { status: 500 });
  }

  const { error: boardSourceError } = await supabase.from("board_sources").upsert(
    {
      board_id: board.id,
      source_id: source.id,
      added_by_user_id: profile.id
    },
    {
      onConflict: "board_id,source_id"
    }
  );

  if (boardSourceError) {
    return NextResponse.json({ error: boardSourceError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    source: {
      id: source.id,
      type: source.type,
      value: source.value,
      displayName: source.display_name
    }
  });
}
