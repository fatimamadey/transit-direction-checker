"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import type { BoardEvent, BoardPageData, BoardSnapshot, EventMixItem } from "@/types/dashboard";

export function BoardPageShell({ data }: { data: BoardPageData }) {
  const [hasMounted, setHasMounted] = useState(false);
  const [events, setEvents] = useState(data.initialEvents);
  const [summary, setSummary] = useState(data.summary);
  const [timelineBuckets, setTimelineBuckets] = useState(data.timelineBuckets);
  const [boardName, setBoardName] = useState(data.board.name);
  const [boardDescription, setBoardDescription] = useState(data.board.description ?? "");
  const [isPublic, setIsPublic] = useState(data.board.isPublic);
  const [sourceType, setSourceType] = useState<"user" | "repo">("repo");
  const [sourceValue, setSourceValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const timeline = useMemo(
    () =>
      timelineBuckets.map((bucket) => ({
        label: bucket.label,
        total: bucket.total,
        push: bucket.push,
        pull_request: bucket.pull_request,
        issue: bucket.issue
      })),
    [timelineBuckets]
  );

  useEffect(() => {
    setHasMounted(true);
  }, []);

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

  async function saveBoard() {
    setError(null);
    const response = await fetch(`/api/boards/${data.board.slug}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: boardName,
        description: boardDescription,
        isPublic
      })
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Could not update board.");
      return;
    }

    router.refresh();
  }

  useBoardPolling(data.board.slug, events, setEvents, setSummary, setTimelineBuckets);

  return (
    <div className="animate-panel-in grid gap-4 xl:grid-cols-[250px_minmax(0,1fr)_320px]">
      <aside className="space-y-4">
        <div className="panel rounded-[28px] p-5">
          <div className="border-b border-white/8 pb-4">
            <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">tracked sources</p>
            <h2 className="mt-1 text-lg font-semibold text-white">{data.sources.length} sources</h2>
          </div>
          <div className="mt-4 space-y-3">
            {data.sources.length ? (
              data.sources.map((source) => (
                <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3" key={source.id}>
                  <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">{source.type}</p>
                  <p className="mt-1 text-sm font-medium text-white">{source.displayName}</p>
                </div>
              ))
            ) : (
              <EmptyPanel copy="No sources yet." />
            )}
          </div>
        </div>

        {data.isMember ? (
          <form
            className="panel rounded-[28px] p-5"
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(() => void addSource());
            }}
          >
            <div className="border-b border-white/8 pb-4">
              <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">add source</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Repo or user</h2>
            </div>
            <div className="mt-4 space-y-4">
              <select
                className="w-full rounded-[16px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
                onChange={(event) => setSourceType(event.target.value as "user" | "repo")}
                value={sourceType}
              >
                <option value="repo">Repository</option>
                <option value="user">User</option>
              </select>
              <input
                className="w-full rounded-[16px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
                onChange={(event) => setSourceValue(event.target.value)}
                placeholder={sourceType === "repo" ? "vercel/next.js" : "gaearon"}
                required
                value={sourceValue}
              />
              {error ? <p className="text-sm font-medium text-rose-300">{error}</p> : null}
              <button
                className="w-full rounded-full bg-[linear-gradient(135deg,#ff4fd8,#7c5cff)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(255,79,216,0.35)] transition hover:opacity-95 disabled:opacity-60"
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
        <header className="panel-strong rounded-[28px] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/8 pb-4">
            <div>
              <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">board</p>
              <h1 className="mt-1 text-2xl font-semibold text-white">{data.board.name}</h1>
              {data.board.description ? <p className="mt-2 max-w-2xl text-sm leading-7 text-violet-100/70">{data.board.description}</p> : null}
            </div>
            {!data.isMember ? (
              data.signedIn ? (
                <button
                  className="rounded-full bg-[linear-gradient(135deg,#ff4fd8,#7c5cff)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(255,79,216,0.35)] transition hover:opacity-95"
                  onClick={() => startTransition(() => void joinBoard())}
                  type="button"
                >
                  {isPending ? "Joining..." : "Join board"}
                </button>
              ) : (
                <a
                  className="rounded-full bg-[linear-gradient(135deg,#ff4fd8,#7c5cff)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(255,79,216,0.35)] transition hover:opacity-95"
                  href={`/sign-in?redirect_url=${encodeURIComponent(`/boards/${data.board.slug}`)}`}
                >
                  Sign in to join
                </a>
              )
            ) : (
              <div className="mono rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-[10px] uppercase tracking-[0.22em] text-emerald-200">
                joined
              </div>
            )}
          </div>

          <div className="mt-4 h-24 rounded-[20px] border border-white/8 bg-[#120f22] px-3 py-2">
            {hasMounted ? (
              <ResponsiveContainer height="100%" minHeight={72} minWidth={0} width="100%">
                <AreaChart data={timeline}>
                  <defs>
                    <linearGradient id="board-timeline-total" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#5fe1ff" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#5fe1ff" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <Area dataKey="total" fill="url(#board-timeline-total)" stroke="#5fe1ff" strokeWidth={1.8} type="monotone" />
                  <Area dataKey="pull_request" fill="none" stroke="#ff4fd8" strokeWidth={1.4} type="monotone" />
                  <Area dataKey="issue" fill="none" stroke="#ffb84c" strokeWidth={1.4} type="monotone" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-[12px] bg-white/[0.03]" />
            )}
          </div>
        </header>

        <section className="panel rounded-[28px] p-5">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/8 pb-4">
            <div>
              <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">recent activity</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Event feed</h2>
            </div>
            <div className="mono text-[11px] uppercase tracking-[0.22em] text-cyan-200/70">
              {summary.latestEventAt ? `last seen ${formatRelative(summary.latestEventAt)}` : "waiting for events"}
            </div>
          </div>

          <div className="mt-2 space-y-1">
            {events.length ? (
              events.map((event) => <EventLogRow event={event} key={event.id} />)
            ) : (
              <EmptyPanel copy="No events yet. Add a source and let the worker fill the feed." />
            )}
          </div>
        </section>
      </section>

      <aside className="space-y-4">
        <div className="panel rounded-[28px] p-5">
          <div className="border-b border-white/8 pb-4">
            <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">summary</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Board status</h2>
          </div>
          <div className="mt-4 space-y-3">
            <SummaryLine label="visibility" value={data.board.isPublic ? "public" : "private"} />
            <SummaryLine label="members" value={String(data.board.memberCount)} />
            <SummaryLine label="sources" value={String(data.board.sourceCount)} />
            <SummaryLine label="events 24h" value={String(summary.totalEvents)} accent />
            <SummaryLine label="events 1h" value={String(summary.recentEvents)} accent />
            <SummaryLine label="actors" value={String(summary.uniqueActors)} />
          </div>
        </div>

        <div className="panel rounded-[28px] p-5">
          <div className="border-b border-white/8 pb-4">
            <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">activity mix</p>
            <h2 className="mt-1 text-lg font-semibold text-white">What is happening</h2>
          </div>
          <div className="mt-4 space-y-3">
            {summary.mix.length ? summary.mix.map((item) => <MixBar item={item} key={item.kind} />) : <EmptyPanel copy="No mix yet." />}
          </div>
        </div>

        <div className="panel rounded-[28px] p-5">
          <div className="border-b border-white/8 pb-4">
            <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">top actors</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Most active</h2>
          </div>
          <div className="mt-4 space-y-3">
            {data.topActors.length ? (
              data.topActors.map((actor, index) => (
                <div className="flex items-center justify-between rounded-[16px] border border-white/8 bg-white/[0.03] px-4 py-3" key={actor.login}>
                  <div>
                    <p className="text-sm font-medium text-white">{actor.login}</p>
                    <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">#{index + 1}</p>
                  </div>
                  <span className="mono text-sm text-cyan-200">{actor.count}</span>
                </div>
              ))
            ) : (
              <EmptyPanel copy="No active users yet." />
            )}
          </div>
        </div>

        {data.isMember ? (
          <form
            className="panel rounded-[28px] p-5"
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(() => void saveBoard());
            }}
          >
            <div className="border-b border-white/8 pb-4">
              <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">board settings</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Edit board</h2>
            </div>
            <div className="mt-4 space-y-4">
              <input
                className="w-full rounded-[16px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
                onChange={(event) => setBoardName(event.target.value)}
                value={boardName}
              />
              <textarea
                className="min-h-24 w-full rounded-[16px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
                onChange={(event) => setBoardDescription(event.target.value)}
                value={boardDescription}
              />
              <label className="flex items-center justify-between rounded-[16px] border border-white/10 bg-white/5 px-4 py-3">
                <div>
                  <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">Visibility</p>
                  <p className="mt-1 text-sm text-violet-100/70">{isPublic ? "Anyone can join." : "Members only."}</p>
                </div>
                <button
                  aria-pressed={isPublic}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isPublic
                      ? "bg-[linear-gradient(135deg,#ff4fd8,#7c5cff)] text-white shadow-[0_14px_40px_rgba(255,79,216,0.25)]"
                      : "border border-white/12 bg-white/5 text-white hover:border-cyan-300/35 hover:bg-cyan-300/10"
                  }`}
                  onClick={() => setIsPublic((current) => !current)}
                  type="button"
                >
                  {isPublic ? "Public" : "Private"}
                </button>
              </label>
              {error ? <p className="text-sm font-medium text-rose-300">{error}</p> : null}
              <button
                className="w-full rounded-full border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/35 hover:bg-cyan-300/10 disabled:opacity-60"
                disabled={isPending}
                type="submit"
              >
                {isPending ? "Saving..." : "Save board details"}
              </button>
            </div>
          </form>
        ) : null}
      </aside>
    </div>
  );
}

function useBoardPolling(
  slug: string,
  initialEvents: BoardEvent[],
  setEvents: React.Dispatch<React.SetStateAction<BoardEvent[]>>,
  setSummary: React.Dispatch<React.SetStateAction<BoardPageData["summary"]>>,
  setTimelineBuckets: React.Dispatch<React.SetStateAction<BoardPageData["timelineBuckets"]>>
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
      const query = latestSeen ? `?since=${encodeURIComponent(latestSeen)}` : "";
      const response = await fetch(`/api/boards/${slug}/snapshot${query}`);

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as BoardSnapshot;
      setSummary(payload.summary);
      setTimelineBuckets(payload.timelineBuckets);

      if (!payload.events.length) {
        return;
      }

      const newestSeen = payload.events[payload.events.length - 1]?.boardEventCreatedAt ?? latestSeen;

      setEvents((current) => {
        const seen = new Set(current.map((event) => event.id));
        const incoming = payload.events.filter((event) => !seen.has(event.id));
        return incoming.length ? [...incoming.reverse(), ...current].slice(0, 28) : current;
      });

      setLatestSeen(newestSeen);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [latestSeen, setEvents, setSummary, setTimelineBuckets, slug]);
}

function EventLogRow({ event }: { event: BoardEvent }) {
  return (
    <article className="animate-ticker-slide rounded-[18px] border border-white/8 bg-[#120f22]/94 px-4 py-4 transition hover:border-cyan-300/25">
      <div className="grid gap-3 lg:grid-cols-[110px_minmax(0,1fr)_auto] lg:items-start">
        <div className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">{formatRelative(event.occurredAt)}</div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mono rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-white" style={{ backgroundColor: colorFor(event.eventKind) }}>
              {event.eventKind.replace("_", " ")}
            </span>
            <span className="mono text-[10px] uppercase tracking-[0.22em] text-cyan-200/70">
              {event.source.type}: {event.source.value}
            </span>
          </div>
          <p className="mt-2 text-sm leading-7 text-violet-100/84">
            <span className="font-semibold text-white">{event.actorLogin ?? "unknown"}</span>{" "}
            <span className="text-violet-100/72">{toActionCopy(event)}</span>{" "}
            <span className="font-medium text-cyan-200">{event.repoName ?? event.source.displayName}</span>
          </p>
          {event.subjectTitle ? <p className="mt-1 text-sm text-violet-100/64">{event.subjectTitle}</p> : null}
        </div>
        {event.subjectUrl ? (
          <a
            className="mono inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-cyan-200 transition hover:border-cyan-300/35 hover:bg-cyan-300/10"
            href={event.subjectUrl}
            rel="noreferrer"
            target="_blank"
          >
            Open
          </a>
        ) : null}
      </div>
    </article>
  );
}

function SummaryLine({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">{label}</span>
      <span className={`text-sm font-semibold ${accent ? "text-cyan-200" : "text-white"}`}>{value}</span>
    </div>
  );
}

function MixBar({ item }: { item: EventMixItem }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-white">{item.label}</span>
        <span className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">
          {item.count} · {item.share}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/8">
        <div
          className="h-2 rounded-full"
          style={{ background: colorFor(item.kind), width: `${Math.max(item.share, 6)}%` }}
        />
      </div>
    </div>
  );
}

function EmptyPanel({ copy }: { copy: string }) {
  return (
    <div className="rounded-[18px] border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm leading-6 text-violet-100/60">
      {copy}
    </div>
  );
}

function colorFor(kind: EventMixItem["kind"]) {
  switch (kind) {
    case "push":
      return "#5fe1ff";
    case "pull_request":
      return "#ff4fd8";
    case "issue":
      return "#ffb84c";
    case "comment":
      return "#3be6a5";
    case "release":
      return "#8d7bff";
    case "watch":
      return "#ffe272";
    case "fork":
      return "#ff7aa2";
    default:
      return "#7b709e";
  }
}

function toActionCopy(event: BoardEvent) {
  switch (event.eventKind) {
    case "push":
      return "pushed changes to";
    case "pull_request":
      return "opened or updated a pull request in";
    case "issue":
      return "opened or updated an issue in";
    case "comment":
      return "commented in";
    case "release":
      return "published a release in";
    case "watch":
      return "starred";
    case "fork":
      return "forked";
    default:
      return "triggered activity in";
  }
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
