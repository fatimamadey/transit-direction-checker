"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import type { BoardEvent, BoardPageData, BoardSnapshot, EventMixItem, SourceNode } from "@/types/dashboard";

const COLORS = {
  push: "#5fe1ff",
  pull_request: "#ff4fd8",
  issue: "#ffb84c",
  comment: "#3be6a5",
  release: "#8d7bff",
  watch: "#ffe272",
  fork: "#ff7aa2",
  other: "#7b709e"
} as const;

export function BoardPageShell({ data }: { data: BoardPageData }) {
  const [events, setEvents] = useState(data.initialEvents);
  const [summary, setSummary] = useState(data.summary);
  const [timelineBuckets, setTimelineBuckets] = useState(data.timelineBuckets);
  const [sourceNodes, setSourceNodes] = useState(data.sourceNodes);
  const [hasMounted, setHasMounted] = useState(false);
  const [boardName, setBoardName] = useState(data.board.name);
  const [boardDescription, setBoardDescription] = useState(data.board.description ?? "");
  const [sourceType, setSourceType] = useState<"user" | "repo">("repo");
  const [sourceValue, setSourceValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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
        description: boardDescription
      })
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Could not update board.");
      return;
    }

    router.refresh();
  }

  useBoardPolling(data.board.slug, events, setEvents, setSummary, setTimelineBuckets, setSourceNodes);

  return (
    <div className="animate-panel-in space-y-6">
      <header className="panel-strong relative overflow-hidden rounded-[30px] p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(95,225,255,0.15),transparent_30%),radial-gradient(circle_at_100%_0%,rgba(255,79,216,0.14),transparent_28%)]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-4">
            <p className="mono text-[11px] uppercase tracking-[0.3em] text-violet-200/70">Board</p>
            <div>
              <h1 className="text-4xl font-semibold text-white sm:text-6xl">{data.board.name}</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-violet-100/70">
                {data.board.description ?? "A GitHub group with tracked repos and users."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <SummaryPill label="members" value={data.board.memberCount} />
              <SummaryPill label="sources" value={data.board.sourceCount} />
              <SummaryPill label="events" value={summary.totalEvents} />
              <SummaryPill label="actors" value={summary.uniqueActors} />
            </div>
          </div>

          <div className="flex flex-col gap-3">
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
                  className="rounded-full bg-[linear-gradient(135deg,#ff4fd8,#7c5cff)] px-5 py-3 text-center text-sm font-semibold text-white shadow-[0_14px_40px_rgba(255,79,216,0.35)] transition hover:opacity-95"
                  href={`/sign-in?redirect_url=${encodeURIComponent(`/boards/${data.board.slug}`)}`}
                >
                  Sign in to join
                </a>
              )
            ) : (
              <div className="mono rounded-full border border-emerald-300/20 bg-emerald-400/10 px-5 py-3 text-[11px] uppercase tracking-[0.28em] text-emerald-200">
                joined
              </div>
            )}
            <p className="mono text-[11px] uppercase tracking-[0.22em] text-violet-200/55">
              GitHub can lag
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.85fr]">
        <div className="panel rounded-[28px] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="mono text-[11px] uppercase tracking-[0.28em] text-violet-200/65">Tracked sources</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">Repos and users in this board</h2>
            </div>
            <span className="mono text-[11px] uppercase tracking-[0.24em] text-cyan-200/75">source map</span>
          </div>
          <SourceOrbit nodes={sourceNodes} />
        </div>

        <div className="grid gap-4">
          <div className="panel min-w-0 rounded-[28px] p-5">
            <p className="mono text-[11px] uppercase tracking-[0.28em] text-violet-200/65">Activity mix</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">What happened here</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-[180px_1fr]">
              <div className="h-[180px] min-w-0">
                {hasMounted ? (
                  <ResponsiveContainer height="100%" minHeight={180} minWidth={0} width="100%">
                    <PieChart>
                      <Pie
                        cx="50%"
                        cy="50%"
                        data={summary.mix}
                        dataKey="count"
                        innerRadius={42}
                        outerRadius={74}
                        paddingAngle={4}
                      >
                        {summary.mix.map((item) => (
                          <Cell fill={colorFor(item.kind)} key={item.kind} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full rounded-[18px] border border-white/6 bg-white/[0.03]" />
                )}
              </div>
              <MixBars items={summary.mix} />
            </div>
          </div>

          <div className="panel rounded-[28px] p-5">
            <p className="mono text-[11px] uppercase tracking-[0.28em] text-violet-200/65">Top actors</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">Most active users</h2>
            <div className="mt-4 space-y-3">
              {data.topActors.length ? (
                data.topActors.map((actor, index) => (
                  <div className="flex items-center justify-between rounded-[18px] border border-white/8 bg-white/5 px-4 py-3" key={actor.login}>
                    <div>
                      <p className="text-sm font-medium text-white">#{index + 1} {actor.login}</p>
                      <p className="mono text-[10px] uppercase tracking-[0.2em] text-violet-200/55">contributors</p>
                    </div>
                    <span className="mono text-sm text-cyan-200">{actor.count}</span>
                  </div>
                ))
              ) : (
                <EmptyPanel copy="Add a source and let the worker gather some actors first." />
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="panel min-w-0 rounded-[28px] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="mono text-[11px] uppercase tracking-[0.28em] text-violet-200/65">Timeline</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">Activity in the last 24 hours</h2>
            </div>
            <div className="mono rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-cyan-200">
              {summary.recentEvents} last hour
            </div>
          </div>
          <div className="h-[310px] min-w-0 rounded-[24px] border border-white/8 bg-[#110d1f]/95 p-4">
            {hasMounted ? (
              <ResponsiveContainer height="100%" minHeight={240} minWidth={0} width="100%">
                <AreaChart data={timelineBuckets}>
                  <defs>
                    <linearGradient id="timelinePush" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#5fe1ff" stopOpacity={0.75} />
                      <stop offset="100%" stopColor="#5fe1ff" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="timelinePr" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#ff4fd8" stopOpacity={0.64} />
                      <stop offset="100%" stopColor="#ff4fd8" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#120f23",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 16,
                      color: "#f4efff"
                    }}
                  />
                  <Area dataKey="push" fill="url(#timelinePush)" stroke="#5fe1ff" strokeWidth={2} type="monotone" />
                  <Area
                    dataKey="pull_request"
                    fill="url(#timelinePr)"
                    stroke="#ff4fd8"
                    strokeWidth={2}
                    type="monotone"
                  />
                  <Area dataKey="issue" fill="none" stroke="#ffb84c" strokeWidth={2} type="monotone" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-[18px] border border-white/6 bg-white/[0.03]" />
            )}
          </div>
        </div>

        <aside className="space-y-4">
          {data.isMember ? (
            <form
              className="panel rounded-[28px] p-5"
              onSubmit={(event) => {
                event.preventDefault();
                startTransition(() => void saveBoard());
              }}
            >
              <p className="mono text-[11px] uppercase tracking-[0.28em] text-violet-200/65">Board settings</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">Edit board</h2>
              <div className="mt-4 space-y-4">
                <input
                  className="w-full rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
                  onChange={(event) => setBoardName(event.target.value)}
                  value={boardName}
                />
                <textarea
                  className="min-h-24 w-full rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
                  onChange={(event) => setBoardDescription(event.target.value)}
                  value={boardDescription}
                />
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

          <div className="panel rounded-[28px] p-5">
            <p className="mono text-[11px] uppercase tracking-[0.28em] text-violet-200/65">Tracking</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">Tracked sources</h2>
            <div className="mt-4 space-y-3">
              {data.sources.length ? (
                data.sources.map((source) => (
                  <div className="rounded-[18px] border border-white/8 bg-white/5 px-4 py-3" key={source.id}>
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
              <p className="mono text-[11px] uppercase tracking-[0.28em] text-violet-200/65">Add source</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">Add repo or user</h2>
              <div className="mt-4 space-y-4">
                <select
                  className="w-full rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
                  onChange={(event) => setSourceType(event.target.value as "user" | "repo")}
                  value={sourceType}
                >
                  <option value="repo">Repository</option>
                  <option value="user">User</option>
                </select>
                <input
                  className="w-full rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
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
      </section>

      <section className="panel rounded-[28px] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="mono text-[11px] uppercase tracking-[0.28em] text-violet-200/65">Latest events</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">Recent GitHub activity</h2>
          </div>
          <div className="mono text-[11px] uppercase tracking-[0.22em] text-cyan-200/75">
            {summary.latestEventAt ? `last seen ${formatRelative(summary.latestEventAt)}` : "waiting for traffic"}
          </div>
        </div>
        <div className="ticker-mask grid max-h-[420px] gap-3 overflow-auto pr-1">
          {events.length ? (
            events.map((event) => <TickerCard event={event} key={event.id} />)
          ) : (
            <EmptyPanel copy="No events yet. Add a GitHub user or repository and let the worker light up this board." />
          )}
        </div>
      </section>
    </div>
  );
}

function useBoardPolling(
  slug: string,
  initialEvents: BoardEvent[],
  setEvents: React.Dispatch<React.SetStateAction<BoardEvent[]>>,
  setSummary: React.Dispatch<React.SetStateAction<BoardPageData["summary"]>>,
  setTimelineBuckets: React.Dispatch<React.SetStateAction<BoardPageData["timelineBuckets"]>>,
  setSourceNodes: React.Dispatch<React.SetStateAction<BoardPageData["sourceNodes"]>>
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
      setSourceNodes(payload.sourceNodes);

      if (!payload.events.length) {
        return;
      }

      const newestSeen = payload.events[payload.events.length - 1]?.boardEventCreatedAt ?? latestSeen;

      setEvents((current) => {
        const seen = new Set(current.map((event) => event.id));
        const incoming = payload.events.filter((event) => !seen.has(event.id));
        return incoming.length ? [...incoming.reverse(), ...current].slice(0, 24) : current;
      });

      setLatestSeen(newestSeen);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [latestSeen, setEvents, setSourceNodes, setSummary, setTimelineBuckets, slug]);
}

function SourceOrbit({ nodes }: { nodes: SourceNode[] }) {
  if (!nodes.length) {
    return <EmptyPanel copy="No orbit yet. Add a repo or user to start building the source field." heightClassName="h-[360px]" />;
  }

  const viewNodes = nodes.slice(0, 8);

  return (
    <div className="grid-lines relative h-[360px] overflow-hidden rounded-[24px] border border-white/8 bg-[#110d1f]/95">
      <div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-fuchsia-300/25 bg-[radial-gradient(circle,rgba(255,79,216,0.18),rgba(95,225,255,0.08),transparent)] blur-[1px]" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 520 360">
        <circle cx="260" cy="180" fill="none" r="56" stroke="rgba(255,255,255,0.08)" strokeDasharray="8 10" />
        <circle cx="260" cy="180" fill="none" r="104" stroke="rgba(95,225,255,0.12)" strokeDasharray="8 10" />
        <circle cx="260" cy="180" fill="none" r="152" stroke="rgba(255,79,216,0.12)" strokeDasharray="8 10" />
      </svg>

      <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#120f23] text-center shadow-[0_0_40px_rgba(95,225,255,0.16)]">
        <div>
          <p className="mono text-[10px] uppercase tracking-[0.22em] text-cyan-200/75">board core</p>
          <p className="mt-2 text-sm font-medium text-white">Pulse field</p>
        </div>
      </div>

      {viewNodes.map((node, index) => {
        const angle = (Math.PI * 2 * index) / viewNodes.length;
        const orbit = index % 2 === 0 ? 120 : 164;
        const x = 260 + Math.cos(angle) * orbit;
        const y = 180 + Math.sin(angle) * orbit;

        return (
          <div
            className="animate-node-pulse absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] px-4 py-3 text-center shadow-[0_0_26px_rgba(124,92,255,0.18)]"
            key={node.id}
            style={{
              left: `${(x / 520) * 100}%`,
              top: `${(y / 360) * 100}%`,
              width: `${Math.max(92, Math.min(150, node.pulseScore + 58))}px`
            }}
          >
            <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/60">{node.type}</p>
            <p className="mt-1 text-sm font-medium text-white">{node.displayName}</p>
            <p className="mono mt-2 text-[10px] uppercase tracking-[0.22em] text-cyan-200/70">{node.activityCount} evt</p>
          </div>
        );
      })}
    </div>
  );
}

function MixBars({ items }: { items: EventMixItem[] }) {
  if (!items.length) {
    return <EmptyPanel copy="No event mix yet." />;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div className="space-y-2" key={item.kind}>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-white">{item.label}</span>
            <span className="mono text-[11px] uppercase tracking-[0.22em] text-violet-200/60">
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
      ))}
    </div>
  );
}

function TickerCard({ event }: { event: BoardEvent }) {
  return (
    <article className="animate-ticker-slide rounded-[22px] border border-white/8 bg-white/[0.04] p-4 transition hover:border-cyan-300/30 hover:bg-white/[0.06]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <span
              className="mono rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white"
              style={{ backgroundColor: colorFor(event.eventKind) }}
            >
              {event.eventKind.replace("_", " ")}
            </span>
            <span className="mono rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-violet-200/65">
              {event.source.type}: {event.source.value}
            </span>
          </div>
          <h3 className="text-xl font-semibold text-white">{event.subjectTitle ?? event.eventType}</h3>
          <p className="text-sm leading-6 text-violet-100/68">
            <span className="text-cyan-200">{event.actorLogin ?? "unknown"}</span> · {event.repoName ?? event.source.displayName}
          </p>
        </div>

        <div className="mono text-[11px] uppercase tracking-[0.22em] text-violet-200/55">{formatRelative(event.occurredAt)}</div>
      </div>

      {event.subjectUrl ? (
        <a
          className="mono mt-4 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-cyan-200 transition hover:border-cyan-300/35 hover:bg-cyan-300/10"
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

function SummaryPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
      <span className="mono text-[11px] uppercase tracking-[0.22em] text-violet-200/60">{label}</span>
      <span className="ml-2 text-sm font-medium text-white">{value}</span>
    </div>
  );
}

function EmptyPanel({ copy, heightClassName = "h-[120px]" }: { copy: string; heightClassName?: string }) {
  return (
    <div
      className={`flex ${heightClassName} items-center justify-center rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-center text-sm leading-6 text-violet-100/60`}
    >
      {copy}
    </div>
  );
}

function colorFor(kind: EventMixItem["kind"]) {
  return COLORS[kind] ?? COLORS.other;
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
