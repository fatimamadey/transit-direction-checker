export type CtaStationRow = {
  id: string;
  map_id: string;
  stop_name: string;
  lines: string[];
  directions: string[];
  display_order: number;
  is_active: boolean;
  created_at: string;
};

export type SavedTripRow = {
  id: string;
  clerk_user_id: string;
  label: string;
  route: string;
  preferred_direction: string;
  origin_station?: { id: string; stop_name: string } | null;
  destination_station?: { id: string; stop_name: string } | null;
};

export type LiveArrivalRow = {
  id: string;
  saved_trip_id: string;
  cta_prediction_id: string;
  route: string;
  destination_name: string | null;
  direction: string;
  arrival_time: string;
  minutes_away: number;
  is_right_direction: boolean;
  status_label: "RIGHT DIRECTION" | "WRONG DIRECTION";
  status_message: string;
  raw_payload: Record<string, unknown>;
  last_updated: string;
  created_at: string;
};

export type DashboardTrip = {
  id: string;
  label: string;
  route: string;
  preferredDirection: string;
  originStationName: string;
  destinationStationName: string;
  rightDirectionArrivals: LiveArrivalRow[];
  wrongDirectionArrivals: LiveArrivalRow[];
};

export type DashboardData = {
  stations: CtaStationRow[];
  trips: DashboardTrip[];
};
