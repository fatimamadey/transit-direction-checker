"use client";

import type { DashboardData } from "@/types/dashboard";
import { SavedTripCard } from "./saved-trip-card";
import { SavedTripForm } from "./saved-trip-form";

type DashboardShellProps = {
  dashboardData: DashboardData;
  userName: string;
};

export function DashboardShell({ dashboardData, userName }: DashboardShellProps) {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)] sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Take This One
          </p>
          <h1 className="text-4xl font-black text-slate-900">Hi {userName}. Let&apos;s avoid the wrong train.</h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            Save your usual CTA trips and this screen will tell you what is safe to board right now.
          </p>
        </div>
        <div className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
          Demo mode
        </div>
      </header>

      <section className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <SavedTripForm stations={dashboardData.stations} />

        <div className="space-y-5">
          {dashboardData.trips.length > 0 ? (
            dashboardData.trips.map((trip) => <SavedTripCard key={trip.id} trip={trip} />)
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 p-8">
              <h2 className="text-2xl font-bold text-slate-900">No saved trips yet.</h2>
              <p className="mt-3 text-slate-600">
                Add a trip on the left. Keep it simple, like Home to Campus.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
