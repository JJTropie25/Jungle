import AsyncStorage from "@react-native-async-storage/async-storage";

const MAX_RECENT = 20;

function keyForViewer(viewerId?: string | null) {
  return `recently_viewed:${viewerId ?? "guest"}`;
}

export async function getRecentlyViewedIds(viewerId?: string | null): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(keyForViewer(viewerId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id) => typeof id === "string");
  } catch {
    return [];
  }
}

export async function addRecentlyViewedId(
  serviceId: string,
  viewerId?: string | null
): Promise<void> {
  if (!serviceId) return;
  try {
    const current = await getRecentlyViewedIds(viewerId);
    const next = [serviceId, ...current.filter((id) => id !== serviceId)].slice(0, MAX_RECENT);
    await AsyncStorage.setItem(keyForViewer(viewerId), JSON.stringify(next));
  } catch {
    // best-effort caching only
  }
}
