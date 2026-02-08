import { supabase } from "./supabase";

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
