import { supabase } from "./supabase";

export type Service = {
  id: string;
  title: string;
  category: "rest" | "shower" | "storage";
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

export async function fetchServices(): Promise<Service[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as Service[];
}

export function toPriceLabel(price: number) {
  return `EUR ${price}`;
}

export function toDistanceLabel(distanceMeters?: number | null) {
  if (!distanceMeters && distanceMeters !== 0) return "-";
  if (distanceMeters >= 1000) {
    return `${(distanceMeters / 1000).toFixed(1)}km`;
  }
  return `${distanceMeters}m`;
}

export function toTypeKey(category: Service["category"]) {
  if (category === "rest") return "category.rest";
  if (category === "shower") return "category.shower";
  return "category.storage";
}
