import Link from "next/link";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function HomePage() {
  const { userId } = await auth();

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-12">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="space-y-6">
          <p className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900">
            CTA train directions, without the guesswork
          </p>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-5xl font-black tracking-tight text-slate-900 sm:text-6xl">
              Take This One
            </h1>
            <p className="max-w-2xl text-xl leading-8 text-slate-700">
              Save the trips you actually take. Then get one clear answer when a train is coming:
              right direction or wrong direction.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            {!userId ? (
              <>
              <SignUpButton>
                <button className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
                  Get started
                </button>
              </SignUpButton>
              <SignInButton>
                <button className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400">
                  Sign in
                </button>
              </SignInButton>
              </>
            ) : (
              <Link
                className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                href="/dashboard"
              >
                Open dashboard
              </Link>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_30px_70px_rgba(15,23,42,0.08)]">
          <div className="mb-4 rounded-3xl bg-[var(--green-bg)] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--green-text)]">
              RIGHT DIRECTION
            </p>
            <h2 className="mt-2 text-3xl font-black text-[var(--green-text)]">Yes, take this one.</h2>
            <p className="mt-3 text-base text-[var(--green-text)]">
              Red Line toward Howard. Arrives in 4 min.
            </p>
          </div>

          <div className="rounded-3xl bg-[var(--red-bg)] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--red-text)]">
              WRONG DIRECTION
            </p>
            <h2 className="mt-2 text-3xl font-black text-[var(--red-text)]">Nope, not this one.</h2>
            <p className="mt-3 text-base text-[var(--red-text)]">
              Next safe option arrives in 9 min.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
