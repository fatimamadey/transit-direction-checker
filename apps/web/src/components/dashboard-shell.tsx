"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import type { BoardListItem, DashboardData } from "@/types/dashboard";

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
      <header className="panel-strong rounded-[30px] px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <p className="mono text-[11px] uppercase tracking-[0.3em] text-violet-200/65">Dashboard</p>
            <h1 className="text-4xl font-semibold text-white sm:text-5xl">Boards you can open right now.</h1>
            <p className="max-w-3xl text-base leading-7 text-violet-100/70">
              Each card is one group. The card shows the board name, the repos and users it tracks, and the latest activity.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start">
            <Link
              className="rounded-full border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/35 hover:bg-cyan-300/10"
              href="/boards"
            >
              Browse public boards
            </Link>
            <div className="mono rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-cyan-200/75">
              {userName}
            </div>
            <UserButton />
          </div>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="panel rounded-[28px] p-5">
          <p className="mono text-[11px] uppercase tracking-[0.28em] text-violet-200/65">Create board</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">New group</h2>
          <p className="mt-2 text-sm leading-6 text-violet-100/68">Pick a clear name. Then add the repos and users that belong in it.</p>

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
              <span className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">Board name</span>
              <input
                className="w-full rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
                onChange={(event) => setName(event.target.value)}
                placeholder="frontend-team"
                required
                value={name}
              />
            </label>
            <label className="block space-y-2">
              <span className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">Description</span>
              <textarea
                className="min-h-28 w-full rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Repos and users for the frontend team."
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

        <div className="panel rounded-[28px] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="mono text-[11px] uppercase tracking-[0.28em] text-violet-200/65">Activity</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">Events across all boards</h2>
            </div>
            <div className="mono text-[11px] uppercase tracking-[0.22em] text-cyan-200/75">
              {dashboardData.overview.liveEvents24h} in 24h
            </div>
          </div>
          <div className="h-[240px] rounded-[24px] border border-white/8 bg-[#110d1f]/90 p-4">
            <ResponsiveContainer height="100%" minHeight={180} minWidth={0} width="100%">
              <AreaChart data={dashboardData.overview.skyline}>
                <defs>
                  <linearGradient id="dashboardPush" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#5fe1ff" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#5fe1ff" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="dashboardPr" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#ff4fd8" stopOpacity={0.6} />
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
                <Area dataKey="push" fill="url(#dashboardPush)" stroke="#5fe1ff" strokeWidth={2} type="monotone" />
                <Area dataKey="pull_request" fill="url(#dashboardPr)" stroke="#ff4fd8" strokeWidth={2} type="monotone" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <BoardSection boards={dashboardData.joinedBoards} emptyCopy="You have not joined any boards yet." title="Your boards" />
      <BoardSection
        boards={dashboardData.publicBoards.filter((board) => !board.joined)}
        emptyCopy="No other public boards yet."
        title="Explore boards"
      />
    </div>
  );
}

function BoardSection({ title, boards, emptyCopy }: { title: string; boards: BoardListItem[]; emptyCopy: string }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="mono text-[11px] uppercase tracking-[0.28em] text-violet-200/65">{title}</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">{boards.length} groups</h2>
        </div>
      </div>

      {boards.length ? (
        <div className="grid gap-4">
          {boards.map((board) => (
            <BoardCard board={board} key={board.id} />
          ))}
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-violet-100/60">
          {emptyCopy}
        </div>
      )}
    </section>
  );
}

function BoardCard({ board }: { board: BoardListItem }) {
  return (
    <article className="panel rounded-[24px] p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <p className="text-2xl font-semibold text-white">{board.name}</p>
            {board.joined ? (
              <span className="mono rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-emerald-200">
                joined
              </span>
            ) : null}
          </div>
          <p className="text-sm leading-6 text-violet-100/68">{board.description ?? "No description."}</p>

          <div className="space-y-2">
            <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">Tracking</p>
            <div className="flex flex-wrap gap-2">
              {board.trackedSources.length ? (
                board.trackedSources.map((source) => (
                  <span
                    className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-xs text-violet-100/85"
                    key={source.id}
                  >
                    {source.displayName}
                  </span>
                ))
              ) : (
                <span className="text-sm text-violet-100/55">No sources yet</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:w-[360px]">
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="repos" value={board.repoSourceCount} />
            <Metric label="users" value={board.userSourceCount} />
            <Metric label="events" value={board.summary.totalEvents} />
            <Metric label="members" value={board.memberCount} />
          </div>
          <Link
            className="rounded-full bg-[linear-gradient(135deg,#ff4fd8,#7c5cff)] px-5 py-3 text-center text-sm font-semibold text-white shadow-[0_14px_40px_rgba(255,79,216,0.35)] transition hover:opacity-95"
            href={`/boards/${board.slug}`}
          >
            Open board
          </Link>
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-white/[0.04] px-4 py-3">
      <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
