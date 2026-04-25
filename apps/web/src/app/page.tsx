import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { BoardRow } from "@/components/board-row";
import { getPublicBoardsData } from "@/lib/data";

export default async function HomePage() {
  const { userId } = await auth();
  const boards = await getPublicBoardsData(6);
  const [featuredBoard, ...otherBoards] = boards;

  return (
    <main className="mx-auto min-h-screen max-w-[1520px] px-4 py-4 sm:px-6 lg:px-8">
      <nav className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-[#151124]/84 px-5 py-4 backdrop-blur">
        <Link className="flex items-center gap-3 text-base font-semibold text-white" href="/">
          <span className="mono rounded-[10px] border border-white/10 bg-white/5 px-2 py-1 text-[11px] uppercase tracking-[0.22em] text-cyan-200">
            pb
          </span>
          Pulseboard
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <div className="mono rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-cyan-200/80">
            GitHub poll feed
          </div>
          <Link className="mono text-sm text-violet-100/75 transition hover:text-white" href="/boards">
            Public boards
          </Link>
          {userId ? (
            <Link
              className="rounded-full border border-white/12 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-cyan-300/35 hover:bg-cyan-300/10"
              href="/dashboard"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link className="mono text-sm text-violet-100/75 transition hover:text-white" href="/sign-in">
                Sign in
              </Link>
              <Link
                className="rounded-full bg-[linear-gradient(135deg,#ff4fd8,#7c5cff)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(255,79,216,0.35)] transition hover:opacity-95"
                href="/sign-up"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </nav>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="panel-strong rounded-[30px] p-6 sm:p-8">
          <div className="space-y-6">
            <div className="mono text-[11px] uppercase tracking-[0.28em] text-violet-200/65">
              Public GitHub activity boards
            </div>
            <div className="space-y-3">
              <h1 className="max-w-xl text-[2.2rem] font-semibold leading-tight text-white sm:text-[2.8rem]">
                Track repos and people in shared boards.
              </h1>
              <p className="max-w-lg text-sm leading-7 text-violet-100/72">
                Use boards to group sources, follow live-ish GitHub activity, and decide what is worth opening next.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {userId ? (
                <Link
                  className="rounded-full bg-[linear-gradient(135deg,#ff4fd8,#7c5cff)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(255,79,216,0.35)] transition hover:opacity-95"
                  href="/dashboard"
                >
                  Open your boards
                </Link>
              ) : (
                <>
                  <Link
                    className="rounded-full bg-[linear-gradient(135deg,#ff4fd8,#7c5cff)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(255,79,216,0.35)] transition hover:opacity-95"
                    href="/sign-up"
                  >
                    Create account
                  </Link>
                  <Link
                    className="rounded-full border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/35 hover:bg-cyan-300/10"
                    href="/boards"
                  >
                    Browse boards
                  </Link>
                </>
              )}
            </div>
            <div className="rounded-[22px] border border-white/10 bg-[#120f22] p-4">
              <div className="mono flex flex-wrap gap-x-4 gap-y-2 text-[10px] uppercase tracking-[0.22em] text-violet-200/58">
                <span>GitHub events</span>
                <span>worker polling</span>
                <span>board fanout</span>
                <span>board feed</span>
              </div>
            </div>
          </div>
        </div>

        <div className="panel rounded-[30px] p-5">
          <div className="flex items-center justify-between border-b border-white/8 pb-3">
            <div>
              <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">workspace preview</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Open a board and monitor the feed.</h2>
            </div>
            <Link className="mono text-[11px] uppercase tracking-[0.22em] text-cyan-200 transition hover:text-cyan-100" href="/boards">
              browse all
            </Link>
          </div>

          {featuredBoard ? (
            <div className="mt-4">
              <BoardRow board={featuredBoard} signedIn={Boolean(userId)} variant="compact" />
            </div>
          ) : (
            <div className="mt-4 rounded-[20px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-violet-100/60">
              No public boards yet.
            </div>
          )}
        </div>
      </section>

      <section className="panel mt-4 rounded-[30px] p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/8 pb-4">
          <div>
            <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">public boards now</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Choose a board by freshness and tracked sources.</h2>
          </div>
          <Link className="mono text-[11px] uppercase tracking-[0.22em] text-cyan-200 transition hover:text-cyan-100" href="/boards">
            see full directory
          </Link>
        </div>
        <div className="mt-2 divide-y divide-white/8">
          {otherBoards.length ? (
            otherBoards.map((board) => <BoardRow board={board} key={board.id} signedIn={Boolean(userId)} />)
          ) : (
            <div className="py-8 text-sm text-violet-100/60">Public boards will show up here once people create them.</div>
          )}
        </div>
      </section>
    </main>
  );
}
