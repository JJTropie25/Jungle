import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { supabase } from "./supabase";

export type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: string | null;
  booking_id: string | null;
  data: any | null;
  read_at: string | null;
  created_at: string;
};

const notificationChannelId = "lagoon-default";

export async function configureNotificationsChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(notificationChannelId, {
    name: "Lagoon",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FF7A1A",
  });
}

export async function registerForPushNotifications(userId?: string) {
  if (!supabase || !userId) return;
  if (!Device.isDevice) return;

  await configureNotificationsChannel();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId;
  if (!projectId) return;

  let token: string | null = null;
  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    token = tokenResponse.data;
  } catch (error) {
    console.warn("push token error", error);
    return null;
  }

  await supabase.from("push_tokens").upsert(
    {
      user_id: userId,
      token,
      platform: Platform.OS,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "token" }
  );

  return token;
}

export async function fetchNotifications(userId?: string) {
  if (!supabase || !userId) return [];
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as NotificationRow[];
}

export async function getUnreadCount(userId?: string) {
  if (!supabase || !userId) return 0;
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  return count ?? 0;
}

export async function markNotificationRead(id: string) {
  if (!supabase) return;
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
}

export async function markAllNotificationsRead(userId?: string) {
  if (!supabase || !userId) return;
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
}
