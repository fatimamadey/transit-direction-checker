import type { SourceRecord } from "@take-this-one/shared";

export type NormalizedGitHubEvent = {
  githubEventId: string;
  eventType: string;
  actorLogin: string | null;
  repoName: string | null;
  subjectTitle: string | null;
  subjectUrl: string | null;
  occurredAt: string;
  payload: Record<string, unknown>;
};

type GitHubActor = {
  login?: string;
};

type GitHubRepo = {
  name?: string;
};

type GitHubEventPayload = {
  action?: string;
  ref?: string;
  commits?: Array<{ message?: string }>;
  issue?: { title?: string; html_url?: string };
  pull_request?: { title?: string; html_url?: string };
  comment?: { html_url?: string };
  release?: { name?: string; html_url?: string };
};

type GitHubEvent = {
  id?: string;
  type?: string;
  actor?: GitHubActor;
  repo?: GitHubRepo;
  created_at?: string;
  payload?: GitHubEventPayload;
};

export function normalizeGitHubEvent(
  rawEvent: Record<string, unknown>,
  source: SourceRecord
): NormalizedGitHubEvent | null {
  const event = rawEvent as GitHubEvent;

  if (!event.id || !event.type || !event.created_at) {
    return null;
  }

  return {
    githubEventId: String(event.id),
    eventType: String(event.type),
    actorLogin: event.actor?.login ?? null,
    repoName: event.repo?.name ?? (source.type === "repo" ? source.value : null),
    subjectTitle: buildSubjectTitle(event),
    subjectUrl: buildSubjectUrl(event),
    occurredAt: String(event.created_at),
    payload: rawEvent
  };
}

function buildSubjectTitle(event: GitHubEvent) {
  switch (event.type) {
    case "PushEvent":
      return `${event.payload?.commits?.length ?? 0} commit${(event.payload?.commits?.length ?? 0) === 1 ? "" : "s"} pushed`;
    case "PullRequestEvent":
      return event.payload?.pull_request?.title ?? `${event.payload?.action ?? "updated"} pull request`;
    case "IssuesEvent":
      return event.payload?.issue?.title ?? `${event.payload?.action ?? "updated"} issue`;
    case "IssueCommentEvent":
      return `${event.payload?.action ?? "updated"} issue comment`;
    case "ReleaseEvent":
      return event.payload?.release?.name ?? "published release";
    case "WatchEvent":
      return "starred repository";
    case "ForkEvent":
      return "forked repository";
    default:
      return event.type ?? "GitHub event";
  }
}

function buildSubjectUrl(event: GitHubEvent) {
  return (
    event.payload?.pull_request?.html_url ??
    event.payload?.issue?.html_url ??
    event.payload?.comment?.html_url ??
    event.payload?.release?.html_url ??
    null
  );
}
