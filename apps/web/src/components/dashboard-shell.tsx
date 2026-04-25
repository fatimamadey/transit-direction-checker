"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { BoardRow } from "@/components/board-row";
import type { DashboardData } from "@/types/dashboard";

type DashboardShellProps = {
  dashboardData: DashboardData;
  userName: string;
};

export function DashboardShell({ dashboardData, userName }: DashboardShellProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const skyline = useMemo(
    () =>
      dashboardData.overview.skyline.map((bucket) => ({
        label: bucket.label,
        total: bucket.total
      })),
    [dashboardData.overview.skyline]
  );

  async function createBoard() {
    setError(null);

    const response = await fetch("/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, isPublic })
    });

    const payload = (await response.json()) as { slug?: string; error?: string };

    if (!response.ok || !payload.slug) {
      setError(payload.error ?? "Could not create board.");
      return;
    }

    setName("");
    setDescription("");
    setIsPublic(true);
    router.push(`/boards/${payload.slug}`);
    router.refresh();
  }

  const suggestions = dashboardData.publicBoards.filter((board) => !board.joined).slice(0, 4);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <div className="animate-panel-in grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)_320px]">
      <aside className="panel rounded-[28px] p-5">
        <div className="border-b border-white/8 pb-4">
          <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">workspace</p>
          <h1 className="mt-2 text-lg font-semibold text-white">{userName}</h1>
          <p className="mt-2 text-sm leading-6 text-violet-100/66">Joined boards first. Public boards stay in the side rail until you need them.</p>
        </div>

        <div className="mt-4 space-y-3">
          <RailLink href="/dashboard" label="Your boards" />
          <RailLink href="/boards" label="Public boards" />
        </div>

        <div className="mt-6 rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
          <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">status</p>
          <div className="mt-3 space-y-3">
            <StatusLine label="joined boards" value={dashboardData.overview.joinedBoards} />
            <StatusLine label="tracked sources" value={dashboardData.overview.trackedSources} />
            <StatusLine label="events in 24h" value={dashboardData.overview.liveEvents24h} accent />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">account</div>
          <UserButton />
        </div>
      </aside>

      <section className="space-y-4">
        <div className="panel-strong rounded-[28px] p-5">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/8 pb-4">
            <div>
              <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">your boards</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Open the boards you actually use.</h2>
            </div>
            <Link
              className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-300/35 hover:bg-cyan-300/10"
              href="/boards"
            >
              Browse more boards
            </Link>
          </div>

          <div className="mt-4 h-24 rounded-[20px] border border-white/8 bg-[#120f22] px-3 py-2">
            {hasMounted ? (
              <ResponsiveContainer height="100%" minHeight={72} minWidth={0} width="100%">
                <AreaChart data={skyline}>
                  <defs>
                    <linearGradient id="dashboard-skyline" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#5fe1ff" stopOpacity={0.48} />
                      <stop offset="100%" stopColor="#5fe1ff" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <Area dataKey="total" fill="url(#dashboard-skyline)" stroke="#5fe1ff" strokeWidth={1.8} type="monotone" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-[12px] bg-white/[0.03]" />
            )}
          </div>

          <div className="mt-4 divide-y divide-white/8">
            {dashboardData.joinedBoards.length ? (
              dashboardData.joinedBoards.map((board) => (
                <BoardRow
                  board={board}
                  key={board.id}
                  onJoined={() => {
                    router.refresh();
                  }}
                  signedIn
                />
              ))
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <form
          className="panel rounded-[28px] p-5"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(() => {
              void createBoard();
            });
          }}
        >
          <div className="border-b border-white/8 pb-4">
            <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">create board</p>
            <h2 className="mt-1 text-lg font-semibold text-white">New group</h2>
          </div>
          <div className="mt-4 space-y-4">
            <label className="block space-y-2">
              <span className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">Name</span>
              <input
                className="w-full rounded-[16px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
                onChange={(event) => setName(event.target.value)}
                placeholder="frontend-team"
                required
                value={name}
              />
            </label>

            <label className="block space-y-2">
              <span className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">Description</span>
              <textarea
                className="min-h-24 w-full rounded-[16px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Repos and people for the frontend team."
                value={description}
              />
            </label>

            <label className="flex items-center justify-between rounded-[16px] border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">Visibility</p>
                <p className="mt-1 text-sm text-violet-100/68">{isPublic ? "Anyone can join." : "Members only."}</p>
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
              className="w-full rounded-full bg-[linear-gradient(135deg,#ff4fd8,#7c5cff)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(255,79,216,0.35)] transition hover:opacity-95 disabled:opacity-60"
              disabled={isPending}
              type="submit"
            >
              {isPending ? "Creating..." : "Create board"}
            </button>
          </div>
        </form>

        <div className="panel rounded-[28px] p-5">
          <div className="border-b border-white/8 pb-4">
            <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">public boards</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Worth joining</h2>
          </div>
          <div className="mt-3 space-y-3">
            {suggestions.length ? (
              suggestions.map((board) => (
                <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4" key={board.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link className="text-sm font-semibold text-white transition hover:text-cyan-200" href={`/boards/${board.slug}`}>
                        {board.name}
                      </Link>
                      {board.description ? <p className="mt-2 text-sm leading-6 text-violet-100/66">{board.description}</p> : null}
                    </div>
                    <span className="mono text-[10px] uppercase tracking-[0.22em] text-cyan-200/70">
                      {board.summary.latestEventAt ? formatRelative(board.summary.latestEventAt) : "quiet"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {board.trackedSources.slice(0, 3).map((source) => (
                      <span
                        className="mono rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[10px] tracking-[0.02em] text-violet-100/82"
                        key={source.id}
                      >
                        {source.displayName}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-violet-100/60">No public boards to suggest yet.</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

function RailLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="mono flex items-center justify-between rounded-[16px] border border-white/8 bg-white/[0.03] px-3 py-3 text-[11px] uppercase tracking-[0.22em] text-violet-100/76 transition hover:border-cyan-300/30 hover:text-white"
      href={href}
    >
      {label}
      <span>↗</span>
    </Link>
  );
}

function StatusLine({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">{label}</span>
      <span className={`text-sm font-semibold ${accent ? "text-cyan-200" : "text-white"}`}>{value}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-8">
      <p className="text-lg font-semibold text-white">No boards yet.</p>
      <p className="mt-2 max-w-xl text-sm leading-7 text-violet-100/66">
        Create one in the right rail or join a public board from the directory. Boards show up here once they belong to you.
      </p>
    </div>
  );
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
