const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ?? "";

export type PlaceSuggestion = {
  label: string;
  latitude: number;
  longitude: number;
};

function normalizeMapboxLabel(parts: Array<string | undefined>) {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(", ");
}

async function mapboxSearch(query: string, limit: number): Promise<PlaceSuggestion[]> {
  if (!mapboxToken) return [];
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
    `?access_token=${encodeURIComponent(mapboxToken)}` +
    `&autocomplete=true&limit=${Math.max(1, Math.min(limit, 10))}` +
    "&types=address,place,locality,neighborhood,poi";
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const payload = (await res.json()) as {
    features?: Array<{
      place_name?: string;
      text?: string;
      center?: [number, number];
      context?: Array<{ text?: string }>;
    }>;
  };
  if (!Array.isArray(payload.features)) return [];
  return payload.features
    .map((feature) => {
      const lon = feature.center?.[0];
      const lat = feature.center?.[1];
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      const contextCity = feature.context?.[0]?.text;
      const label = feature.place_name?.trim() || normalizeMapboxLabel([feature.text, contextCity]);
      if (!label) return null;
      return { label, latitude: lat, longitude: lon } satisfies PlaceSuggestion;
    })
    .filter((item): item is PlaceSuggestion => Boolean(item));
}

async function nominatimSearch(query: string, limit: number): Promise<PlaceSuggestion[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=${Math.max(
    1,
    Math.min(limit, 10)
  )}&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const payload = (await res.json()) as Array<{
    display_name?: string;
    lat?: string;
    lon?: string;
  }>;
  if (!Array.isArray(payload)) return [];
  return payload
    .map((item) => {
      const latitude = Number(item.lat);
      const longitude = Number(item.lon);
      const label = item.display_name?.trim();
      if (!label || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      return { label, latitude, longitude } satisfies PlaceSuggestion;
    })
    .filter((item): item is PlaceSuggestion => Boolean(item));
}

export async function searchPlaceSuggestions(query: string, limit = 6): Promise<PlaceSuggestion[]> {
  const normalized = query.trim();
  if (normalized.length < 3) return [];
  try {
    const mapboxResults = await mapboxSearch(normalized, limit);
    if (mapboxResults.length > 0) return mapboxResults;
  } catch {
    // Fall through to Nominatim.
  }
  try {
    return await nominatimSearch(normalized, limit);
  } catch {
    return [];
  }
}

async function mapboxReverse(latitude: number, longitude: number): Promise<string | null> {
  if (!mapboxToken) return null;
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      String(longitude)
    )},${encodeURIComponent(String(latitude))}.json` +
    `?access_token=${encodeURIComponent(mapboxToken)}&limit=1`;
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const payload = (await res.json()) as { features?: Array<{ place_name?: string }> };
  return payload.features?.[0]?.place_name?.trim() || null;
}

async function nominatimReverse(latitude: number, longitude: number): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
    String(latitude)
  )}&lon=${encodeURIComponent(String(longitude))}`;
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const payload = (await res.json()) as { display_name?: string };
  return payload.display_name?.trim() || null;
}

export async function reverseGeocodeLabel(latitude: number, longitude: number): Promise<string> {
  try {
    const mapboxLabel = await mapboxReverse(latitude, longitude);
    if (mapboxLabel) return mapboxLabel;
  } catch {
    // Fall through to Nominatim.
  }
  try {
    const nominatimLabel = await nominatimReverse(latitude, longitude);
    if (nominatimLabel) return nominatimLabel;
  } catch {
    // Ignore and return coords.
  }
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}
