import { fetchPredictionsForMapId } from "./cta";
import { supabase } from "./db";

type TripQueryRow = {
  id: string;
  route: string;
  preferred_direction: string;
  is_active: boolean;
  origin_station: {
    map_id: string;
    stop_name: string;
  } | null;
};

export async function pollOnce() {
  const { data: trips, error } = await supabase
    .from("saved_trips")
    .select(
      `
      *,
      origin_station:cta_stations!saved_trips_origin_station_id_fkey(map_id, stop_name)
    `
    )
    .eq("is_active", true);

  if (error) {
    throw new Error(error.message);
  }

  const typedTrips = (trips ?? []) as TripQueryRow[];

  if (!typedTrips.length) {
    console.log("No active trips found.");
    return;
  }

  const tripsByMapId = new Map<string, TripQueryRow[]>();

  for (const trip of typedTrips) {
    const mapId = trip.origin_station?.map_id;

    if (!mapId) {
      continue;
    }

    const current = tripsByMapId.get(mapId) ?? [];
    current.push(trip);
    tripsByMapId.set(mapId, current);
  }

  for (const [mapId, tripsForStation] of tripsByMapId.entries()) {
    try {
      const predictions = await fetchPredictionsForMapId(mapId);

      for (const trip of tripsForStation) {
        const tripPredictions = predictions.filter((prediction) => prediction.route === trip.route);
        const payload = tripPredictions.map((prediction) => {
          const isRightDirection = prediction.direction === trip.preferred_direction;
          const minutesAway = getMinutesAway(prediction.arrivalTime);

          return {
            saved_trip_id: trip.id,
            cta_prediction_id: prediction.predictionId,
            route: prediction.route,
            destination_name: prediction.destinationName,
            direction: prediction.direction,
            arrival_time: prediction.arrivalTime,
            minutes_away: minutesAway,
            is_right_direction: isRightDirection,
            status_label: isRightDirection ? "RIGHT DIRECTION" : "WRONG DIRECTION",
            status_message: isRightDirection ? "Yes, take this one." : "Nope, not this one.",
            raw_payload: prediction.rawPayload,
            last_updated: new Date().toISOString()
          };
        });

        await supabase.from("live_arrivals").delete().eq("saved_trip_id", trip.id);

        if (payload.length > 0) {
          const { error: insertError } = await supabase.from("live_arrivals").insert(payload);

          if (insertError) {
            console.error(`Failed to write live arrivals for trip ${trip.id}:`, insertError.message);
          }
        }
      }
    } catch (stationError) {
      console.error(`Polling failed for map id ${mapId}:`, stationError);
    }
  }
}

function getMinutesAway(arrivalTime: string) {
  const msUntilArrival = new Date(arrivalTime).getTime() - Date.now();
  return Math.max(0, Math.round(msUntilArrival / 60000));
}
