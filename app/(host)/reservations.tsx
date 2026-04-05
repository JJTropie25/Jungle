import { useCallback, useMemo, useState } from "react";
import { FlatList, Image, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import TabTopNotch from "../../components/TabTopNotch";
import { useI18n } from "../../lib/i18n";
import { useAuthState } from "../../lib/auth";
import { colors } from "../../lib/theme";
import { fetchHostReservations, resolveHostForUser, type HostReservation } from "../../lib/host";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { toCategoryIcon } from "../../lib/services";

function toSlotLabel(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const date = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(
    start.getDate()
  ).padStart(2, "0")}`;
  const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${date} ${hhmm(start)}-${hhmm(end)}`;
}

export default function HostReservations() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { user } = useAuthState();
  const placeholderImage = require("../../assets/images/react-logo.png");

  const [items, setItems] = useState<HostReservation[]>([]);
  const [hostLabel, setHostLabel] = useState<string | null>(null);
  const [hasHost, setHasHost] = useState(true);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { host } = await resolveHostForUser(user?.id);
    setHasHost(Boolean(host));
    if (!host) {
      setHostLabel(null);
      setItems([]);
      setLoading(false);
      return;
    }
    setHostLabel(host.display_name ?? null);
    const data = await fetchHostReservations(host.id);
    setItems(data);
    setLoading(false);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const emptyText = useMemo(() => {
    if (loading) return t("host.loading");
    if (!hasHost) return t("host.notAvailable");
    return t("host.reservations.empty");
  }, [hasHost, loading, t]);

  return (
    <SafeAreaView style={styles.screen}>
      <TabTopNotch />
      <View style={[styles.container, { paddingTop: insets.top + 58 }]}>
        <Text style={styles.title}>{t("host.reservations.title")}</Text>
        {hostLabel ? <Text style={styles.hostSubtitle}>{hostLabel}</Text> : null}
        {items.length === 0 ? (
          <Text style={styles.emptyText}>{emptyText}</Text>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isExpired = new Date(item.slot_end).getTime() < Date.now();
              const isCheckedIn = Boolean(item.checked_in_at);
              const statusLabel = isExpired
                ? t("booking.expired")
                : isCheckedIn
                ? t("host.reservation.checkedIn")
                : t("host.reservation.reserved");
              return (
              <TouchableOpacity
                style={[styles.card, isExpired && styles.cardExpired]}
                onPress={() =>
                  router.push({
                    pathname: "/(host)/reservation/[bookingId]",
                    params: { bookingId: item.id },
                  })
                }
              >
                <Image
                  source={item.service_image_url ? { uri: item.service_image_url } : placeholderImage}
                  style={styles.cardImage}
                />
                <View style={styles.cardBody}>
                  <Text style={[styles.cardTitle, isExpired && styles.textExpired]}>{item.service_title}</Text>
                  <View style={styles.badgeRow}>
                    <Text style={styles.guestBadge}>{item.guest_username ?? "Guest"}</Text>
                    <Text
                      style={[
                        styles.statusBadge,
                        isExpired
                          ? styles.statusExpired
                          : isCheckedIn
                          ? styles.statusCheckedIn
                          : styles.statusReserved,
                      ]}
                    >
                      {statusLabel}
                    </Text>
                  </View>
                  <View style={styles.summaryStack}>
                    {item.service_category ? (
                      <MaterialCommunityIcons
                        name={toCategoryIcon(item.service_category) as any}
                        size={16}
                        color={isExpired ? "#718080" : colors.textPrimary}
                      />
                    ) : null}
                    <Text style={[styles.summaryItem, isExpired && styles.textExpired]}>
                      {toSlotLabel(item.slot_start, item.slot_end)}
                    </Text>
                    <Text style={[styles.summaryItem, isExpired && styles.textExpired]}>
                      {item.service_location}
                    </Text>
                    <View style={styles.summaryPeople}>
                      <MaterialCommunityIcons
                        name="account-group"
                        size={16}
                        color={isExpired ? "#718080" : colors.textPrimary}
                      />
                      <Text style={[styles.summaryPeopleText, isExpired && styles.textExpired]}>
                        {item.people_count}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBackground },
  container: { flex: 1, paddingHorizontal: 16 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.surface,
  },
  hostSubtitle: {
    marginTop: 4,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  emptyText: {
    marginTop: 36,
    textAlign: "center",
    color: colors.textSecondary,
    fontWeight: "600",
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 24,
    gap: 10,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  cardExpired: {
    backgroundColor: "#EAF0F0",
    borderColor: "#B9C9C9",
  },
  cardImage: {
    width: "100%",
    height: 110,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: colors.surfaceSoft,
  },
  cardBody: {
    gap: 6,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 16,
  },
  textExpired: {
    color: "#6C7C7C",
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  guestBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceSoft,
    color: colors.textPrimary,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadge: {
    alignSelf: "flex-start",
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    color: "#1C1C1C",
  },
  statusReserved: {
    backgroundColor: "#F5E7A6",
  },
  statusCheckedIn: {
    backgroundColor: "#BFE9D2",
    color: "#1F6E44",
  },
  statusExpired: {
    backgroundColor: "#D5E0E0",
    color: "#687878",
  },
  summaryStack: {
    gap: 6,
  },
  summaryItem: {
    fontWeight: "600",
    color: colors.textSecondary,
  },
  summaryPeople: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summaryPeopleText: {
    fontWeight: "600",
    color: colors.textSecondary,
  },
});
