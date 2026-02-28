import { supabase } from "./supabase";
import type { Service } from "./services";

export async function fetchFavoriteIds(guestId: string): Promise<Set<string>> {
  if (!supabase) return new Set();
  const { data, error } = await supabase
    .from("favorites")
    .select("service_id")
    .eq("guest_id", guestId);
  if (error || !data) return new Set();
  return new Set(data.map((row) => row.service_id));
}

export async function addFavorite(guestId: string, serviceId: string) {
  if (!supabase) return { error: new Error("Supabase not configured") };
  return supabase.from("favorites").insert({
    guest_id: guestId,
    service_id: serviceId,
  });
}

export async function removeFavorite(guestId: string, serviceId: string) {
  if (!supabase) return { error: new Error("Supabase not configured") };
  return supabase
    .from("favorites")
    .delete()
    .eq("guest_id", guestId)
    .eq("service_id", serviceId);
}

export async function fetchFavoriteServices(guestId: string): Promise<Service[]> {
  if (!supabase) return [];

  const { data: favoriteRows, error: favoriteError } = await supabase
    .from("favorites")
    .select("service_id")
    .eq("guest_id", guestId);

  if (favoriteError || !favoriteRows || favoriteRows.length === 0) return [];

  const ids = favoriteRows.map((row) => row.service_id).filter(Boolean);
  if (ids.length === 0) return [];

  const { data: services, error: serviceError } = await supabase
    .from("services")
    .select("id, title, category, price_eur, location, distance_meters, rating, image_url")
    .in("id", ids);

  if (serviceError || !services) return [];

  const order = new Map(ids.map((id, index) => [id, index]));
  return [...(services as Service[])].sort(
    (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
  );
}
