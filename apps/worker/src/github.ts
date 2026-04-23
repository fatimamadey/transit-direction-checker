import { getGitHubEventsUrl, type SourceRecord } from "@take-this-one/shared";
import { config } from "./config";

export type GitHubPollResult =
  | {
      kind: "not_modified";
      pollIntervalSeconds: number;
      status: 304;
    }
  | {
      kind: "ok";
      events: Record<string, unknown>[];
      etag: string | null;
      pollIntervalSeconds: number;
      status: 200;
    };

export async function pollGitHubSource(source: SourceRecord): Promise<GitHubPollResult> {
  const response = await fetch(getGitHubEventsUrl(source.type, source.value), {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.githubToken}`,
      "User-Agent": "Pulseboard-Worker",
      ...(source.last_etag ? { "If-None-Match": source.last_etag } : {})
    }
  });

  const pollIntervalSeconds = Number(
    response.headers.get("X-Poll-Interval") ?? String(config.defaultSourcePollIntervalSeconds)
  );

  if (response.status === 304) {
    return {
      kind: "not_modified",
      pollIntervalSeconds,
      status: 304
    };
  }

  if (!response.ok) {
    throw new Error(`GitHub request failed with ${response.status}`);
  }

  const events = (await response.json()) as Record<string, unknown>[];

  return {
    kind: "ok",
    events,
    etag: response.headers.get("ETag"),
    pollIntervalSeconds,
    status: 200
  };
}
