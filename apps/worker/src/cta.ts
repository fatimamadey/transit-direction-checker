import type { NormalizedArrival } from "./normalize";
import { normalizeCtaResponse } from "./normalize";
import { config } from "./config";

export async function fetchPredictionsForMapId(mapId: string): Promise<NormalizedArrival[]> {
  const url = new URL("https://lapi.transitchicago.com/api/1.0/ttarrivals.aspx");
  url.searchParams.set("key", config.ctaApiKey);
  url.searchParams.set("mapid", mapId);
  url.searchParams.set("outputType", "JSON");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`CTA request failed with ${response.status}`);
  }

  const json = (await response.json()) as Record<string, unknown>;
  return normalizeCtaResponse(json);
}
