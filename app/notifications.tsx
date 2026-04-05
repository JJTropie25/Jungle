import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import TabTopNotch from "../components/TabTopNotch";
import { colors } from "../lib/theme";
import { useI18n } from "../lib/i18n";
import { useAuthState } from "../lib/auth";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationRow,
} from "../lib/notifications";
import { registerForPushNotifications } from "../lib/notifications";
import * as Notifications from "expo-notifications";

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { user } = useAuthState();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsPermission, setNeedsPermission] = useState(false);
  const [registering, setRegistering] = useState(false);

  const loadNotifications = async () => {
    if (!user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await fetchNotifications(user.id);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications().catch(() => setLoading(false));
  }, [user?.id]);

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
    <SafeAreaView style={styles.screen}>
      <TabTopNotch hideBell />
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <MaterialCommunityIcons
              name="chevron-left"
              size={24}
              color={colors.surface}
            />
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
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const unread = !item.read_at;
              return (
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
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {item.body ? (
                      <Text style={styles.cardBody}>{item.body}</Text>
                    ) : null}
                    <Text style={styles.cardTime}>
                      {new Date(item.created_at).toLocaleString()}
                    </Text>
                  </View>
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingTop: 60,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  markAll: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  markAllText: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 12,
  },
  permissionCard: {
    backgroundColor: "#F1FAFA",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  permissionTitle: {
    fontWeight: "700",
    color: colors.textPrimary,
  },
  permissionBody: {
    color: colors.textSecondary,
  },
  permissionButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.warmAccent,
  },
  permissionButtonText: {
    color: colors.background,
    fontWeight: "700",
  },
  listContent: {
    paddingBottom: 24,
  },
  rowInner: {
    gap: 6,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(226,242,242,0.35)",
    marginLeft: 16,
    marginRight: 16,
  },
  cardTitle: {
    fontWeight: "700",
    color: colors.textPrimary,
  },
  cardBody: {
    color: colors.textPrimary,
  },
  cardTime: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  emptyText: {
    color: colors.textPrimary,
    fontWeight: "600",
    marginTop: 20,
  },
  row: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.background,
  },
  rowUnread: {
    backgroundColor: "#FFB36B",
  },
  rowInner: {
    gap: 6,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(15,78,78,0.18)",
    marginLeft: 16,
    marginRight: 16,
  },
});
