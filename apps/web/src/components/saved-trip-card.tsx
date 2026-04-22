"use client";

import { deleteSavedTripAction } from "@/actions/saved-trips";
import type { DashboardTrip } from "@/types/dashboard";

type SavedTripCardProps = {
  trip: DashboardTrip;
};

function formatArrival(minutes: number) {
  if (minutes <= 0) {
    return "Due now";
  }

  return `${minutes} min`;
}

export function SavedTripCard({ trip }: SavedTripCardProps) {
  const nextSafe = trip.rightDirectionArrivals[0];
  const deleteAction = deleteSavedTripAction.bind(null, trip.id);

  return (
    <article className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{trip.route} Line</p>
          <h2 className="mt-2 text-3xl font-black text-slate-900">{trip.label}</h2>
          <p className="mt-2 text-slate-600">
            {trip.originStationName} to {trip.destinationStationName}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Safe direction: {trip.preferredDirection}
          </p>
        </div>

        <form action={deleteAction}>
          <button
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-500"
            type="submit"
          >
            Remove
          </button>
        </form>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl bg-[var(--green-bg)] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--green-text)]">
            RIGHT DIRECTION
          </p>
          <h3 className="mt-2 text-3xl font-black text-[var(--green-text)]">
            {nextSafe ? "Yes, take this one." : "No safe train yet."}
          </h3>
          <p className="mt-3 text-sm leading-6 text-[var(--green-text)]">
            {nextSafe
              ? `${nextSafe.destination_name ?? trip.destinationStationName} in ${formatArrival(nextSafe.minutes_away)}`
              : "We are checking CTA live arrivals right now."}
          </p>
        </div>

        <div className="rounded-3xl bg-[var(--red-bg)] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--red-text)]">
            WRONG DIRECTION
          </p>
          <h3 className="mt-2 text-3xl font-black text-[var(--red-text)]">Nope, not this one.</h3>
          <p className="mt-3 text-sm leading-6 text-[var(--red-text)]">
            {trip.wrongDirectionArrivals[0]
              ? `${trip.wrongDirectionArrivals[0].destination_name ?? "Another direction"} in ${formatArrival(trip.wrongDirectionArrivals[0].minutes_away)}`
              : "No wrong-direction trains are currently listed."}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {trip.rightDirectionArrivals.slice(0, 3).map((arrival) => (
          <div key={arrival.id} className="rounded-2xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-900">Next safe option</p>
            <p className="mt-1 text-lg font-bold text-green-900">
              {arrival.destination_name ?? trip.destinationStationName}
            </p>
            <p className="text-sm text-green-800">{formatArrival(arrival.minutes_away)}</p>
          </div>
        ))}

        {trip.wrongDirectionArrivals.slice(0, 2).map((arrival) => (
          <div key={arrival.id} className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-900">Wrong-direction train</p>
            <p className="mt-1 text-lg font-bold text-red-900">{arrival.destination_name ?? "Wrong direction"}</p>
            <p className="text-sm text-red-800">{formatArrival(arrival.minutes_away)}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
