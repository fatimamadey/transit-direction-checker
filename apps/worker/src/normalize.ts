export type NormalizedArrival = {
  predictionId: string;
  mapId: string;
  route: string;
  direction: string;
  destinationName: string;
  arrivalTime: string;
  rawPayload: Record<string, unknown>;
};

type CtaPrediction = {
  prdt?: string;
  arrT?: string;
  rt?: string;
  prdtid?: string;
  destNm?: string;
  trDr?: string;
  mapid?: string;
};

export function normalizeCtaResponse(payload: Record<string, unknown>): NormalizedArrival[] {
  const arrivalsNode = payload?.["ctatt"] as { eta?: CtaPrediction[] } | undefined;
  const predictions = arrivalsNode?.eta ?? [];

  return predictions
    .filter((prediction) => prediction.prdtid && prediction.arrT && prediction.rt && prediction.trDr)
    .map((prediction) => ({
      predictionId: String(prediction.prdtid),
      mapId: String(prediction.mapid ?? ""),
      route: normalizeRouteName(String(prediction.rt)),
      direction: normalizeDirectionCode(String(prediction.trDr)),
      destinationName: String(prediction.destNm ?? "Unknown destination"),
      arrivalTime: String(prediction.arrT),
      rawPayload: prediction as Record<string, unknown>
    }));
}

export function normalizeDirectionCode(directionCode: string) {
  switch (directionCode) {
    case "1":
      return "Northbound";
    case "5":
      return "Southbound";
    default:
      return directionCode;
  }
}

function normalizeRouteName(routeCode: string) {
  const map: Record<string, string> = {
    Red: "Red",
    Blue: "Blue",
    Brn: "Brown",
    G: "Green",
    Org: "Orange",
    P: "Purple",
    Pink: "Pink",
    Y: "Yellow"
  };

  return map[routeCode] ?? routeCode;
}
