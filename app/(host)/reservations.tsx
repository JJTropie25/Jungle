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
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
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
                  <Text style={styles.cardTitle}>{item.service_title}</Text>
                  <Text style={styles.cardText}>{item.service_location}</Text>
                  <Text style={styles.cardText}>{toSlotLabel(item.slot_start, item.slot_end)}</Text>
                  <Text style={styles.cardText}>
                    {t("home.people")}: {item.people_count}
                  </Text>
                  <Text style={styles.cardMeta}>Guest ID: {item.guest_id}</Text>
                </View>
              </TouchableOpacity>
            )}
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
    color: colors.textPrimary,
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
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 110,
    backgroundColor: colors.surfaceSoft,
  },
  cardBody: {
    padding: 12,
    gap: 3,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 16,
  },
  cardText: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
  cardMeta: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 12,
  },
});
