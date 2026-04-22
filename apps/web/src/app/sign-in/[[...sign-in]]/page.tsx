export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="max-w-lg rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Auth paused</p>
        <h1 className="mt-3 text-4xl font-black text-slate-900">Demo mode is live.</h1>
        <p className="mt-4 text-slate-600">
          Authentication is temporarily on the back burner while the public demo is being polished.
        </p>
      </div>
    </main>
  );
}
