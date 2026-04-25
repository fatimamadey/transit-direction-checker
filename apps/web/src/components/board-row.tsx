"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import type { BoardListItem } from "@/types/dashboard";

type BoardRowProps = {
  board: BoardListItem;
  signedIn: boolean;
  variant?: "default" | "compact";
  onJoined?: () => void;
};

export function BoardRow({ board, signedIn, variant = "default", onJoined }: BoardRowProps) {
  const [error, setError] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const timeline = useMemo(
    () =>
      board.timeline.map((point) => ({
        label: point.label,
        total: point.total
      })),
    [board.timeline]
  );

  async function joinBoard() {
    setError(null);
    const response = await fetch(`/api/boards/${board.slug}/join`, { method: "POST" });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Could not join board.");
      return;
    }

    onJoined?.();
  }

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <article
      className={`group relative overflow-hidden border-b border-white/8 py-4 ${
        variant === "compact" ? "md:grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)_auto]" : "xl:grid xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(220px,0.7fr)_auto]"
      } gap-4`}
    >
      <div className="absolute inset-y-3 left-0 w-px bg-gradient-to-b from-transparent via-cyan-300/45 to-transparent opacity-0 transition group-hover:opacity-100" />

      <div className="min-w-0 space-y-2 pl-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link className="text-lg font-semibold text-white transition hover:text-cyan-200" href={`/boards/${board.slug}`}>
            {board.name}
          </Link>
          {board.joined ? (
            <span className="mono rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-emerald-200">
              joined
            </span>
          ) : null}
          {!board.isPublic ? (
            <span className="mono rounded-full border border-amber-300/20 bg-amber-400/10 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-amber-200">
              private
            </span>
          ) : null}
          <span className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">
            {board.summary.latestEventAt ? `updated ${formatRelative(board.summary.latestEventAt)}` : "waiting for activity"}
          </span>
        </div>

        {board.description ? <p className="max-w-2xl text-sm leading-6 text-violet-100/72">{board.description}</p> : null}

        <div className="flex flex-wrap gap-2">
          {board.trackedSources.length ? (
            board.trackedSources.map((source) => (
              <span
                className="mono rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[11px] tracking-[0.02em] text-violet-100/85"
                key={source.id}
              >
                {source.displayName}
              </span>
            ))
          ) : (
            <span className="text-sm text-violet-100/50">No sources yet</span>
          )}
        </div>
      </div>

      <div className="mt-4 flex min-w-0 flex-wrap items-center gap-4 pl-4 md:mt-0">
        <InlineStat label="members" value={board.memberCount} />
        <InlineStat label="sources" value={board.sourceCount} />
        <InlineStat label="24h" value={board.summary.totalEvents} />
        <InlineStat label="1h" value={board.summary.recentEvents} accent />
      </div>

      <div className="mt-4 min-w-0 pl-4 xl:mt-0">
        <div className="flex items-center justify-between">
          <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">activity</p>
          <span className="mono text-[10px] uppercase tracking-[0.22em] text-cyan-200/70">
            {board.repoSourceCount} repo · {board.userSourceCount} user
          </span>
        </div>
        <div className="mt-2 h-16 min-w-0 rounded-[16px] border border-white/8 bg-[#120f22]/90 px-2 py-1">
          {hasMounted ? (
            <ResponsiveContainer height="100%" minHeight={48} minWidth={0} width="100%">
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id={`board-row-${board.id}`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#5fe1ff" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#5fe1ff" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Area dataKey="total" fill={`url(#board-row-${board.id})`} stroke="#5fe1ff" strokeWidth={1.6} type="monotone" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full rounded-[12px] bg-white/[0.03]" />
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-start justify-start gap-2 pl-4 xl:mt-0 xl:justify-end">
        <Link
          className="rounded-full bg-[linear-gradient(135deg,#ff4fd8,#7c5cff)] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(255,79,216,0.26)] transition hover:opacity-95"
          href={`/boards/${board.slug}`}
        >
          Open board
        </Link>
        {signedIn ? (
          board.joined ? null : (
            <button
              className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-300/35 hover:bg-cyan-300/10 disabled:opacity-60"
              disabled={isPending}
              onClick={() => startTransition(() => void joinBoard())}
              type="button"
            >
              {isPending ? "Joining..." : "Join"}
            </button>
          )
        ) : (
          <Link
            className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-300/35 hover:bg-cyan-300/10"
            href={`/sign-in?redirect_url=${encodeURIComponent(`/boards/${board.slug}`)}`}
          >
            Sign in
          </Link>
        )}
        {error ? <p className="w-full text-sm font-medium text-rose-300 xl:text-right">{error}</p> : null}
      </div>
    </article>
  );
}

function InlineStat({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="min-w-[72px]">
      <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/50">{label}</p>
      <p className={`mt-1 text-base font-semibold ${accent ? "text-cyan-200" : "text-white"}`}>{value}</p>
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
