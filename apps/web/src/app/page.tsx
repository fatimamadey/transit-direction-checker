import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getPublicBoardsData } from "@/lib/data";

export default async function HomePage() {
  const { userId } = await auth();
  const boards = await getPublicBoardsData(6);

  return (
    <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-4 sm:px-6 lg:px-8">
      <section className="panel-strong relative overflow-hidden rounded-[34px] p-6 sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_5%_10%,rgba(95,225,255,0.14),transparent_26%),radial-gradient(circle_at_85%_15%,rgba(255,79,216,0.18),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />

        <div className="relative grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-400 shadow-[0_0_20px_rgba(255,79,216,0.85)]" />
              <span className="mono text-[11px] uppercase tracking-[0.3em] text-violet-200/70">
                GitHub boards
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-5xl text-5xl font-semibold leading-[0.95] text-white sm:text-7xl lg:text-[5.5rem]">
                Named groups for the repos and users you want to track.
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-violet-100/70">
                Each board is a group. The board name tells you what the group is. The source list tells you exactly
                which repos and users are being tracked. Open a board to see the activity stats and event stream for that group.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <InfoTile step="01" title="Create a board" />
              <InfoTile step="02" title="Add repos and users" />
              <InfoTile step="03" title="Open the stats page" />
            </div>

            <div className="flex flex-wrap gap-4">
              {userId ? (
                <Link
                  className="rounded-full bg-[linear-gradient(135deg,#ff4fd8,#7c5cff)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_46px_rgba(255,79,216,0.38)] transition hover:opacity-95"
                  href="/dashboard"
                >
                  Open dashboard
                </Link>
              ) : (
                <>
                  <Link
                    className="rounded-full bg-[linear-gradient(135deg,#ff4fd8,#7c5cff)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_46px_rgba(255,79,216,0.38)] transition hover:opacity-95"
                    href="/sign-up"
                  >
                    Get started
                  </Link>
                  <Link
                    className="rounded-full border border-white/12 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/35 hover:bg-cyan-300/10"
                    href="/sign-in"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="mono text-[11px] uppercase tracking-[0.28em] text-violet-200/65">Public boards</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">What people are tracking</h2>
              </div>
              <span className="mono rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-cyan-200">
                {boards.length} groups
              </span>
            </div>
            <div className="grid gap-4">
              {boards.length ? boards.map((board) => <LandingBoardCard board={board} key={board.id} />) : <EmptyLandingState />}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function InfoTile({ step, title }: { step: string; title: string }) {
  return (
    <div className="panel rounded-[22px] p-4">
      <p className="mono text-[10px] uppercase tracking-[0.24em] text-violet-200/55">{step}</p>
      <p className="mt-2 text-lg font-medium text-white">{title}</p>
    </div>
  );
}

function LandingBoardCard({ board }: { board: Awaited<ReturnType<typeof getPublicBoardsData>>[number] }) {
  return (
    <Link
      className="panel block rounded-[24px] p-5 transition hover:border-cyan-300/35 hover:bg-white/[0.06]"
      href={`/boards/${board.slug}`}
    >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">Board name</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">{board.name}</h3>
            <p className="mt-2 text-sm leading-6 text-violet-100/68">{board.description ?? "No description."}</p>
          </div>
          <div className="mono text-[11px] uppercase tracking-[0.22em] text-cyan-200/75">open board</div>
        </div>

      <div className="mt-4 space-y-2">
        <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">Tracking</p>
        <div className="flex flex-wrap gap-2">
          {board.trackedSources.length ? (
            board.trackedSources.map((source) => (
              <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-xs text-violet-100/85" key={source.id}>
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
    </Link>
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

function EmptyLandingState() {
  return (
    <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-violet-100/60">
      No public boards yet.
    </div>
  );
}
