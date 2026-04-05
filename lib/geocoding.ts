const googleMapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
const googleGeocodingKey =
  process.env.EXPO_PUBLIC_GOOGLE_GEOCODING_API_KEY?.trim() ?? googleMapsKey;
const googlePlacesKey =
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY?.trim() ?? googleGeocodingKey;

export type PlaceSuggestion = {
  label: string;
  latitude: number;
  longitude: number;
};

async function googleGeocodeSearch(query: string, limit: number): Promise<PlaceSuggestion[]> {
  if (!googleGeocodingKey) return [];
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}` +
    `&key=${encodeURIComponent(googleGeocodingKey)}`;
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const payload = (await res.json()) as {
    results?: Array<{
      formatted_address?: string;
      geometry?: { location?: { lat?: number; lng?: number } };
    }>;
    status?: string;
  };
  if (payload.status && payload.status !== "OK") return [];
  if (!Array.isArray(payload.results)) return [];
  return payload.results
    .slice(0, Math.max(1, Math.min(limit, 10)))
    .map((result) => {
      const latitude = result.geometry?.location?.lat;
      const longitude = result.geometry?.location?.lng;
      const label = result.formatted_address?.trim();
      if (!label || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      return { label, latitude, longitude } satisfies PlaceSuggestion;
    })
    .filter((item): item is PlaceSuggestion => Boolean(item));
}

async function googlePlacesAutocomplete(
  query: string,
  limit: number
): Promise<PlaceSuggestion[]> {
  if (!googlePlacesKey) return [];
  const url =
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      query
    )}` +
    `&types=geocode&key=${encodeURIComponent(googlePlacesKey)}`;
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const payload = (await res.json()) as {
    status?: string;
    predictions?: Array<{ description?: string; place_id?: string }>;
  };
  if (payload.status !== "OK" || !Array.isArray(payload.predictions)) return [];

  const sliced = payload.predictions.slice(0, Math.max(1, Math.min(limit, 10)));
  const details = await Promise.all(
    sliced.map(async (prediction) => {
      if (!prediction.place_id) return null;
      const detailsUrl =
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
          prediction.place_id
        )}` +
        `&fields=formatted_address,geometry&key=${encodeURIComponent(googlePlacesKey)}`;
      const detailsRes = await fetch(detailsUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!detailsRes.ok) return null;
      const detailsPayload = (await detailsRes.json()) as {
        status?: string;
        result?: {
          formatted_address?: string;
          geometry?: { location?: { lat?: number; lng?: number } };
        };
      };
      if (detailsPayload.status !== "OK") return null;
      const label =
        detailsPayload.result?.formatted_address?.trim() ??
        prediction.description?.trim();
      const latitude = detailsPayload.result?.geometry?.location?.lat;
      const longitude = detailsPayload.result?.geometry?.location?.lng;
      if (!label || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      return { label, latitude, longitude } satisfies PlaceSuggestion;
    })
  );

  return details.filter((item): item is PlaceSuggestion => Boolean(item));
}

export async function searchPlaceSuggestions(query: string, limit = 6): Promise<PlaceSuggestion[]> {
  const normalized = query.trim();
  if (normalized.length < 1) return [];
  try {
    const results = await googlePlacesAutocomplete(normalized, limit);
    if (results.length > 0) return results;
  } catch {
    // ignore
  }
  try {
    const results = await googleGeocodeSearch(normalized, limit);
    if (results.length > 0) return results;
  } catch {
    // ignore
  }
  return [];
}

async function googleReverse(latitude: number, longitude: number): Promise<string | null> {
  if (!googleGeocodingKey) return null;
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(
      String(latitude)
    )},${encodeURIComponent(String(longitude))}` +
    `&key=${encodeURIComponent(googleGeocodingKey)}`;
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const payload = (await res.json()) as {
    results?: Array<{ formatted_address?: string }>;
  };
  return payload.results?.[0]?.formatted_address?.trim() || null;
}

export async function reverseGeocodeLabel(latitude: number, longitude: number): Promise<string> {
  try {
    const label = await googleReverse(latitude, longitude);
    if (label) return label;
  } catch {
    // ignore
  }
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}
