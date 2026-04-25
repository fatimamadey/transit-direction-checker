import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type {
  ActivityBucket,
  BoardEvent,
  BoardListItem,
  BoardPageData,
  BoardSnapshot,
  BoardSource,
  BoardSummary,
  DashboardData,
  DashboardOverview,
  EventKind,
  EventMixItem,
  SourceNode,
  TopActor
} from "@/types/dashboard";

const DASHBOARD_WINDOW_HOURS = 24;
const BOARD_WINDOW_HOURS = 24;
const DASHBOARD_BUCKETS = 8;
const BOARD_BUCKETS = 10;

type BoardRecord = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isPublic: boolean;
};

export async function getDashboardData(clerkUserId: string): Promise<DashboardData> {
  const supabase = getServiceRoleClient();
  const user = await getCurrentDbUser(clerkUserId);

  const [{ data: boards, error: boardsError }, { data: memberships, error: membershipsError }] = await Promise.all([
    supabase.from("boards").select("id, slug, name, description, is_public").order("created_at", { ascending: false }),
    supabase.from("board_members").select("board_id").eq("user_id", user.id)
  ]);

  if (boardsError) {
    throw new Error(boardsError.message);
  }

  if (membershipsError) {
    throw new Error(membershipsError.message);
  }

  const boardRows = ((boards ?? []) as Record<string, unknown>[]).map((board) => ({
    id: String(board.id),
    slug: String(board.slug),
    name: String(board.name),
    description: (board.description as string | null) ?? null,
    isPublic: Boolean(board.is_public)
  }));

  const boardIds = boardRows.map((board) => board.id);
  const joinedSet = new Set((memberships ?? []).map((membership) => membership.board_id as string));
  const counts = boardIds.length ? await getBoardCounts(boardIds) : new Map<string, { members: number; sources: number }>();
  const sourcePreviewMap = boardIds.length ? await getBoardSourcePreview(boardIds) : new Map<string, BoardSource[]>();
  const recentEvents = boardIds.length ? await getBoardEventsForBoards(boardIds, DASHBOARD_WINDOW_HOURS) : [];
  const groupedEvents = groupEventsByBoard(recentEvents);
  const trackedSources = countTrackedSources(counts, boardIds);

  const boardList = boardRows.map((board) =>
    toBoardListItem(board, joinedSet.has(board.id), counts, groupedEvents.get(board.id) ?? [], sourcePreviewMap.get(board.id) ?? [])
  );

  return {
    overview: buildDashboardOverview(boardList, recentEvents, trackedSources),
    joinedBoards: boardList.filter((board) => board.joined),
    publicBoards: boardList.filter((board) => board.isPublic)
  };
}

export async function getPublicBoardsData(limit = 6): Promise<BoardListItem[]> {
  const supabase = getServiceRoleClient();
  const { data: boards, error } = await supabase
    .from("boards")
    .select("id, slug, name, description, is_public")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const boardRows = ((boards ?? []) as Record<string, unknown>[]).map((board) => ({
    id: String(board.id),
    slug: String(board.slug),
    name: String(board.name),
    description: (board.description as string | null) ?? null,
    isPublic: Boolean(board.is_public)
  }));

  const boardIds = boardRows.map((board) => board.id);
  const counts = boardIds.length ? await getBoardCounts(boardIds) : new Map<string, { members: number; sources: number }>();
  const sourcePreviewMap = boardIds.length ? await getBoardSourcePreview(boardIds) : new Map<string, BoardSource[]>();
  const recentEvents = boardIds.length ? await getBoardEventsForBoards(boardIds, DASHBOARD_WINDOW_HOURS) : [];
  const groupedEvents = groupEventsByBoard(recentEvents);

  return boardRows.map((board) =>
    toBoardListItem(board, false, counts, groupedEvents.get(board.id) ?? [], sourcePreviewMap.get(board.id) ?? [])
  );
}

export async function getBoardPageData(slug: string, clerkUserId: string | null): Promise<BoardPageData> {
  const board = await getBoardBySlug(slug);
  const isMember = clerkUserId ? await isBoardMember(clerkUserId, board.id) : false;

  if (!board.isPublic && !isMember) {
    throw new Error("Board not found.");
  }

  const counts = await getBoardCounts([board.id]);
  const sources = await getBoardSources(board.id);
  const initialEvents = await getBoardEvents(board.id, null, 20);
  const recentEvents = await getBoardEvents(board.id, null, 90, BOARD_WINDOW_HOURS);

  return {
    signedIn: Boolean(clerkUserId),
    board: {
      id: board.id,
      slug: board.slug,
      name: board.name,
      description: board.description,
      isPublic: board.isPublic,
      memberCount: counts.get(board.id)?.members ?? 0,
      sourceCount: counts.get(board.id)?.sources ?? 0
    },
    isMember,
    sources,
    sourceNodes: buildSourceNodes(sources, recentEvents),
    summary: buildBoardSummary(recentEvents, sources.length),
    timelineBuckets: buildActivityBuckets(recentEvents, BOARD_WINDOW_HOURS, BOARD_BUCKETS),
    topActors: buildTopActors(recentEvents, 5),
    initialEvents
  };
}

export async function getBoardSnapshotBySlug(
  slug: string,
  since: string | null,
  clerkUserId: string | null
): Promise<BoardSnapshot> {
  const board = await getBoardBySlug(slug);
  const isMember = clerkUserId ? await isBoardMember(clerkUserId, board.id) : false;

  if (!board.isPublic && !isMember) {
    throw new Error("Board not found.");
  }

  const sources = await getBoardSources(board.id);
  const [events, recentEvents] = await Promise.all([
    getBoardEvents(board.id, since, 40),
    getBoardEvents(board.id, null, 90, BOARD_WINDOW_HOURS)
  ]);

  return {
    events: events.reverse(),
    summary: buildBoardSummary(recentEvents, sources.length),
    timelineBuckets: buildActivityBuckets(recentEvents, BOARD_WINDOW_HOURS, BOARD_BUCKETS),
    sourceNodes: buildSourceNodes(sources, recentEvents),
    serverTime: new Date().toISOString()
  };
}

export async function getBoardEventsBySlug(slug: string, since: string | null, clerkUserId: string | null, limit = 50) {
  const board = await getBoardBySlug(slug);
  const isMember = clerkUserId ? await isBoardMember(clerkUserId, board.id) : false;

  if (!board.isPublic && !isMember) {
    throw new Error("Board not found.");
  }

  return getBoardEvents(board.id, since, limit);
}

async function getBoardBySlug(slug: string): Promise<BoardRecord> {
  const supabase = getServiceRoleClient();
  const { data: board, error } = await supabase
    .from("boards")
    .select("id, slug, name, description, is_public")
    .eq("slug", slug)
    .single();

  if (error || !board) {
    throw new Error(error?.message ?? "Board not found.");
  }

  return {
    id: String(board.id),
    slug: String(board.slug),
    name: String(board.name),
    description: (board.description as string | null) ?? null,
    isPublic: Boolean(board.is_public)
  };
}

async function getBoardEvents(
  boardId: string,
  since: string | null,
  limit: number,
  withinHours?: number
): Promise<BoardEvent[]> {
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

  if (withinHours) {
    query = query.gte("created_at", hoursAgo(withinHours + 24));
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

      const eventType = String(event.event_type);

      return {
        id: String(event.id),
        githubEventId: String(event.github_event_id),
        eventType,
        eventKind: mapEventKind(eventType),
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
    .filter((row): row is BoardEvent => row !== null)
    .filter((row) => !withinHours || new Date(row.occurredAt).getTime() >= Date.now() - withinHours * 60 * 60 * 1000);
}

async function getBoardEventsForBoards(boardIds: string[], withinHours: number) {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("board_events")
    .select(
      `
      board_id,
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
    .in("board_id", boardIds)
    .gte("created_at", hoursAgo(withinHours + 24))
    .order("created_at", { ascending: false })
    .limit(500);

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

      const eventType = String(event.event_type);

      return {
        boardId: String(row.board_id),
        event: {
          id: String(event.id),
          githubEventId: String(event.github_event_id),
          eventType,
          eventKind: mapEventKind(eventType),
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
        } satisfies BoardEvent
      };
    })
    .filter((row): row is { boardId: string; event: BoardEvent } => row !== null)
    .filter((row) => new Date(row.event.occurredAt).getTime() >= Date.now() - withinHours * 60 * 60 * 1000);
}

async function getBoardSources(boardId: string): Promise<BoardSource[]> {
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

async function getBoardSourcePreview(boardIds: string[]) {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("board_sources")
    .select(
      `
      board_id,
      source:sources!board_sources_source_id_fkey(
        id,
        type,
        value,
        display_name
      )
    `
    )
    .in("board_id", boardIds);

  if (error) {
    throw new Error(error.message);
  }

  const grouped = new Map<string, BoardSource[]>();

  for (const row of data ?? []) {
    const source = asObject(row.source);
    if (!source) {
      continue;
    }

    const boardId = String(row.board_id);
    const current = grouped.get(boardId) ?? [];
    current.push({
      id: String(source.id),
      type: source.type as "user" | "repo",
      value: String(source.value),
      displayName: String(source.display_name)
    });
    grouped.set(boardId, current);
  }

  return grouped;
}

function toBoardListItem(
  board: BoardRecord,
  joined: boolean,
  counts: Map<string, { members: number; sources: number }>,
  events: BoardEvent[],
  trackedSources: BoardSource[]
): BoardListItem {
  const countEntry = counts.get(board.id) ?? { members: 0, sources: 0 };
  const repoSourceCount = trackedSources.filter((source) => source.type === "repo").length;
  const userSourceCount = trackedSources.filter((source) => source.type === "user").length;

  return {
    id: board.id,
    slug: board.slug,
    name: board.name,
    description: board.description,
    isPublic: board.isPublic,
    memberCount: countEntry.members,
    sourceCount: countEntry.sources,
    trackedSources: trackedSources.slice(0, 4),
    repoSourceCount,
    userSourceCount,
    joined,
    summary: buildBoardSummary(events, countEntry.sources),
    timeline: buildActivityBuckets(events, DASHBOARD_WINDOW_HOURS, 6)
  };
}

function buildDashboardOverview(
  boards: BoardListItem[],
  recentEvents: Array<{ boardId: string; event: BoardEvent }>,
  trackedSources: number
): DashboardOverview {
  const events = recentEvents.map((row) => row.event);
  const joinedBoards = boards.filter((board) => board.joined);

  return {
    totalBoards: boards.length,
    joinedBoards: joinedBoards.length,
    trackedSources,
    liveEvents24h: events.length,
    skyline: buildActivityBuckets(events, DASHBOARD_WINDOW_HOURS, DASHBOARD_BUCKETS),
    actorLeaders: buildTopActors(events, 6),
    eventMix: buildMix(events)
  };
}

function buildBoardSummary(events: BoardEvent[], sourceCount: number): BoardSummary {
  const uniqueActors = new Set(events.map((event) => event.actorLogin).filter(Boolean));
  const latestEventAt = events.reduce<string | null>((latest, event) => {
    if (!latest) {
      return event.occurredAt;
    }

    return new Date(event.occurredAt).getTime() > new Date(latest).getTime() ? event.occurredAt : latest;
  }, null);

  return {
    totalEvents: events.length,
    recentEvents: events.filter((event) => new Date(event.occurredAt).getTime() >= Date.now() - 60 * 60 * 1000).length,
    liveSources: Math.max(
      events.reduce((sum, event, index, all) => {
        if (all.findIndex((candidate) => candidate.source.id === event.source.id) === index) {
          return sum + 1;
        }

        return sum;
      }, 0),
      sourceCount ? 1 : 0
    ),
    uniqueActors: uniqueActors.size,
    latestEventAt,
    mix: buildMix(events)
  };
}

function buildActivityBuckets(events: BoardEvent[], hoursWindow: number, bucketCount: number): ActivityBucket[] {
  const now = Date.now();
  const start = now - hoursWindow * 60 * 60 * 1000;
  const bucketSize = (hoursWindow * 60 * 60 * 1000) / bucketCount;
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = new Date(start + index * bucketSize);

    return {
      label: index === bucketCount - 1 ? "now" : formatBucketLabel(bucketStart, bucketSize),
      bucketStart: bucketStart.toISOString(),
      total: 0,
      push: 0,
      pull_request: 0,
      issue: 0,
      comment: 0,
      release: 0,
      watch: 0,
      fork: 0,
      other: 0
    } satisfies ActivityBucket;
  });

  for (const event of events) {
    const time = new Date(event.occurredAt).getTime();

    if (time < start || time > now) {
      continue;
    }

    const relativeIndex = Math.min(bucketCount - 1, Math.floor((time - start) / bucketSize));
    const bucket = buckets[Math.max(0, relativeIndex)];
    bucket.total += 1;
    bucket[event.eventKind] += 1;
  }

  return buckets;
}

function buildSourceNodes(sources: BoardSource[], events: BoardEvent[]): SourceNode[] {
  return sources.map((source) => {
    const sourceEvents = events.filter((event) => event.source.id === source.id);

    return {
      ...source,
      activityCount: sourceEvents.length,
      latestEventAt: sourceEvents[0]?.occurredAt ?? null,
      pulseScore: Math.max(12, Math.min(100, sourceEvents.length * 18))
    };
  });
}

function buildTopActors(events: BoardEvent[], limit: number): TopActor[] {
  const counts = new Map<string, number>();

  for (const event of events) {
    if (!event.actorLogin) {
      continue;
    }

    counts.set(event.actorLogin, (counts.get(event.actorLogin) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([login, count]) => ({ login, count }));
}

function buildMix(events: BoardEvent[]): EventMixItem[] {
  const total = events.length || 1;
  const counts = new Map<EventKind, number>([
    ["push", 0],
    ["pull_request", 0],
    ["issue", 0],
    ["comment", 0],
    ["release", 0],
    ["watch", 0],
    ["fork", 0],
    ["other", 0]
  ]);

  for (const event of events) {
    counts.set(event.eventKind, (counts.get(event.eventKind) ?? 0) + 1);
  }

  return [
    ["push", "Commits"],
    ["pull_request", "PRs"],
    ["issue", "Issues"],
    ["comment", "Comments"],
    ["release", "Releases"],
    ["watch", "Stars"],
    ["fork", "Forks"],
    ["other", "Other"]
  ]
    .map(([kind, label]) => ({
      kind: kind as EventKind,
      label,
      count: counts.get(kind as EventKind) ?? 0,
      share: Math.round(((counts.get(kind as EventKind) ?? 0) / total) * 100)
    }))
    .filter((item) => item.count > 0);
}

function groupEventsByBoard(events: Array<{ boardId: string; event: BoardEvent }>) {
  const grouped = new Map<string, BoardEvent[]>();

  for (const row of events) {
    const existing = grouped.get(row.boardId) ?? [];
    existing.push(row.event);
    grouped.set(row.boardId, existing);
  }

  return grouped;
}

function countTrackedSources(counts: Map<string, { members: number; sources: number }>, boardIds: string[]) {
  return boardIds.reduce((sum, boardId) => sum + (counts.get(boardId)?.sources ?? 0), 0);
}

function mapEventKind(eventType: string): EventKind {
  switch (eventType) {
    case "PushEvent":
      return "push";
    case "PullRequestEvent":
      return "pull_request";
    case "IssuesEvent":
      return "issue";
    case "IssueCommentEvent":
      return "comment";
    case "ReleaseEvent":
      return "release";
    case "WatchEvent":
      return "watch";
    case "ForkEvent":
      return "fork";
    default:
      return "other";
  }
}

function formatBucketLabel(date: Date, bucketSize: number) {
  if (bucketSize >= 60 * 60 * 1000) {
    return date.toLocaleTimeString([], { hour: "numeric" });
  }

  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
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
