import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

export default async function HomePage() {
  const { userId } = await auth();

  return (
    <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-4 sm:px-6 lg:px-8">
      <section className="panel-strong relative overflow-hidden rounded-[34px] p-6 sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_5%_10%,rgba(95,225,255,0.14),transparent_26%),radial-gradient(circle_at_85%_15%,rgba(255,79,216,0.18),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />

        <div className="relative grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <section className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-400 shadow-[0_0_20px_rgba(255,79,216,0.85)]" />
              <span className="mono text-[11px] uppercase tracking-[0.3em] text-violet-200/70">
                GitHub boards // pulse visualization
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-5xl text-5xl font-semibold leading-[0.95] text-white sm:text-7xl lg:text-[5.5rem]">
                Watch software teams move as a <span className="text-gradient">living signal field</span>.
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-violet-100/70">
                Pulseboard turns GitHub activity into a radical command center. Join boards, wire in repos or users,
                and read commits, PRs, issues, and comments as motion, rhythm, and clusters instead of dead lists.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <InfoTile step="01" title="Join signal rooms" />
              <InfoTile step="02" title="Inject repos and users" />
              <InfoTile step="03" title="Read live patterns" />
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
                    Launch with Google or GitHub
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

          <section className="grid gap-4 lg:grid-rows-[1.2fr_0.8fr]">
            <div className="panel grid-lines animate-panel-in rounded-[30px] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mono text-[11px] uppercase tracking-[0.28em] text-violet-200/65">Board skyline</p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">Not a feed. A pulse map.</h2>
                </div>
                <span className="mono rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-cyan-200">
                  polling, not sockets
                </span>
              </div>
              <div className="mt-6 grid h-full grid-cols-8 gap-2">
                {[26, 42, 38, 64, 56, 88, 60, 74].map((height, index) => (
                  <div className="flex items-end" key={index}>
                    <div
                      className="w-full rounded-t-[18px] bg-[linear-gradient(180deg,rgba(95,225,255,0.92),rgba(255,79,216,0.65))] shadow-[0_0_32px_rgba(95,225,255,0.16)]"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FeatureCard
                accent="fuchsia"
                body="Every board becomes a visual room with source orbits, timeline charts, and a live activity ticker."
                title="Visualization-first"
              />
              <FeatureCard
                accent="cyan"
                body="Poll each GitHub source once, then fan activity out to every board that depends on it."
                title="Deduplicated worker"
              />
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

function FeatureCard({ accent, title, body }: { accent: "fuchsia" | "cyan"; title: string; body: string }) {
  const accentClass =
    accent === "fuchsia"
      ? "border-fuchsia-300/20 bg-fuchsia-400/10 text-fuchsia-100"
      : "border-cyan-300/20 bg-cyan-300/10 text-cyan-100";

  return (
    <div className={`rounded-[24px] border p-5 ${accentClass}`}>
      <p className="mono text-[10px] uppercase tracking-[0.22em] opacity-80">Design note</p>
      <h3 className="mt-2 text-xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-6 opacity-85">{body}</p>
    </div>
  );
}
