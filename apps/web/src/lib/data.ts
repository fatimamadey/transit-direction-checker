import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { DashboardData, DashboardTrip, LiveArrivalRow, SavedTripRow } from "@/types/dashboard";

export async function getDashboardData(clerkUserId: string): Promise<DashboardData> {
  const supabase = getServiceRoleClient();

  const [{ data: stations, error: stationsError }, { data: trips, error: tripsError }] = await Promise.all([
    supabase.from("cta_stations").select("*").eq("is_active", true).order("display_order"),
    supabase
      .from("saved_trips")
      .select(
        `
        *,
        origin_station:cta_stations!saved_trips_origin_station_id_fkey(id, stop_name),
        destination_station:cta_stations!saved_trips_destination_station_id_fkey(id, stop_name)
      `
      )
      .eq("clerk_user_id", clerkUserId)
      .order("created_at", { ascending: false })
  ]);

  if (stationsError) {
    throw new Error(stationsError.message);
  }

  if (tripsError) {
    throw new Error(tripsError.message);
  }

  const tripIds = (trips ?? []).map((trip) => trip.id);

  const { data: arrivals, error: arrivalsError } = tripIds.length
    ? await supabase
        .from("live_arrivals")
        .select("*")
        .in("saved_trip_id", tripIds)
        .order("arrival_time", { ascending: true })
    : { data: [], error: null };

  if (arrivalsError) {
    throw new Error(arrivalsError.message);
  }

  return {
    stations: stations ?? [],
    trips: buildDashboardTrips(trips ?? [], arrivals ?? [])
  };
}

function buildDashboardTrips(trips: SavedTripRow[], arrivals: LiveArrivalRow[]): DashboardTrip[] {
  return trips.map((trip) => {
    const tripArrivals = arrivals.filter((arrival) => arrival.saved_trip_id === trip.id);
    const rightDirectionArrivals = tripArrivals.filter((arrival) => arrival.is_right_direction);
    const wrongDirectionArrivals = tripArrivals.filter((arrival) => !arrival.is_right_direction);

    return {
      id: trip.id,
      label: trip.label,
      route: trip.route,
      preferredDirection: trip.preferred_direction,
      originStationName: trip.origin_station?.stop_name ?? "Unknown origin",
      destinationStationName: trip.destination_station?.stop_name ?? "Unknown destination",
      rightDirectionArrivals,
      wrongDirectionArrivals
    };
  });
}
