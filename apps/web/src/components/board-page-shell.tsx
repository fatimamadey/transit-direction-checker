"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { BoardEvent, BoardPageData } from "@/types/dashboard";

export function BoardPageShell({ data }: { data: BoardPageData }) {
  const [events, setEvents] = useState(data.initialEvents);
  const [sourceType, setSourceType] = useState<"user" | "repo">("repo");
  const [sourceValue, setSourceValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function joinBoard() {
    setError(null);
    const response = await fetch(`/api/boards/${data.board.slug}/join`, { method: "POST" });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Could not join board.");
      return;
    }

    router.refresh();
  }

  async function addSource() {
    setError(null);
    const response = await fetch(`/api/boards/${data.board.slug}/sources`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: sourceType,
        value: sourceValue
      })
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Could not add source.");
      return;
    }

    setSourceValue("");
    router.refresh();
  }

  useBoardPolling(data.board.slug, events, setEvents);

  return (
    <div className="space-y-8">
      <header className="rounded-[2.4rem] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_25px_70px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Board</p>
            <h1 className="text-4xl font-black text-slate-900 sm:text-5xl">{data.board.name}</h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              {data.board.description ?? "A shared GitHub activity board."}
            </p>
            <div className="flex flex-wrap gap-3 text-sm font-medium text-slate-600">
              <span className="rounded-full bg-white/80 px-4 py-2">{data.board.memberCount} members</span>
              <span className="rounded-full bg-white/80 px-4 py-2">{data.board.sourceCount} sources</span>
              <span className="rounded-full bg-white/80 px-4 py-2">Poll-based live feed</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {!data.isMember ? (
              <button
                className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                onClick={() => startTransition(() => void joinBoard())}
                type="button"
              >
                {isPending ? "Joining..." : "Join board"}
              </button>
            ) : (
              <div className="rounded-full bg-emerald-100 px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-emerald-800">
                Joined
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-[var(--border)] bg-white/85 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
            <h2 className="text-2xl font-black text-slate-900">Tracked sources</h2>
            <div className="mt-4 space-y-3">
              {data.sources.length ? (
                data.sources.map((source) => (
                  <div key={source.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{source.type}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{source.displayName}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-600">No sources yet.</p>
              )}
            </div>
          </div>

          {data.isMember ? (
            <form
              className="rounded-[2rem] border border-[var(--border)] bg-white/85 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]"
              onSubmit={(event) => {
                event.preventDefault();
                startTransition(() => void addSource());
              }}
            >
              <h2 className="text-2xl font-black text-slate-900">Add source</h2>
              <div className="mt-4 space-y-4">
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  onChange={(event) => setSourceType(event.target.value as "user" | "repo")}
                  value={sourceType}
                >
                  <option value="repo">Repository</option>
                  <option value="user">User</option>
                </select>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  onChange={(event) => setSourceValue(event.target.value)}
                  placeholder={sourceType === "repo" ? "vercel/next.js" : "gaearon"}
                  required
                  value={sourceValue}
                />
                {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
                <button
                  className="w-full rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  disabled={isPending}
                  type="submit"
                >
                  {isPending ? "Saving..." : "Add source"}
                </button>
              </div>
            </form>
          ) : null}
        </aside>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-slate-900">Activity feed</h2>
            <p className="text-sm font-medium text-slate-500">GitHub can lag by 30s to a few minutes</p>
          </div>

          <div className="space-y-4">
            {events.length ? (
              events.map((event) => <BoardEventCard event={event} key={event.id} />)
            ) : (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 p-8 text-slate-600">
                No events yet. Add a GitHub user or repository and the worker will start filling this feed.
              </div>
            )}
          </div>
        </section>
      </section>
    </div>
  );
}

function BoardEventCard({ event }: { event: BoardEvent }) {
  return (
    <article className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
              {event.eventType}
            </span>
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
              {event.source.type}: {event.source.value}
            </span>
          </div>
          <h3 className="text-2xl font-black text-slate-900">{event.subjectTitle ?? event.eventType}</h3>
          <p className="text-slate-600">
            {event.actorLogin ?? "unknown"} on {event.repoName ?? event.source.displayName}
          </p>
        </div>

        <div className="text-sm font-medium text-slate-500">{formatRelative(event.occurredAt)}</div>
      </div>

      {event.subjectUrl ? (
        <a
          className="mt-4 inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-500"
          href={event.subjectUrl}
          rel="noreferrer"
          target="_blank"
        >
          Open on GitHub
        </a>
      ) : null}
    </article>
  );
}

function useBoardPolling(
  slug: string,
  initialEvents: BoardEvent[],
  setEvents: React.Dispatch<React.SetStateAction<BoardEvent[]>>
) {
  const [latestSeen, setLatestSeen] = useState(initialEvents[0]?.boardEventCreatedAt ?? null);

  useEffect(() => {
    setLatestSeen(initialEvents[0]?.boardEventCreatedAt ?? null);
  }, [initialEvents]);

  useEffect(() => {
    if (!slug) {
      return;
    }

    const interval = window.setInterval(async () => {
      const currentCursor = latestSeen;
      const query = currentCursor ? `?since=${encodeURIComponent(currentCursor)}` : "";
      const response = await fetch(`/api/boards/${slug}/events${query}`);

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { events: BoardEvent[] };

      if (!payload.events.length) {
        return;
      }

      const newestSeen = payload.events[payload.events.length - 1]?.boardEventCreatedAt ?? currentCursor;

      setEvents((current) => {
        const seen = new Set(current.map((event) => event.id));
        const incoming = payload.events.filter((event) => !seen.has(event.id));
        return incoming.length ? [...incoming.reverse(), ...current] : current;
      });

      setLatestSeen(newestSeen);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [latestSeen, setEvents, slug]);
}

function formatRelative(timestamp: string) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000));

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.floor(hours / 24)}d ago`;
}
