"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ActivityBucket, BoardListItem, DashboardData, EventMixItem } from "@/types/dashboard";

const CHART_COLORS = {
  push: "#5fe1ff",
  pull_request: "#ff4fd8",
  issue: "#ffb84c",
  comment: "#3be6a5",
  release: "#8d7bff",
  watch: "#ffe272",
  fork: "#ff7aa2",
  other: "#7b709e"
} as const;

type DashboardShellProps = {
  dashboardData: DashboardData;
  userName: string;
};

export function DashboardShell({ dashboardData, userName }: DashboardShellProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function createBoard() {
    setError(null);

    const response = await fetch("/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description })
    });

    const payload = (await response.json()) as { slug?: string; error?: string };

    if (!response.ok || !payload.slug) {
      setError(payload.error ?? "Could not create board.");
      return;
    }

    setName("");
    setDescription("");
    router.push(`/boards/${payload.slug}`);
    router.refresh();
  }

  return (
    <div className="animate-panel-in space-y-6">
      <header className="panel-strong relative overflow-hidden rounded-[30px] px-6 py-6 sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,79,216,0.18),transparent_30%),radial-gradient(circle_at_20%_0%,rgba(95,225,255,0.16),transparent_28%)]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-4">
            <div className="mono inline-flex rounded-full border border-white/12 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-cyan-200">
              Pulseboard // live control room
            </div>
            <div className="space-y-2">
              <p className="mono text-xs uppercase tracking-[0.32em] text-violet-200/70">Dashboard</p>
              <h1 className="max-w-4xl text-4xl font-semibold text-white sm:text-6xl">
                Welcome back, <span className="text-gradient">{userName}</span>.
              </h1>
              <p className="max-w-3xl text-base leading-7 text-violet-100/72">
                Track public GitHub boards through a radical activity cockpit. Watch source clusters, event rhythm, and
                the hottest boards without digging through flat lists.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start">
            <div className="mono rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-cyan-200">
              polling every 5s
            </div>
            <UserButton />
          </div>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="panel rounded-[28px] p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="mono text-[11px] uppercase tracking-[0.28em] text-violet-200/65">Activity skyline</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">Board momentum in the last 24 hours</h2>
            </div>
            <MetricChips
              items={[
                { label: "boards", value: dashboardData.overview.totalBoards },
                { label: "joined", value: dashboardData.overview.joinedBoards },
                { label: "events", value: dashboardData.overview.liveEvents24h }
              ]}
            />
          </div>
          <div className="h-[310px] rounded-[24px] border border-white/8 bg-[#110d1f]/90 p-4">
            <ResponsiveContainer height="100%" minHeight={240} minWidth={0} width="100%">
              <AreaChart data={dashboardData.overview.skyline}>
                <defs>
                  <linearGradient id="pushGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#5fe1ff" stopOpacity={0.75} />
                    <stop offset="100%" stopColor="#5fe1ff" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="prGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#ff4fd8" stopOpacity={0.68} />
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
                  labelStyle={{ color: "#9f95c9" }}
                />
                <Area dataKey="push" fill="url(#pushGradient)" stroke="#5fe1ff" strokeWidth={2} type="monotone" />
                <Area
                  dataKey="pull_request"
                  fill="url(#prGradient)"
                  stroke="#ff4fd8"
                  strokeWidth={2}
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid gap-4">
          <OverviewStatCard
            caption="tracked sources"
            detail="Unique repos and users feeding your boards."
            value={dashboardData.overview.trackedSources}
          />
          <div className="panel rounded-[28px] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="mono text-[11px] uppercase tracking-[0.28em] text-violet-200/65">Event mix</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">What the room is seeing</h2>
              </div>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-[180px_1fr]">
              <div className="h-[180px]">
                <ResponsiveContainer height="100%" minHeight={180} minWidth={0} width="100%">
                  <PieChart>
                    <Pie
                      cx="50%"
                      cy="50%"
                      data={dashboardData.overview.eventMix}
                      dataKey="count"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={4}
                    >
                      {dashboardData.overview.eventMix.map((item) => (
                        <Cell fill={eventColor(item.kind)} key={item.kind} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <MixLegend items={dashboardData.overview.eventMix} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="panel rounded-[28px] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="mono text-[11px] uppercase tracking-[0.28em] text-violet-200/65">Board constellation</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">Joined boards as a live cluster</h2>
            </div>
            <Link
              className="mono rounded-full border border-white/12 bg-white/5 px-3 py-2 text-[11px] uppercase tracking-[0.28em] text-cyan-200 transition hover:border-cyan-300/50 hover:bg-cyan-300/10"
              href="/dashboard"
            >
              refresh shell
            </Link>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
            <BoardConstellation boards={dashboardData.joinedBoards} />
            <div className="space-y-3">
              <p className="mono text-[11px] uppercase tracking-[0.28em] text-violet-200/65">Top actors</p>
              {dashboardData.overview.actorLeaders.length ? (
                dashboardData.overview.actorLeaders.map((actor, index) => (
                  <div
                    className="flex items-center justify-between rounded-[20px] border border-white/10 bg-white/5 px-4 py-3"
                    key={actor.login}
                  >
                    <div>
                      <p className="text-sm font-medium text-white">#{index + 1} {actor.login}</p>
                      <p className="mono text-[11px] uppercase tracking-[0.24em] text-violet-200/60">live contributor</p>
                    </div>
                    <div className="mono text-sm text-cyan-200">{actor.count}</div>
                  </div>
                ))
              ) : (
                <EmptyPanel copy="When the worker starts fanning out activity, your top contributors will show up here." />
              )}
            </div>
          </div>
        </div>

        <div className="panel rounded-[28px] p-5">
          <div className="rounded-[24px] border border-fuchsia-400/20 bg-[linear-gradient(180deg,rgba(255,79,216,0.12),rgba(95,225,255,0.04))] p-4">
            <p className="mono text-[11px] uppercase tracking-[0.28em] text-fuchsia-200/80">Create board</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">Open a new signal channel</h2>
            <p className="mt-2 text-sm leading-6 text-violet-100/70">
              Spin up a board for a class, sprint, open source watchlist, or lab group and start feeding it GitHub activity.
            </p>
          </div>

          <form
            className="mt-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(() => {
                void createBoard();
              });
            }}
          >
            <label className="block space-y-2">
              <span className="mono text-[11px] uppercase tracking-[0.24em] text-violet-200/70">Board name</span>
              <input
                className="w-full rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
                onChange={(event) => setName(event.target.value)}
                placeholder="systems-lab-pulse"
                required
                value={name}
              />
            </label>
            <label className="block space-y-2">
              <span className="mono text-[11px] uppercase tracking-[0.24em] text-violet-200/70">Description</span>
              <textarea
                className="min-h-28 w-full rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Track pushes, PRs, issues, and who is making the most noise."
                value={description}
              />
            </label>
            {error ? <p className="text-sm font-medium text-rose-300">{error}</p> : null}
            <button
              className="w-full rounded-full bg-[linear-gradient(135deg,#ff4fd8,#7c5cff)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(255,79,216,0.35)] transition hover:opacity-95 disabled:opacity-60"
              disabled={isPending}
              type="submit"
            >
              {isPending ? "Creating..." : "Create board"}
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <BoardStrip boards={dashboardData.joinedBoards} title="Joined boards" />
        <BoardStrip boards={dashboardData.publicBoards.filter((board) => !board.joined)} title="Explore public boards" />
      </section>
    </div>
  );
}

function OverviewStatCard({ caption, detail, value }: { caption: string; detail: string; value: number }) {
  return (
    <div className="panel rounded-[28px] p-5">
      <p className="mono text-[11px] uppercase tracking-[0.28em] text-violet-200/65">{caption}</p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <div>
          <p className="text-5xl font-semibold text-white">{value}</p>
          <p className="mt-2 max-w-[20rem] text-sm leading-6 text-violet-100/68">{detail}</p>
        </div>
        <div className="grid-lines animate-pulse-ring h-14 w-14 rounded-2xl border border-cyan-300/25 bg-cyan-300/10" />
      </div>
    </div>
  );
}

function MetricChips({ items }: { items: Array<{ label: string; value: number }> }) {
  return (
    <div className="hidden flex-wrap gap-2 lg:flex">
      {items.map((item) => (
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2" key={item.label}>
          <span className="mono text-[11px] uppercase tracking-[0.22em] text-violet-200/60">{item.label}</span>
          <span className="ml-2 text-sm font-medium text-white">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function MixLegend({ items }: { items: EventMixItem[] }) {
  if (!items.length) {
    return <EmptyPanel copy="No event mix yet. Add sources and let the worker start populating activity." />;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div className="flex items-center justify-between rounded-[18px] border border-white/8 bg-white/5 px-4 py-3" key={item.kind}>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: eventColor(item.kind) }} />
            <span className="text-sm font-medium text-white">{item.label}</span>
          </div>
          <div className="mono text-xs uppercase tracking-[0.24em] text-violet-200/65">
            {item.count} · {item.share}%
          </div>
        </div>
      ))}
    </div>
  );
}

function BoardConstellation({ boards }: { boards: BoardListItem[] }) {
  const displayBoards = boards.slice(0, 6);

  if (!displayBoards.length) {
    return <EmptyPanel copy="Join a board to light up the constellation." heightClassName="h-[320px]" />;
  }

  const positions = [
    { x: 95, y: 92 },
    { x: 245, y: 70 },
    { x: 365, y: 150 },
    { x: 280, y: 260 },
    { x: 140, y: 245 },
    { x: 205, y: 165 }
  ];

  return (
    <div className="grid-lines relative h-[320px] overflow-hidden rounded-[24px] border border-white/8 bg-[#110d1f]/90">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 420 320">
        {displayBoards.map((board, index) => {
          const point = positions[index];
          const next = positions[(index + 1) % displayBoards.length];

          return (
            <line
              key={`${board.id}-line`}
              stroke="rgba(95,225,255,0.14)"
              strokeDasharray="6 8"
              strokeWidth="1.5"
              x1={point.x}
              x2={next.x}
              y1={point.y}
              y2={next.y}
            />
          );
        })}
      </svg>

      {displayBoards.map((board, index) => {
        const point = positions[index];
        const size = 72 + Math.min(board.summary.totalEvents, 12) * 4;

        return (
          <Link
            className="animate-node-pulse absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-white/12 bg-[radial-gradient(circle,rgba(255,79,216,0.18),rgba(95,225,255,0.08),rgba(19,15,35,0.94))] text-center text-white shadow-[0_0_40px_rgba(124,92,255,0.2)] transition hover:scale-105 hover:border-fuchsia-300/40"
            href={`/boards/${board.slug}`}
            key={board.id}
            style={{ height: size, left: point.x, top: point.y, width: size }}
          >
            <span className="px-3 text-sm font-medium leading-tight">{board.name}</span>
            <span className="mono mt-2 text-[10px] uppercase tracking-[0.2em] text-cyan-200/70">
              {board.summary.totalEvents} evt
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function BoardStrip({ title, boards }: { title: string; boards: BoardListItem[] }) {
  return (
    <section className="panel rounded-[28px] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="mono text-[11px] uppercase tracking-[0.28em] text-violet-200/65">{title}</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">{boards.length ? "Signal-ready boards" : "Waiting for boards"}</h2>
        </div>
        <span className="mono text-xs uppercase tracking-[0.24em] text-cyan-200/70">{boards.length} visible</span>
      </div>

      {boards.length ? (
        <div className="space-y-3">
          {boards.slice(0, 6).map((board, index) => (
            <Link
              className="group grid gap-4 rounded-[22px] border border-white/8 bg-white/[0.04] p-4 transition hover:border-fuchsia-300/30 hover:bg-white/[0.07] lg:grid-cols-[1.2fr_0.9fr]"
              href={`/boards/${board.slug}`}
              key={board.id}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="mono text-[11px] uppercase tracking-[0.24em] text-violet-200/55">#{index + 1}</span>
                  {board.joined ? (
                    <span className="mono rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-emerald-200">
                      joined
                    </span>
                  ) : null}
                </div>
                <h3 className="text-2xl font-semibold text-white">{board.name}</h3>
                <p className="max-w-xl text-sm leading-6 text-violet-100/66">{board.description ?? "No description yet."}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <MiniMetric label="members" value={board.memberCount} />
                <MiniMetric label="sources" value={board.sourceCount} />
                <MiniMetric label="events" value={board.summary.totalEvents} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyPanel copy="Nothing here yet. Create the first board and give the dashboard something to orbit around." />
      )}
    </section>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-[#110d1f] px-4 py-3">
      <p className="mono text-[10px] uppercase tracking-[0.24em] text-violet-200/55">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function EmptyPanel({ copy, heightClassName = "h-[220px]" }: { copy: string; heightClassName?: string }) {
  return (
    <div
      className={`flex ${heightClassName} items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-center text-sm leading-6 text-violet-100/60`}
    >
      {copy}
    </div>
  );
}

function eventColor(kind: EventMixItem["kind"] | ActivityBucket extends never ? never : string) {
  return CHART_COLORS[kind as keyof typeof CHART_COLORS] ?? CHART_COLORS.other;
}
