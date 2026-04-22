"use client";

import { useEffect, useRef, useState } from "react";
import { useSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { DashboardData, DashboardTrip, LiveArrivalRow } from "@/types/dashboard";

export function useLiveArrivals(initialData: DashboardData) {
  const [trips, setTrips] = useState<DashboardTrip[]>(initialData.trips);
  const [isConnected, setIsConnected] = useState(false);
  const supabase = useSupabaseBrowserClient();
  const tripShapeRef = useRef(initialData.trips);

  useEffect(() => {
    setTrips(initialData.trips);
    tripShapeRef.current = initialData.trips;
  }, [initialData]);

  useEffect(() => {
    if (!initialData.trips.length) {
      return;
    }

    const tripIds = initialData.trips.map((trip) => trip.id);

    const channel = supabase
      .channel("live-arrivals-dashboard")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_arrivals"
        },
        (payload) => {
          const nextArrival = (payload.new ?? payload.old) as LiveArrivalRow | undefined;

          if (!nextArrival || !tripIds.includes(nextArrival.saved_trip_id)) {
            return;
          }

          void refreshTripArrivals(tripIds, supabase, setTrips, tripShapeRef.current);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [initialData.trips, supabase]);

  return {
    trips,
    isConnected
  };
}

async function refreshTripArrivals(
  tripIds: string[],
  supabase: ReturnType<typeof useSupabaseBrowserClient>,
  setTrips: React.Dispatch<React.SetStateAction<DashboardTrip[]>>,
  tripShape: DashboardTrip[]
) {
  const { data, error } = await supabase
    .from("live_arrivals")
    .select("*")
    .in("saved_trip_id", tripIds)
    .order("arrival_time", { ascending: true });

  if (error || !data) {
    return;
  }

  const typedArrivals = data as LiveArrivalRow[];

  setTrips(
    tripShape.map((trip) => ({
      ...trip,
      rightDirectionArrivals: typedArrivals.filter(
        (arrival) => arrival.saved_trip_id === trip.id && arrival.is_right_direction
      ),
      wrongDirectionArrivals: typedArrivals.filter(
        (arrival) => arrival.saved_trip_id === trip.id && !arrival.is_right_direction
      )
    }))
  );
}
