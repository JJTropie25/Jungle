import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../lib/theme-context";
import { type ThemeColors } from "../lib/theme";
import { useI18n } from "../lib/i18n";
import { useAuthState } from "../lib/auth";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationRow,
  registerForPushNotifications,
} from "../lib/notifications";
import * as Notifications from "expo-notifications";

function humanizeEtaMinutes(totalMinutes: number): string {
  const minutes = Math.max(0, Math.floor(totalMinutes));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days === 1 ? "" : "s"}`);
  if (hours > 0) parts.push(`${hours} h`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins} min`);
  return parts.join(" ");
}

function normalizeNotificationBody(body: string | null, data: any | null): string | null {
  if (!body) return body;
  const etaRaw = Number(data?.eta_minutes);
  if (Number.isFinite(etaRaw)) {
    return `New guest arrives in ${humanizeEtaMinutes(etaRaw)}`;
  }
  const match = body.match(/New guest arrives in\s+(\d+)\s+min/i);
  if (!match) return body;
  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed)) return body;
  return `New guest arrives in ${humanizeEtaMinutes(parsed)}`;
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.screenBackground },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 12,
      gap: 10,
      backgroundColor: "#4F9B9B",
    },
    backButton: { padding: 4 },
    title: {
      flex: 1,
      fontSize: 20,
      fontWeight: "600",
      color: "#fff",
    },
    markAll: { paddingHorizontal: 8, paddingVertical: 6 },
    markAllText: {
      color: "rgba(255,255,255,0.65)",
      fontWeight: "600",
      fontSize: 12,
    },
    scrollContent: { padding: 16, paddingBottom: 32 },
    notifBox: {
      backgroundColor: c.cardBackground,
      borderRadius: 12,
      overflow: "hidden",
    },
    row: { paddingHorizontal: 16, paddingVertical: 14 },
    rowUnread: { backgroundColor: "rgba(255,179,107,0.14)" },
    rowInner: { gap: 4 },
    unreadDot: {
      position: "absolute",
      right: 0,
      top: 2,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.warmAccent,
    },
    separator: {
      height: 1,
      backgroundColor: c.divider,
      marginHorizontal: 16,
    },
    cardTitle: {
      fontWeight: "600",
      color: c.textPrimary,
      paddingRight: 16,
    },
    cardBody: {
      color: c.textPrimary,
      fontSize: 13,
    },
    cardTime: {
      color: c.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    emptyText: {
      color: "rgba(255,255,255,0.6)",
      fontWeight: "600",
      marginTop: 20,
      textAlign: "center",
    },
    permissionCard: {
      backgroundColor: "rgba(255,255,255,0.08)",
      borderRadius: 12,
      padding: 12,
      gap: 8,
      marginBottom: 16,
    },
    permissionTitle: { fontWeight: "600", color: "#fff" },
    permissionBody: { color: "rgba(255,255,255,0.65)" },
    permissionButton: {
      alignSelf: "flex-start",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: c.warmAccent,
    },
    permissionButtonText: {
      color: c.background,
      fontWeight: "600",
    },
    disabled: { opacity: 0.5 },
  });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { user } = useAuthState();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsPermission, setNeedsPermission] = useState(false);
  const [registering, setRegistering] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await fetchNotifications(user.id);
    setItems(data);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadNotifications().catch(() => setLoading(false));
  }, [loadNotifications]);

  useEffect(() => {
    if (Platform.OS === "web") {
      setNeedsPermission(false);
      return;
    }
    Notifications.getPermissionsAsync()
      .then(({ status }) => {
        setNeedsPermission(status !== "granted");
      })
      .catch(() => null);
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={["bottom"]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.title}>{t("notifications.title")}</Text>
        <Pressable
          style={styles.markAll}
          onPress={async () => {
            await markAllNotificationsRead(user?.id);
            loadNotifications().catch(() => null);
          }}
        >
          <Text style={styles.markAllText}>{t("notifications.markAll")}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {needsPermission ? (
          <View style={styles.permissionCard}>
            <Text style={styles.permissionTitle}>{t("notifications.permissionTitle")}</Text>
            <Text style={styles.permissionBody}>{t("notifications.permissionBody")}</Text>
            <Pressable
              style={[styles.permissionButton, registering && styles.disabled]}
              onPress={async () => {
                if (!user?.id) return;
                setRegistering(true);
                const { status } = await Notifications.requestPermissionsAsync();
                setNeedsPermission(status !== "granted");
                if (status === "granted") {
                  await registerForPushNotifications(user.id);
                }
                setRegistering(false);
              }}
              disabled={registering}
            >
              <Text style={styles.permissionButtonText}>
                {registering ? t("auth.loading") : t("notifications.permissionAction")}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {loading ? (
          <Text style={styles.emptyText}>{t("notifications.loading")}</Text>
        ) : items.length === 0 ? (
          <Text style={styles.emptyText}>{t("notifications.empty")}</Text>
        ) : (
          <View style={styles.notifBox}>
            {items.map((item, index) => {
              const unread = !item.read_at;
              const body = normalizeNotificationBody(item.body, item.data);
              return (
                <View key={item.id}>
                  {index > 0 && <View style={styles.separator} />}
                  <Pressable
                    style={[styles.row, unread && styles.rowUnread]}
                    onPress={async () => {
                      if (unread) {
                        await markNotificationRead(item.id);
                        loadNotifications().catch(() => null);
                      }
                    }}
                  >
                    <View style={styles.rowInner}>
                      {unread && <View style={styles.unreadDot} />}
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      {body ? <Text style={styles.cardBody}>{body}</Text> : null}
                      <Text style={styles.cardTime}>
                        {new Date(item.created_at).toLocaleString()}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}