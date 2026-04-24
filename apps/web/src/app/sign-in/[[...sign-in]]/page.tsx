import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[1500px] items-center px-4 py-4 sm:px-6 lg:px-8">
      <div className="grid w-full gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="panel-strong hidden rounded-[32px] p-8 xl:block">
          <p className="mono text-[11px] uppercase tracking-[0.3em] text-violet-200/65">Sign in</p>
          <h1 className="mt-4 text-5xl font-semibold text-white">Open your boards.</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-violet-100/70">
            Sign in with Google or GitHub. Once you are in, you can create boards, join public boards, and add tracked repos or users to boards you joined.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="rounded-full border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/35 hover:bg-cyan-300/10"
              href="/boards"
            >
              Browse public boards
            </Link>
            <Link
              className="rounded-full border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/35 hover:bg-cyan-300/10"
              href="/"
            >
              Back home
            </Link>
          </div>
        </section>

        <section className="flex items-center justify-center rounded-[32px] border border-white/10 bg-white/[0.03] px-4 py-10">
          <SignIn />
        </section>
      </div>
    </main>
  );
}
