import AsyncStorage from "@react-native-async-storage/async-storage";

const POLICY_ACCEPTED_KEY = "lagoon_policy_accepted_v1";

function keyForPolicy(userId?: string | null) {
  return `${POLICY_ACCEPTED_KEY}:${userId ?? "guest"}`;
}

export async function hasAcceptedPolicy(userId?: string | null): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(keyForPolicy(userId));
    return raw === "1";
  } catch {
    return false;
  }
}

export async function acceptPolicy(userId?: string | null): Promise<void> {
  try {
    await AsyncStorage.setItem(keyForPolicy(userId), "1");
  } catch {
    // best-effort persistence only
  }
}
