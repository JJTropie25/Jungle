import { supabase } from "./supabase";

export type Service = {
  id: string;
  title: string;
  category: "rest" | "shower" | "storage";
  description?: string | null;
  price_eur: number;
  image_url?: string | null;
  location: string;
  city?: string | null;
  region?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number | null;
  distance_meters?: number | null;
  section?: string | null;
};

type FetchServicesOptions = {
  limit?: number;
};

export async function fetchServices(
  options?: FetchServicesOptions
): Promise<Service[]> {
  if (!supabase) return [];
  let query = supabase
    .from("services")
    .select("*")
    .order("created_at", { ascending: false });
  if (options?.limit && options.limit > 0) {
    query = query.limit(options.limit);
  }
  const { data, error } = await query;
  if (error || !data) return [];
  return data as Service[];
}

export function toPriceLabel(price: number) {
  return `€${price}`;
}

export function toDistanceLabel(distanceMeters?: number | null) {
  if (!distanceMeters && distanceMeters !== 0) return "-";
  if (distanceMeters >= 1000) {
    const km = Math.floor(distanceMeters / 1000);
    return `${km}km`;
  }
  const meters = Math.floor(distanceMeters);
  return `${meters}m`;
}

export function toTypeKey(category: Service["category"]) {
  if (category === "rest") return "category.rest";
  if (category === "shower") return "category.shower";
  return "category.storage";
}

export function toCategoryIcon(category: Service["category"]) {
  if (category === "rest") return "bed-king";
  if (category === "shower") return "shower";
  return "locker";
}
