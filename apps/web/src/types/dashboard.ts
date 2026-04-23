export type BoardListItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  memberCount: number;
  sourceCount: number;
  joined: boolean;
};

export type DashboardData = {
  joinedBoards: BoardListItem[];
  publicBoards: BoardListItem[];
};

export type BoardSource = {
  id: string;
  type: "user" | "repo";
  value: string;
  displayName: string;
};

export type BoardEvent = {
  id: string;
  githubEventId: string;
  eventType: string;
  actorLogin: string | null;
  repoName: string | null;
  subjectTitle: string | null;
  subjectUrl: string | null;
  occurredAt: string;
  boardEventCreatedAt: string;
  source: BoardSource;
};

export type BoardPageData = {
  board: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    memberCount: number;
    sourceCount: number;
  };
  isMember: boolean;
  sources: BoardSource[];
  initialEvents: BoardEvent[];
};
