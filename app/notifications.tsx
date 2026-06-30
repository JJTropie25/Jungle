import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

// ── type metadata ─────────────────────────────────────────────
type TypeMeta = { icon: string; color: string };

const TYPE_META: Record<string, TypeMeta> = {
  host_new_booking: { icon: "account-plus-outline",  color: "#4F9B9B" },
  guest_start_soon: { icon: "clock-start",           color: "#1A4F8A" },
  guest_end_soon:   { icon: "clock-end",             color: "#C8930A" },
  booking_confirm:  { icon: "check-circle-outline",  color: "#2E7D32" },
  booking_cancel:   { icon: "close-circle-outline",  color: "#C62828" },
};
const DEFAULT_META: TypeMeta = { icon: "bell-outline", color: "#888" };

function typeMeta(type: string | null | undefined): TypeMeta {
  return (type && TYPE_META[type]) || DEFAULT_META;
}

// ── time formatting ───────────────────────────────────────────
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60000);
  if (min < 1)   return "just now";
  if (min < 60)  return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24)    return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)     return `${d} day${d === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

// ── styles ────────────────────────────────────────────────────
function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    screen:    { flex: 1, backgroundColor: c.screenBackground },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 12,
      gap: 10,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: "700",
      fontFamily: "Baloo2_700Bold",
      color: c.textPrimary,
    },
    markAllBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: c.surfaceSoft,
    },
    markAllText: {
      fontSize: 12,
      fontWeight: "600",
      color: c.textSecondary,
    },

    // permission banner
    permBanner: {
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 12,
      backgroundColor: c.warmSurface,
      padding: 14,
      gap: 8,
    },
    permTitle:  { fontWeight: "700", color: c.warmAccentDark, fontSize: 14 },
    permBody:   { fontSize: 13, color: c.textSecondary, lineHeight: 18 },
    permBtn: {
      alignSelf: "flex-start",
      backgroundColor: c.warmAccent,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
    },
    permBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

    // list
    list: { marginHorizontal: 16, borderRadius: 14, overflow: "hidden" },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingHorizontal: 14,
      paddingVertical: 14,
      gap: 12,
      backgroundColor: c.cardBackground,
    },
    rowUnread: { backgroundColor: c.warmSurface },
    iconWrap: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 1,
    },
    rowContent:  { flex: 1, gap: 2 },
    rowTitle:    { fontSize: 14, fontWeight: "700", color: c.textPrimary, lineHeight: 19 },
    rowBody:     { fontSize: 13, color: c.textSecondary, lineHeight: 18 },
    rowTime:     { fontSize: 11, color: c.textMuted, marginTop: 2 },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.warmAccent,
      marginTop: 6,
      flexShrink: 0,
    },
    separator: { height: 1, backgroundColor: c.divider },

    // empty / loading
    emptyWrap: { alignItems: "center", paddingTop: 60, gap: 12 },
    emptyIcon: { opacity: 0.25 },
    emptyText: { fontSize: 15, color: c.textSecondary, fontWeight: "600" },
    emptySubtext: { fontSize: 13, color: c.textMuted, textAlign: "center", paddingHorizontal: 32 },
  });
}

// ── component ─────────────────────────────────────────────────
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

  const load = useCallback(async () => {
    if (!user?.id) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const data = await fetchNotifications(user.id);
    setItems(data);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load().catch(() => setLoading(false)); }, [load]);

  useEffect(() => {
    if (Platform.OS === "web") { setNeedsPermission(false); return; }
    Notifications.getPermissionsAsync()
      .then(({ status }) => setNeedsPermission(status !== "granted"))
      .catch(() => null);
  }, []);

  const unreadCount = items.filter(i => !i.read_at).length;

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t("notifications.title")}</Text>
        {unreadCount > 0 && (
          <Pressable style={styles.markAllBtn} onPress={async () => {
            await markAllNotificationsRead(user?.id);
            load().catch(() => null);
          }}>
            <Text style={styles.markAllText}>{t("notifications.markAll")}</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission banner */}
        {needsPermission && (
          <View style={styles.permBanner}>
            <Text style={styles.permTitle}>{t("notifications.permissionTitle")}</Text>
            <Text style={styles.permBody}>{t("notifications.permissionBody")}</Text>
            <Pressable
              style={[styles.permBtn, registering && { opacity: 0.5 }]}
              disabled={registering}
              onPress={async () => {
                if (!user?.id) return;
                setRegistering(true);
                const { status } = await Notifications.requestPermissionsAsync();
                setNeedsPermission(status !== "granted");
                if (status === "granted") await registerForPushNotifications(user.id);
                setRegistering(false);
              }}
            >
              <Text style={styles.permBtnText}>
                {registering ? t("auth.loading") : t("notifications.permissionAction")}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Content */}
        {loading ? (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="bell-outline" size={48} color={colors.textMuted} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>{t("notifications.loading")}</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="bell-sleep-outline" size={52} color={colors.textMuted} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>{t("notifications.empty")}</Text>
            <Text style={styles.emptySubtext}>{"You'll see booking reminders and updates here."}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((item, index) => {
              const unread = !item.read_at;
              const meta = typeMeta(item.type);
              return (
                <View key={item.id}>
                  {index > 0 && <View style={styles.separator} />}
                  <Pressable
                    style={[styles.row, unread && styles.rowUnread]}
                    onPress={async () => {
                      if (unread) {
                        await markNotificationRead(item.id);
                        load().catch(() => null);
                      }
                    }}
                  >
                    {/* type icon */}
                    <View style={[styles.iconWrap, { backgroundColor: meta.color + "18" }]}>
                      <MaterialCommunityIcons
                        name={meta.icon as any}
                        size={20}
                        color={meta.color}
                      />
                    </View>

                    {/* text */}
                    <View style={styles.rowContent}>
                      <Text style={styles.rowTitle}>{item.title}</Text>
                      {item.body ? <Text style={styles.rowBody}>{item.body}</Text> : null}
                      <Text style={styles.rowTime}>{relativeTime(item.created_at)}</Text>
                    </View>

                    {/* unread dot */}
                    {unread && <View style={styles.unreadDot} />}
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
