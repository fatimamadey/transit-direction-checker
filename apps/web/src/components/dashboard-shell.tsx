"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
      headers: {
        "Content-Type": "application/json"
      },
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
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-[2.4rem] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_25px_70px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-bl-[3rem] bg-[rgba(246,185,76,0.18)]" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Pulseboard</p>
            <div className="space-y-2">
              <h1 className="text-4xl font-black text-slate-900 sm:text-5xl">Hi {userName}. Pick a board and watch GitHub move.</h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600">
                Public boards collect commits, issues, and pull requests from tracked GitHub users and repositories.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
              Polling every few seconds
            </div>
            <UserButton />
          </div>
        </div>
      </header>

      <section className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <div className="rounded-[2.2rem] border border-[var(--border)] bg-[rgba(255,255,255,0.85)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="rounded-[1.7rem] bg-[var(--sand)] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-900">Create board</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">Start a new board</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Make something shared and specific, like a class board, team board, or open source watchlist.
            </p>
          </div>

          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(() => {
                void createBoard();
              });
            }}
          >
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">Board name</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400"
                onChange={(event) => setName(event.target.value)}
                placeholder="CS class pulse"
                required
                value={name}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">Description</span>
              <textarea
                className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400"
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Track repos, maintainers, and issue activity for a small group."
                value={description}
              />
            </label>

            {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}

            <button
              className="w-full rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] hover:bg-slate-800 disabled:opacity-60"
              disabled={isPending}
              type="submit"
            >
              {isPending ? "Creating..." : "Create board"}
            </button>
          </form>
        </div>

        <div className="space-y-8">
          <BoardSection boards={dashboardData.joinedBoards} title="Joined boards" />
          <BoardSection boards={dashboardData.publicBoards} title="Explore public boards" />
        </div>
      </section>
    </div>
  );
}

function BoardSection({ title, boards }: { title: string; boards: BoardListItem[] }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900">{title}</h2>
        <span className="text-sm font-medium text-slate-500">{boards.length} boards</span>
      </div>

      {boards.length ? (
        <div className="grid gap-4">
          {boards.map((board) => (
            <article
              key={board.id}
              className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-black text-slate-900">{board.name}</h3>
                    {board.joined ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">
                        Joined
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm font-medium text-slate-500">/{board.slug}</p>
                  <p className="max-w-2xl text-slate-600">{board.description ?? "No description yet."}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm font-medium text-slate-700">
                    {board.memberCount} members
                  </div>
                  <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm font-medium text-slate-700">
                    {board.sourceCount} sources
                  </div>
                  <Link
                    className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    href={`/boards/${board.slug}`}
                  >
                    Open
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 p-8 text-slate-600">
          No boards here yet.
        </div>
      )}
    </section>
  );
}
