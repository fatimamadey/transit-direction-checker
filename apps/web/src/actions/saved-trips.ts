"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

export async function createSavedTripAction(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("You must be signed in.");
  }

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
    clerk_user_id: userId,
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
  const { userId } = await auth();

  if (!userId) {
    throw new Error("You must be signed in.");
  }

  const supabase = getServiceRoleClient();

  const { error } = await supabase
    .from("saved_trips")
    .delete()
    .eq("id", savedTripId)
    .eq("clerk_user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}
