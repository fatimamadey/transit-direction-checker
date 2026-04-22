export type CtaStationSeed = {
  mapId: string;
  stopName: string;
  lines: string[];
  directions: string[];
  displayOrder: number;
};

export type SavedTripRecord = {
  id: string;
  clerk_user_id: string;
  label: string;
  origin_station_id: string;
  destination_station_id: string;
  route: string;
  preferred_direction: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
