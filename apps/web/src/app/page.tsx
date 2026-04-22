import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-10">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-[var(--border)] bg-[rgba(255,248,238,0.86)] p-8 shadow-[0_35px_90px_rgba(132,76,22,0.12)] sm:p-10">
          <div className="absolute -right-16 top-8 h-48 w-48 rounded-full bg-[rgba(246,185,76,0.18)] blur-3xl" />
          <div className="absolute bottom-0 right-0 h-40 w-40 rounded-tl-[4rem] bg-[rgba(255,255,255,0.45)]" />
          <div className="relative space-y-7">
            <p className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900">
              Built for people who overthink platforms
            </p>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-5xl font-black text-[var(--ink)] sm:text-7xl">
                Take This One
              </h1>
              <p className="max-w-2xl text-xl leading-8 text-slate-700">
                Not a route planner. Not a map wall. Just one big, obvious answer before you board.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl bg-white/70 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Step 1</p>
                <p className="mt-2 text-lg font-bold text-slate-900">Save your usual trip</p>
              </div>
              <div className="rounded-3xl bg-white/70 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Step 2</p>
                <p className="mt-2 text-lg font-bold text-slate-900">Watch live CTA arrivals</p>
              </div>
              <div className="rounded-3xl bg-white/70 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Step 3</p>
                <p className="mt-2 text-lg font-bold text-slate-900">Avoid the wrong train</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                className="rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] hover:bg-slate-800"
                href="/dashboard"
              >
                Open live demo
              </Link>
              <p className="self-center text-sm font-medium text-slate-600">
                Chicago CTA only. Purposefully small.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-[2.5rem] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_35px_90px_rgba(15,23,42,0.08)]">
          <div className="rounded-[2rem] bg-[var(--green-bg)] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--green-text)]">
              RIGHT DIRECTION
            </p>
            <h2 className="mt-2 text-4xl font-black text-[var(--green-text)]">Yes, take this one.</h2>
            <p className="mt-3 text-base text-[var(--green-text)]">
              Red Line toward Howard. Doors soon. No second guessing.
            </p>
          </div>

          <div className="rounded-[2rem] bg-[var(--red-bg)] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--red-text)]">
              WRONG DIRECTION
            </p>
            <h2 className="mt-2 text-4xl font-black text-[var(--red-text)]">Nope, not this one.</h2>
            <p className="mt-3 text-base text-[var(--red-text)]">
              Wrong side of the platform. Next safe option arrives in 4 min.
            </p>
          </div>

          <div className="rounded-[2rem] border border-dashed border-amber-300 bg-[var(--sand)] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-900">What this app is</p>
            <p className="mt-2 text-lg font-bold text-slate-900">
              A wrong-direction prevention app for everyday trips.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
