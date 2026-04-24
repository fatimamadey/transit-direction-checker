import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[1500px] items-center px-4 py-4 sm:px-6 lg:px-8">
      <div className="grid w-full gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="panel-strong hidden rounded-[32px] p-8 xl:block">
          <p className="mono text-[11px] uppercase tracking-[0.3em] text-violet-200/65">Authentication</p>
          <h1 className="mt-4 text-5xl font-semibold text-white">
            Re-enter the <span className="text-gradient">signal room</span>.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-violet-100/70">
            Sign in with the provider you already use on the web and jump back into live GitHub boards, source orbits,
            and event motion without touching a flat admin dashboard.
          </p>
        </section>

        <section className="flex items-center justify-center rounded-[32px] border border-white/10 bg-white/[0.03] px-4 py-10">
          <SignIn />
        </section>
      </div>
    </main>
  );
}
