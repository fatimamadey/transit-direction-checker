import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { BoardEvent, BoardListItem, BoardPageData, DashboardData } from "@/types/dashboard";

export async function getDashboardData(clerkUserId: string): Promise<DashboardData> {
  const supabase = getServiceRoleClient();
  const user = await getCurrentDbUser(clerkUserId);

  const [{ data: boards, error: boardsError }, { data: memberships, error: membershipsError }] = await Promise.all([
    supabase.from("boards").select("id, slug, name, description").order("created_at", { ascending: false }),
    supabase.from("board_members").select("board_id").eq("user_id", user.id)
  ]);

  if (boardsError) {
    throw new Error(boardsError.message);
  }

  if (membershipsError) {
    throw new Error(membershipsError.message);
  }

  const boardIds = (boards ?? []).map((board) => board.id as string);
  const joinedSet = new Set((memberships ?? []).map((membership) => membership.board_id as string));
  const counts = boardIds.length ? await getBoardCounts(boardIds) : new Map<string, { members: number; sources: number }>();

  const boardList = (boards ?? []).map((board) =>
    toBoardListItem(
      board.id as string,
      board.slug as string,
      board.name as string,
      (board.description as string | null) ?? null,
      joinedSet.has(board.id as string),
      counts
    )
  );

  return {
    joinedBoards: boardList.filter((board) => board.joined),
    publicBoards: boardList
  };
}

export async function getBoardPageData(slug: string, clerkUserId: string | null): Promise<BoardPageData> {
  const supabase = getServiceRoleClient();
  const { data: board, error: boardError } = await supabase
    .from("boards")
    .select("id, slug, name, description")
    .eq("slug", slug)
    .single();

  if (boardError || !board) {
    throw new Error(boardError?.message ?? "Board not found.");
  }

  const boardId = board.id as string;
  const counts = await getBoardCounts([boardId]);
  const sources = await getBoardSources(boardId);
  const initialEvents = await getBoardEvents(boardId, null, 30);
  const isMember = clerkUserId ? await isBoardMember(clerkUserId, boardId) : false;

  return {
    board: {
      id: boardId,
      slug: board.slug as string,
      name: board.name as string,
      description: (board.description as string | null) ?? null,
      memberCount: counts.get(boardId)?.members ?? 0,
      sourceCount: counts.get(boardId)?.sources ?? 0
    },
    isMember,
    sources,
    initialEvents
  };
}

export async function getBoardEventsBySlug(slug: string, since: string | null, limit = 50) {
  const supabase = getServiceRoleClient();
  const { data: board, error } = await supabase.from("boards").select("id").eq("slug", slug).single();

  if (error || !board) {
    throw new Error(error?.message ?? "Board not found.");
  }

  return getBoardEvents(board.id as string, since, limit);
}

async function getBoardEvents(boardId: string, since: string | null, limit: number): Promise<BoardEvent[]> {
  const supabase = getServiceRoleClient();
  let query = supabase
    .from("board_events")
    .select(
      `
      created_at,
      event:events!board_events_event_id_fkey(
        id,
        github_event_id,
        event_type,
        actor_login,
        repo_name,
        subject_title,
        subject_url,
        occurred_at
      ),
      source:sources!board_events_source_id_fkey(
        id,
        type,
        value,
        display_name
      )
    `
    )
    .eq("board_id", boardId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (since) {
    query = query.gt("created_at", since);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => {
      const event = asObject(row.event);
      const source = asObject(row.source);

      if (!event || !source) {
        return null;
      }

      return {
        id: String(event.id),
        githubEventId: String(event.github_event_id),
        eventType: String(event.event_type),
        actorLogin: (event.actor_login as string | null) ?? null,
        repoName: (event.repo_name as string | null) ?? null,
        subjectTitle: (event.subject_title as string | null) ?? null,
        subjectUrl: (event.subject_url as string | null) ?? null,
        occurredAt: String(event.occurred_at),
        boardEventCreatedAt: String(row.created_at),
        source: {
          id: String(source.id),
          type: source.type as "user" | "repo",
          value: String(source.value),
          displayName: String(source.display_name)
        }
      } satisfies BoardEvent;
    })
    .filter((row): row is BoardEvent => row !== null);
}

async function getBoardSources(boardId: string) {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("board_sources")
    .select(
      `
      source:sources!board_sources_source_id_fkey(
        id,
        type,
        value,
        display_name
      )
    `
    )
    .eq("board_id", boardId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const source = asObject(row.source);

    if (!source) {
      throw new Error("Board source relationship is missing.");
    }

    return {
      id: String(source.id),
      type: source.type as "user" | "repo",
      value: String(source.value),
      displayName: String(source.display_name)
    };
  });
}

async function isBoardMember(clerkUserId: string, boardId: string) {
  const user = await getCurrentDbUser(clerkUserId);
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("board_members")
    .select("id")
    .eq("board_id", boardId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

async function getCurrentDbUser(clerkUserId: string) {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "User profile not found.");
  }

  return data;
}

async function getBoardCounts(boardIds: string[]) {
  const supabase = getServiceRoleClient();
  const [memberships, sources] = await Promise.all([
    supabase.from("board_members").select("board_id").in("board_id", boardIds),
    supabase.from("board_sources").select("board_id").in("board_id", boardIds)
  ]);

  if (memberships.error) {
    throw new Error(memberships.error.message);
  }

  if (sources.error) {
    throw new Error(sources.error.message);
  }

  const counts = new Map<string, { members: number; sources: number }>();

  for (const boardId of boardIds) {
    counts.set(boardId, { members: 0, sources: 0 });
  }

  for (const row of memberships.data ?? []) {
    const entry = counts.get(row.board_id as string);
    if (entry) {
      entry.members += 1;
    }
  }

  for (const row of sources.data ?? []) {
    const entry = counts.get(row.board_id as string);
    if (entry) {
      entry.sources += 1;
    }
  }

  return counts;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    const first = value[0];
    return first && typeof first === "object" ? (first as Record<string, unknown>) : null;
  }

  return typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function toBoardListItem(
  id: string,
  slug: string,
  name: string,
  description: string | null,
  joined: boolean,
  counts: Map<string, { members: number; sources: number }>
): BoardListItem {
  return {
    id,
    slug,
    name,
    description,
    memberCount: counts.get(id)?.members ?? 0,
    sourceCount: counts.get(id)?.sources ?? 0,
    joined
  };
}
