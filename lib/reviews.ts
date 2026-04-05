import { supabase } from "./supabase";

export type ServiceReview = {
  id: string;
  rating_10: number;
  description: string;
  created_at: string;
  author_name: string;
};

export async function fetchServiceReviews(serviceId?: string | null): Promise<ServiceReview[]> {
  if (!supabase || !serviceId) return [];

  const { data, error } = await supabase
    .from("service_reviews")
    .select("id, guest_id, rating_10, description, created_at")
    .eq("service_id", serviceId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const guestIds = Array.from(
    new Set(
      data
        .map((row: any) => row.guest_id as string | null)
        .filter((id): id is string => Boolean(id))
    )
  );
  const namesById = new Map<string, string>();
  if (guestIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", guestIds);
    (profiles ?? []).forEach((p: any) => {
      namesById.set(p.id, p.username ?? "Guest");
    });
  }

  return data.map((row: any) => ({
    id: row.id,
    rating_10: Number(row.rating_10 ?? 0),
    description: row.description ?? "",
    created_at: row.created_at ?? new Date().toISOString(),
    author_name: namesById.get(row.guest_id) ?? "Guest",
  }));
}

export async function hasReviewForBooking(bookingId?: string | null): Promise<boolean> {
  if (!supabase || !bookingId) return false;
  const { data, error } = await supabase
    .from("service_reviews")
    .select("id")
    .eq("booking_id", bookingId)
    .limit(1)
    .maybeSingle();

  if (error) return false;
  return Boolean(data?.id);
}

export async function submitServiceReview(input: {
  bookingId: string;
  serviceId: string;
  guestId: string;
  rating10: number;
  description: string;
}): Promise<string | null> {
  if (!supabase) return "Supabase non configurato.";
  const { bookingId, serviceId, guestId, rating10, description } = input;

  const { error } = await supabase.from("service_reviews").insert({
    booking_id: bookingId,
    service_id: serviceId,
    guest_id: guestId,
    rating_10: rating10,
    description,
  });
  if (error) return error.message;

  const { data: agg, error: aggError } = await supabase
    .from("service_reviews")
    .select("rating_10")
    .eq("service_id", serviceId);
  if (aggError || !agg || agg.length === 0) return null;

  const avgRating10 = agg.reduce((sum, row: any) => sum + Number(row.rating_10 ?? 0), 0) / agg.length;
  const rating5 = Number((avgRating10 / 2).toFixed(1));
  const { error: updateError } = await supabase.from("services").update({ rating: rating5 }).eq("id", serviceId);
  if (updateError) return updateError.message;

  return null;
}
