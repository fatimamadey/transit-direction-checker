"use client";

import type { DashboardData } from "@/types/dashboard";
import { useLiveArrivals } from "@/lib/use-live-arrivals";
import { DemoTripButton } from "./demo-trip-button";
import { SavedTripCard } from "./saved-trip-card";
import { SavedTripForm } from "./saved-trip-form";

type DashboardShellProps = {
  dashboardData: DashboardData;
  userName: string;
};

export function DashboardShell({ dashboardData, userName }: DashboardShellProps) {
  const { trips, isConnected } = useLiveArrivals(dashboardData);
  const safeCount = trips.filter((trip) => trip.rightDirectionArrivals.length > 0).length;

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-[2.4rem] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_25px_70px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-bl-[3rem] bg-[rgba(246,185,76,0.18)]" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              Take This One
            </p>
            <div className="space-y-2">
              <h1 className="text-4xl font-black text-slate-900 sm:text-5xl">
                Hi {userName}. Let&apos;s keep this obvious.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600">
                Big answers only. Green means go. Red means absolutely not.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:min-w-64">
            <div className="rounded-3xl bg-white/80 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Live feed</p>
              <p className={`mt-2 text-lg font-bold ${isConnected ? "text-emerald-700" : "text-amber-700"}`}>
                {isConnected ? "Realtime connected" : "Waiting for live feed"}
              </p>
            </div>
            <div className="rounded-3xl bg-white/80 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Safe trips now</p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {safeCount} of {trips.length || 0} ready to board
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <SavedTripForm stations={dashboardData.stations} />

        <div className="space-y-5">
          {trips.length > 0 ? (
            trips.map((trip) => <SavedTripCard key={trip.id} trip={trip} />)
          ) : (
            <div className="rounded-[2.2rem] border border-dashed border-slate-300 bg-white/70 p-8">
              <h2 className="text-3xl font-black text-slate-900">No saved trips yet.</h2>
              <p className="mt-3 max-w-xl text-slate-600">
                Add one simple favorite, like Campus to Home. The worker will check CTA for you and flag the right direction in green.
              </p>
              <div className="mt-5">
                <DemoTripButton />
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
