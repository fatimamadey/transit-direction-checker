export type EventKind = "push" | "pull_request" | "issue" | "comment" | "release" | "watch" | "fork" | "other";

export type ActivityBucket = {
  label: string;
  bucketStart: string;
  total: number;
  push: number;
  pull_request: number;
  issue: number;
  comment: number;
  release: number;
  watch: number;
  fork: number;
  other: number;
};

export type EventMixItem = {
  kind: EventKind;
  label: string;
  count: number;
  share: number;
};

export type BoardSource = {
  id: string;
  type: "user" | "repo";
  value: string;
  displayName: string;
};

export type TopActor = {
  login: string;
  count: number;
};

export type BoardEvent = {
  id: string;
  githubEventId: string;
  eventType: string;
  eventKind: EventKind;
  actorLogin: string | null;
  repoName: string | null;
  subjectTitle: string | null;
  subjectUrl: string | null;
  occurredAt: string;
  boardEventCreatedAt: string;
  source: BoardSource;
};

export type BoardSummary = {
  totalEvents: number;
  recentEvents: number;
  liveSources: number;
  uniqueActors: number;
  latestEventAt: string | null;
  mix: EventMixItem[];
};

export type BoardListItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  memberCount: number;
  sourceCount: number;
  trackedSources: BoardSource[];
  repoSourceCount: number;
  userSourceCount: number;
  joined: boolean;
  summary: BoardSummary;
  timeline: ActivityBucket[];
};

export type DashboardOverview = {
  totalBoards: number;
  joinedBoards: number;
  trackedSources: number;
  liveEvents24h: number;
  skyline: ActivityBucket[];
};

export type DashboardData = {
  overview: DashboardOverview;
  joinedBoards: BoardListItem[];
  publicBoards: BoardListItem[];
};

export type BoardPageData = {
  signedIn: boolean;
  board: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    memberCount: number;
    sourceCount: number;
  };
  isMember: boolean;
  sources: BoardSource[];
  summary: BoardSummary;
  timelineBuckets: ActivityBucket[];
  topActors: TopActor[];
  initialEvents: BoardEvent[];
};

export type BoardSnapshot = {
  events: BoardEvent[];
  summary: BoardSummary;
  timelineBuckets: ActivityBucket[];
  serverTime: string;
};
