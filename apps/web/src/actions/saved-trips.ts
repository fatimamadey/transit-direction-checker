"use server";

import { revalidatePath } from "next/cache";
import { DEMO_USER_ID } from "@/lib/demo-user";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

export async function createSavedTripAction(formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  const originStationId = String(formData.get("origin_station_id") ?? "").trim();
  const destinationStationId = String(formData.get("destination_station_id") ?? "").trim();
  const route = String(formData.get("route") ?? "").trim();
  const preferredDirection = String(formData.get("preferred_direction") ?? "").trim();

  if (!label || !originStationId || !destinationStationId || !route || !preferredDirection) {
    throw new Error("Please fill out every field.");
  }

  const supabase = getServiceRoleClient();

  const { error } = await supabase.from("saved_trips").insert({
    clerk_user_id: DEMO_USER_ID,
    label,
    origin_station_id: originStationId,
    destination_station_id: destinationStationId,
    route,
    preferred_direction: preferredDirection
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function deleteSavedTripAction(savedTripId: string) {
  const supabase = getServiceRoleClient();

  const { error } = await supabase
    .from("saved_trips")
    .delete()
    .eq("id", savedTripId)
    .eq("clerk_user_id", DEMO_USER_ID);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function seedDemoTripsAction() {
  const supabase = getServiceRoleClient();

  const { data: stations, error: stationsError } = await supabase
    .from("cta_stations")
    .select("id, map_id")
    .in("map_id", ["41320", "41200", "40380", "40320"]);

  if (stationsError || !stations) {
    throw new Error(stationsError?.message ?? "Could not load CTA stations.");
  }

  const stationMap = new Map(stations.map((station) => [station.map_id, station.id]));

  const demoTrips = [
    {
      clerk_user_id: DEMO_USER_ID,
      label: "Belmont to Argyle",
      origin_station_id: stationMap.get("41320"),
      destination_station_id: stationMap.get("41200"),
      route: "Red",
      preferred_direction: "Northbound"
    },
    {
      clerk_user_id: DEMO_USER_ID,
      label: "UIC-Halsted to Clark/Lake",
      origin_station_id: stationMap.get("40320"),
      destination_station_id: stationMap.get("40380"),
      route: "Blue",
      preferred_direction: "Eastbound"
    }
  ].filter((trip) => trip.origin_station_id && trip.destination_station_id);

  const { error } = await supabase.from("saved_trips").upsert(demoTrips, {
    onConflict: "clerk_user_id,label"
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}
