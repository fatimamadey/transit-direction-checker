import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { LandingBoardCarousel } from "@/components/landing-board-carousel";
import { getPublicBoardsData } from "@/lib/data";

export default async function HomePage() {
  const { userId } = await auth();
  const boards = await getPublicBoardsData(6);

  return (
    <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-4 sm:px-6 lg:px-8">
      <nav className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-white/[0.03] px-5 py-4">
        <Link className="text-xl font-semibold text-white" href="/">
          Pulseboard
        </Link>
        <div className="flex flex-wrap items-center gap-3">
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

      <section className="panel-strong relative overflow-hidden rounded-[34px] p-6 sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_5%_10%,rgba(95,225,255,0.14),transparent_26%),radial-gradient(circle_at_85%_15%,rgba(255,79,216,0.18),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />

        <div className="relative space-y-8">
          <section className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-400 shadow-[0_0_20px_rgba(255,79,216,0.85)]" />
              <span className="mono text-[11px] uppercase tracking-[0.3em] text-violet-200/70">
                GitHub boards
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-5xl text-5xl font-semibold leading-[0.95] text-white sm:text-7xl lg:text-[5.5rem]">
                Shared boards for GitHub activity.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-violet-100/70">
                Track repos and people together. Open a board to see what it follows and how active it is.
              </p>
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
                    Create account
                  </Link>
                  <Link
                    className="rounded-full border border-white/12 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/35 hover:bg-cyan-300/10"
                    href="/boards"
                  >
                    Browse boards
                  </Link>
                </>
              )}
            </div>
          </section>
        </div>
      </section>

      <div className="mt-4">
        <LandingBoardCarousel boards={boards} />
      </div>
    </main>
  );
}
