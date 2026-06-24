import { supabase } from "./supabase";

export type POI = {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
};

export async function fetchPOIs(): Promise<POI[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("points_of_interest")
    .select("id, name, city, latitude, longitude");
  return (data as POI[]) ?? [];
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type NearestPOIResult = POI & { distanceMeters: number };

export function nearestPOI(
  serviceLat: number,
  serviceLon: number,
  pois: POI[],
  maxMeters = 15000
): NearestPOIResult | null {
  let nearest: POI | null = null;
  let minDist = Infinity;
  for (const poi of pois) {
    const d = haversine(serviceLat, serviceLon, poi.latitude, poi.longitude);
    if (d < minDist && d <= maxMeters) {
      minDist = d;
      nearest = poi;
    }
  }
  return nearest ? { ...nearest, distanceMeters: minDist } : null;
}