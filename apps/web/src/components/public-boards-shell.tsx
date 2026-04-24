"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { BoardListItem } from "@/types/dashboard";

type PublicBoardsShellProps = {
  boards: BoardListItem[];
  signedIn: boolean;
  userName?: string | null;
};

export function PublicBoardsShell({ boards, signedIn, userName }: PublicBoardsShellProps) {
  return (
    <div className="animate-panel-in space-y-6">
      <header className="panel-strong rounded-[30px] px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <p className="mono text-[11px] uppercase tracking-[0.3em] text-violet-200/65">Public boards</p>
            <h1 className="text-4xl font-semibold text-white sm:text-5xl">Browse every board in one place.</h1>
            <p className="max-w-3xl text-base leading-7 text-violet-100/70">
              Each board is one named group. Open the card to see what it tracks. Join a board if you want it on your dashboard and want to add sources to it.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start">
            {signedIn ? (
              <>
                <div className="mono rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-cyan-200/75">
                  {userName ?? "member"}
                </div>
                <Link
                  className="rounded-full border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/35 hover:bg-cyan-300/10"
                  href="/dashboard"
                >
                  Your dashboard
                </Link>
                <UserButton />
              </>
            ) : (
              <>
                <Link
                  className="rounded-full border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/35 hover:bg-cyan-300/10"
                  href="/sign-in"
                >
                  Sign in
                </Link>
                <Link
                  className="rounded-full bg-[linear-gradient(135deg,#ff4fd8,#7c5cff)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(255,79,216,0.35)] transition hover:opacity-95"
                  href="/sign-up"
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
        {boards.length ? (
          boards.map((board) => <PublicBoardCard board={board} key={board.id} signedIn={signedIn} />)
        ) : (
          <div className="col-span-full rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-violet-100/60">
            No public boards yet.
          </div>
        )}
      </section>
    </div>
  );
}

function PublicBoardCard({ board, signedIn }: { board: BoardListItem; signedIn: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function joinBoard() {
    setError(null);
    const response = await fetch(`/api/boards/${board.slug}/join`, { method: "POST" });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Could not join board.");
      return;
    }

    router.refresh();
  }

  return (
    <article className="panel rounded-[24px] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">Board name</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{board.name}</h2>
          <p className="mt-2 text-sm leading-6 text-violet-100/68">{board.description ?? "No description."}</p>
        </div>
        {board.joined ? (
          <span className="mono rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-emerald-200">
            joined
          </span>
        ) : null}
      </div>

      <div className="mt-4 space-y-2">
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

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <Metric label="repos" value={board.repoSourceCount} />
        <Metric label="users" value={board.userSourceCount} />
        <Metric label="events" value={board.summary.totalEvents} />
        <Metric label="members" value={board.memberCount} />
      </div>

      {error ? <p className="mt-4 text-sm font-medium text-rose-300">{error}</p> : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          className="rounded-full bg-[linear-gradient(135deg,#ff4fd8,#7c5cff)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(255,79,216,0.35)] transition hover:opacity-95"
          href={`/boards/${board.slug}`}
        >
          Open board
        </Link>
        {signedIn ? (
          board.joined ? (
            <Link
              className="rounded-full border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/35 hover:bg-cyan-300/10"
              href="/dashboard"
            >
              View on dashboard
            </Link>
          ) : (
            <button
              className="rounded-full border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/35 hover:bg-cyan-300/10 disabled:opacity-60"
              disabled={isPending}
              onClick={() => startTransition(() => void joinBoard())}
              type="button"
            >
              {isPending ? "Joining..." : "Join board"}
            </button>
          )
        ) : (
          <Link
            className="rounded-full border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/35 hover:bg-cyan-300/10"
            href="/sign-in"
          >
            Sign in to join
          </Link>
        )}
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
