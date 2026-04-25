"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BoardRow } from "@/components/board-row";
import type { BoardListItem } from "@/types/dashboard";

type PublicBoardsShellProps = {
  boards: BoardListItem[];
  signedIn: boolean;
  userName?: string | null;
};

type SortMode = "recent" | "members" | "sources";

export function PublicBoardsShell({ boards, signedIn, userName }: PublicBoardsShellProps) {
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const router = useRouter();

  const sortedBoards = useMemo(() => {
    const next = [...boards];

    next.sort((a, b) => {
      if (sortMode === "members") {
        return b.memberCount - a.memberCount;
      }

      if (sortMode === "sources") {
        return b.sourceCount - a.sourceCount;
      }

      const aTime = a.summary.latestEventAt ? new Date(a.summary.latestEventAt).getTime() : 0;
      const bTime = b.summary.latestEventAt ? new Date(b.summary.latestEventAt).getTime() : 0;
      return bTime - aTime;
    });

    return next;
  }, [boards, sortMode]);

  return (
    <div className="animate-panel-in grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="panel rounded-[28px] p-5">
        <div className="border-b border-white/8 pb-4">
          <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">public boards</p>
          <h1 className="mt-2 text-lg font-semibold text-white">Browse by activity, members, or source count.</h1>
        </div>

        <div className="mt-4 space-y-2">
          <SortButton active={sortMode === "recent"} label="Most recent" onClick={() => setSortMode("recent")} />
          <SortButton active={sortMode === "members"} label="Most members" onClick={() => setSortMode("members")} />
          <SortButton active={sortMode === "sources"} label="Most sources" onClick={() => setSortMode("sources")} />
        </div>

        <div className="mt-6 rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
          <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">browse tip</p>
          <p className="mt-2 text-sm leading-6 text-violet-100/66">
            Open a board when the tracked sources and the latest activity already look useful. Join it only if you want it on your dashboard.
          </p>
        </div>
      </aside>

      <section className="panel rounded-[28px] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/8 pb-4">
          <div>
            <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">directory</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Public boards</h2>
          </div>
          <div className="flex items-center gap-3">
            {signedIn ? (
              <>
                <div className="mono rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-cyan-200/75">
                  {userName ?? "member"}
                </div>
                <Link
                  className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-300/35 hover:bg-cyan-300/10"
                  href="/dashboard"
                >
                  Your boards
                </Link>
                <UserButton />
              </>
            ) : (
              <>
                <Link
                  className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-300/35 hover:bg-cyan-300/10"
                  href="/sign-in"
                >
                  Sign in
                </Link>
                <Link
                  className="rounded-full bg-[linear-gradient(135deg,#ff4fd8,#7c5cff)] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(255,79,216,0.35)] transition hover:opacity-95"
                  href="/sign-up"
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="mt-2 divide-y divide-white/8">
          {sortedBoards.length ? (
            sortedBoards.map((board) => (
              <BoardRow
                board={board}
                key={board.id}
                onJoined={() => {
                  router.refresh();
                }}
                signedIn={signedIn}
              />
            ))
          ) : (
            <div className="py-8 text-sm text-violet-100/60">No public boards yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}

function SortButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={`mono flex w-full items-center justify-between rounded-[16px] border px-3 py-3 text-[11px] uppercase tracking-[0.22em] transition ${
        active
          ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-200"
          : "border-white/8 bg-white/[0.03] text-violet-100/76 hover:border-cyan-300/20 hover:text-white"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
      <span>{active ? "•" : "→"}</span>
    </button>
  );
}
