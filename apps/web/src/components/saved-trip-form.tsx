import { createSavedTripAction } from "@/actions/saved-trips";
import type { CtaStationRow } from "@/types/dashboard";

type SavedTripFormProps = {
  stations: CtaStationRow[];
};

export function SavedTripForm({ stations }: SavedTripFormProps) {
  return (
    <section className="rounded-[2rem] border border-[var(--border)] bg-white/90 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
      <h2 className="text-2xl font-black text-slate-900">Save a trip</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Pick the CTA station and direction that means “safe” for this trip.
      </p>

      <form action={createSavedTripAction} className="mt-6 space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-700">Label</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-0 transition focus:border-slate-400"
            name="label"
            placeholder="Home to Campus"
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-700">Origin station</span>
          <select
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400"
            name="origin_station_id"
            required
          >
            <option value="">Choose a station</option>
            {stations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.stop_name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-700">Destination station</span>
          <select
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400"
            name="destination_station_id"
            required
          >
            <option value="">Choose a station</option>
            {stations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.stop_name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-700">Route</span>
          <select
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400"
            name="route"
            required
          >
            <option value="Red">Red Line</option>
            <option value="Blue">Blue Line</option>
            <option value="Brown">Brown Line</option>
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-700">Preferred direction</span>
          <select
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400"
            name="preferred_direction"
            required
          >
            <option value="Northbound">Northbound</option>
            <option value="Southbound">Southbound</option>
            <option value="Eastbound">Eastbound</option>
            <option value="Westbound">Westbound</option>
          </select>
        </label>

        <button
          className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          type="submit"
        >
          Save this trip
        </button>
      </form>
    </section>
  );
}
