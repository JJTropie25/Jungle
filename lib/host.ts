import { supabase } from "./supabase";
import type { Service } from "./services";

export type HostAccount = {
  id: string;
  guest_id: string | null;
  display_name: string | null;
};

export type HostReservation = {
  id: string;
  guest_id: string;
  people_count: number;
  slot_start: string;
  slot_end: string;
  created_at: string | null;
  service_id: string;
  service_title: string;
  service_location: string;
  service_image_url: string | null;
};

export async function resolveHostForUser(
  userId?: string | null
): Promise<{ host: HostAccount | null; preview: boolean }> {
  if (!supabase) return { host: null, preview: false };

  if (!userId) return { host: null, preview: false };
  const { data: owned } = await supabase
    .from("hosts")
    .select("id, guest_id, display_name")
    .eq("guest_id", userId)
    .maybeSingle();
  return { host: (owned as HostAccount | null) ?? null, preview: false };
}

export async function fetchHostListings(hostId: string): Promise<Service[]> {
  if (!supabase || !hostId) return [];
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("host_id", hostId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as Service[];
}

export async function deleteHostListing(serviceId: string): Promise<string | null> {
  if (!supabase || !serviceId) return "Missing service id.";
  const { error } = await supabase.from("services").delete().eq("id", serviceId);
  return error?.message ?? null;
}

export async function fetchHostListingById(serviceId: string): Promise<Service | null> {
  if (!supabase || !serviceId) return null;
  const { data, error } = await supabase.from("services").select("*").eq("id", serviceId).maybeSingle();
  if (error || !data) return null;
  return data as Service;
}

export async function fetchServiceSlots(serviceId: string): Promise<string[]> {
  if (!supabase || !serviceId) return [];
  const { data, error } = await supabase
    .from("service_slots")
    .select("slot_start")
    .eq("service_id", serviceId)
    .order("slot_start", { ascending: true });
  if (error || !data) return [];

  const times = data
    .map((row) => {
      const d = new Date(row.slot_start);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    })
    .filter(Boolean);
  return Array.from(new Set(times));
}

type UpdateListingInput = {
  serviceId: string;
  title: string;
  description: string;
  category: "rest" | "shower" | "storage";
  price_eur: number;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string | null;
  slotTimes: string[];
};

type CreateListingInput = {
  hostId: string;
  title: string;
  description: string;
  category: "rest" | "shower" | "storage";
  price_eur: number;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string | null;
  slotTimes: string[];
};

function normalizeSlotTimes(times: string[]): string[] {
  return Array.from(
    new Set(
      times
        .map((time) => time.trim())
        .filter((time) => /^\d{2}:\d{2}$/.test(time))
    )
  ).sort();
}

export async function updateHostListing(input: UpdateListingInput): Promise<string | null> {
  if (!supabase) return "Supabase not configured.";
  const {
    serviceId,
    title,
    description,
    category,
    price_eur,
    location,
    latitude,
    longitude,
    image_url,
    slotTimes,
  } = input;
  if (!serviceId) return "Missing service id.";

  const { error: updateError } = await supabase
    .from("services")
    .update({
      title,
      description,
      category,
      price_eur,
      location,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      image_url: image_url ?? null,
    })
    .eq("id", serviceId);

  if (updateError) return updateError.message;

  const nextTimes = normalizeSlotTimes(slotTimes);
  const currentTimes = normalizeSlotTimes(await fetchServiceSlots(serviceId));
  const slotsChanged =
    nextTimes.length !== currentTimes.length ||
    nextTimes.some((time, index) => time !== currentTimes[index]);

  if (!slotsChanged) return null;

  const { error: deleteSlotsError } = await supabase
    .from("service_slots")
    .delete()
    .eq("service_id", serviceId);
  if (deleteSlotsError) return deleteSlotsError.message;

  if (nextTimes.length > 0) {
    const now = new Date();
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const rows = nextTimes.map((time) => {
      const [h, m] = time.split(":").map((v) => Number(v));
      const start = new Date(base);
      start.setHours(h, m, 0, 0);
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      return {
        service_id: serviceId,
        slot_start: start.toISOString(),
        slot_end: end.toISOString(),
      };
    });
    const { error: insertSlotsError } = await supabase.from("service_slots").insert(rows);
    if (insertSlotsError) return insertSlotsError.message;
  }

  return null;
}

export async function createHostListing(
  input: CreateListingInput
): Promise<{ error: string | null; serviceId: string | null }> {
  if (!supabase) return { error: "Supabase not configured.", serviceId: null };
  const {
    hostId,
    title,
    description,
    category,
    price_eur,
    location,
    latitude,
    longitude,
    image_url,
    slotTimes,
  } = input;
  if (!hostId) return { error: "Missing host id.", serviceId: null };

  const { data: created, error: insertServiceError } = await supabase
    .from("services")
    .insert({
      host_id: hostId,
      title,
      description,
      category,
      price_eur,
      location,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      image_url: image_url ?? null,
    })
    .select("id")
    .single();

  if (insertServiceError || !created?.id) {
    return { error: insertServiceError?.message ?? "Could not create service.", serviceId: null };
  }

  const serviceId = created.id as string;
  const nextTimes = normalizeSlotTimes(slotTimes);
  if (nextTimes.length === 0) return { error: null, serviceId };

  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const rows = nextTimes.map((time) => {
    const [h, m] = time.split(":").map((v) => Number(v));
    const start = new Date(base);
    start.setHours(h, m, 0, 0);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    return {
      service_id: serviceId,
      slot_start: start.toISOString(),
      slot_end: end.toISOString(),
    };
  });

  const { error: insertSlotsError } = await supabase.from("service_slots").insert(rows);
  if (!insertSlotsError) return { error: null, serviceId };

  await supabase.from("services").delete().eq("id", serviceId);
  return { error: insertSlotsError.message, serviceId: null };
}

export async function fetchHostReservations(
  hostId: string
): Promise<HostReservation[]> {
  if (!supabase || !hostId) return [];

  const listings = await fetchHostListings(hostId);
  const listingIds = listings.map((item) => item.id);
  if (listingIds.length === 0) return [];

  const byService = new Map(
    listings.map((item) => [
      item.id,
      { title: item.title, location: item.location, image_url: item.image_url ?? null },
    ])
  );

  const { data, error } = await supabase
    .from("bookings")
    .select("id, guest_id, people_count, slot_start, slot_end, created_at, service_id")
    .in("service_id", listingIds)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    const service = byService.get(row.service_id);
    return {
      id: row.id,
      guest_id: row.guest_id,
      people_count: row.people_count,
      slot_start: row.slot_start,
      slot_end: row.slot_end,
      created_at: row.created_at,
      service_id: row.service_id,
      service_title: service?.title ?? "-",
      service_location: service?.location ?? "-",
      service_image_url: service?.image_url ?? null,
    };
  });
}
