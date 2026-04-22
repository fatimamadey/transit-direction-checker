import { seedDemoTripsAction } from "@/actions/saved-trips";

export function DemoTripButton() {
  return (
    <form action={seedDemoTripsAction}>
      <button
        className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:border-amber-400 hover:bg-amber-100"
        type="submit"
      >
        Load sample trips
      </button>
    </form>
  );
}
