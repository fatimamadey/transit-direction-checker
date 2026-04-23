export type SourceType = "user" | "repo";

export type SourceRecord = {
  id: string;
  type: SourceType;
  value: string;
  display_name: string;
  last_etag: string | null;
  last_polled_at: string | null;
  next_poll_at: string;
  poll_interval_seconds: number;
  last_status_code: number | null;
  last_error: string | null;
};

export type GitHubEventRecord = {
  id: string;
  github_event_id: string;
  source_id: string;
  event_type: string;
  actor_login: string | null;
  repo_name: string | null;
  subject_title: string | null;
  subject_url: string | null;
  occurred_at: string;
  payload: Record<string, unknown>;
};

export type BoardRecord = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  created_by_user_id: string;
  created_at: string;
};
