import type { CtaStationSeed } from "./types";

export const ctaStationSeeds: CtaStationSeed[] = [
  {
    mapId: "41320",
    stopName: "Belmont",
    lines: ["Red", "Brown"],
    directions: ["Northbound", "Southbound"],
    displayOrder: 1
  },
  {
    mapId: "41200",
    stopName: "Argyle",
    lines: ["Red"],
    directions: ["Northbound", "Southbound"],
    displayOrder: 2
  },
  {
    mapId: "41220",
    stopName: "Fullerton",
    lines: ["Red", "Brown"],
    directions: ["Northbound", "Southbound"],
    displayOrder: 3
  },
  {
    mapId: "40380",
    stopName: "Clark/Lake",
    lines: ["Blue", "Brown"],
    directions: ["Northbound", "Southbound", "Eastbound", "Westbound"],
    displayOrder: 4
  },
  {
    mapId: "40320",
    stopName: "UIC-Halsted",
    lines: ["Blue"],
    directions: ["Eastbound", "Westbound"],
    displayOrder: 5
  }
];
