import type { SourceRecord } from "@take-this-one/shared";
import { pollGitHubSource } from "./github";
import { normalizeGitHubEvent } from "./normalize";
import { supabase } from "./db";
import { config } from "./config";

export async function pollOnce() {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .lte("next_poll_at", now)
    .order("next_poll_at", { ascending: true })
    .limit(config.sourceBatchSize);

  if (error) {
    throw new Error(error.message);
  }

  const sources = (data ?? []) as SourceRecord[];

  if (!sources.length) {
    console.log("No due sources found.");
    return;
  }

  for (const source of sources) {
    await pollSource(source);
  }
}

async function pollSource(source: SourceRecord) {
  try {
    const result = await pollGitHubSource(source);

    if (result.kind === "not_modified") {
      await updateSourceAfterPoll(source.id, {
        last_polled_at: new Date().toISOString(),
        next_poll_at: nextPollTime(result.pollIntervalSeconds),
        poll_interval_seconds: result.pollIntervalSeconds,
        last_status_code: result.status,
        last_error: null
      });
      return;
    }

    const boardIds = await getBoardIdsForSource(source.id);

    for (const rawEvent of result.events) {
      const normalized = normalizeGitHubEvent(rawEvent, source);

      if (!normalized) {
        continue;
      }

      const eventId = await upsertEvent(source.id, normalized);

      if (!eventId || !boardIds.length) {
        continue;
      }

      const fanoutRows = boardIds.map((boardId) => ({
        board_id: boardId,
        event_id: eventId,
        source_id: source.id
      }));

      const { error: boardEventsError } = await supabase
        .from("board_events")
        .upsert(fanoutRows, { onConflict: "board_id,event_id" });

      if (boardEventsError) {
        console.error(`Failed to attach events to boards for source ${source.value}:`, boardEventsError.message);
      }
    }

    await updateSourceAfterPoll(source.id, {
      last_etag: result.etag,
      last_polled_at: new Date().toISOString(),
      next_poll_at: nextPollTime(result.pollIntervalSeconds),
      poll_interval_seconds: result.pollIntervalSeconds,
      last_status_code: result.status,
      last_error: null
    });
  } catch (error) {
    console.error(`Polling failed for source ${source.type}:${source.value}:`, error);

    await updateSourceAfterPoll(source.id, {
      last_polled_at: new Date().toISOString(),
      next_poll_at: nextPollTime(Math.max(source.poll_interval_seconds, 120)),
      last_status_code: 500,
      last_error: error instanceof Error ? error.message : "Unknown worker error"
    });
  }
}

async function getBoardIdsForSource(sourceId: string) {
  const { data, error } = await supabase.from("board_sources").select("board_id").eq("source_id", sourceId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => row.board_id as string);
}

async function upsertEvent(
  sourceId: string,
  normalized: {
    githubEventId: string;
    eventType: string;
    actorLogin: string | null;
    repoName: string | null;
    subjectTitle: string | null;
    subjectUrl: string | null;
    occurredAt: string;
    payload: Record<string, unknown>;
  }
) {
  const { data, error } = await supabase
    .from("events")
    .upsert(
      {
        github_event_id: normalized.githubEventId,
        source_id: sourceId,
        event_type: normalized.eventType,
        actor_login: normalized.actorLogin,
        repo_name: normalized.repoName,
        subject_title: normalized.subjectTitle,
        subject_url: normalized.subjectUrl,
        occurred_at: normalized.occurredAt,
        payload: normalized.payload
      },
      {
        onConflict: "github_event_id"
      }
    )
    .select("id")
    .single();

  if (error) {
    console.error(`Failed to upsert GitHub event ${normalized.githubEventId}:`, error.message);
    return null;
  }

  return data.id as string;
}

async function updateSourceAfterPoll(sourceId: string, values: Record<string, unknown>) {
  const { error } = await supabase.from("sources").update(values).eq("id", sourceId);

  if (error) {
    console.error(`Failed to update source ${sourceId}:`, error.message);
  }
}

function nextPollTime(intervalSeconds: number) {
  return new Date(Date.now() + intervalSeconds * 1000).toISOString();
}
