import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useI18n } from "../../lib/i18n";
import { useEffect, useMemo, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";
import { useAuthState } from "../../lib/auth";
import { colors } from "../../lib/theme";
import TabTopNotch from "../../components/TabTopNotch";

export default function Bookings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { user } = useAuthState();
  const isFocused = useIsFocused();
  const placeholderImage = require("../../assets/images/react-logo.png");
  const [bookings, setBookings] = useState<
    {
      id: string;
      title: string;
      destination: string;
      timeslot: string;
      people: string;
      latitude?: number | null;
      longitude?: number | null;
      imageUrl?: string | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const loadBookings = () => {
    if (!supabase || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("bookings")
      .select(
        "id, slot_start, slot_end, people_count, service:services(id, title, location, latitude, longitude, image_url)"
      )
      .eq("guest_id", user.id)
      .order("slot_start", { ascending: false })
      .then(({ data }) => {
        const mapped =
          data?.map((row: any) => {
            const start = new Date(row.slot_start);
            const timeslot = `${start.getFullYear()}-${String(
              start.getMonth() + 1
            ).padStart(2, "0")}-${String(start.getDate()).padStart(
              2,
              "0"
            )} ${String(start.getHours()).padStart(2, "0")}:${String(
              start.getMinutes()
            ).padStart(2, "0")}`;
            return {
              id: row.id,
              title: row.service?.title ?? "-",
              destination: row.service?.location ?? "-",
              timeslot,
              people: String(row.people_count ?? 1),
              latitude: row.service?.latitude,
              longitude: row.service?.longitude,
              imageUrl: row.service?.image_url ?? null,
            };
          }) ?? [];
        setBookings(mapped);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isFocused) {
      loadBookings();
    }
  }, [user, isFocused]);

  const emptyState = useMemo(() => {
    if (!user) return t("bookings.signIn");
    if (loading) return t("bookings.loading");
    return t("bookings.empty");
  }, [loading, t, user]);

  return (
    <SafeAreaView style={styles.screen}>
      <TabTopNotch />
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 58 },
        ]}
      >
        <Text style={styles.title}>{t("bookings.title")}</Text>

        {bookings.length === 0 ? (
          <Text style={styles.emptyText}>{emptyState}</Text>
        ) : (
          bookings.map((item) => (
          <View key={item.id} style={styles.card}>
            <Image
              source={item.imageUrl ? { uri: item.imageUrl } : placeholderImage}
              style={styles.cardImage}
            />
            <Text style={styles.cardTitle}>{item.title}</Text>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryItem}>{item.title}</Text>
              <Text style={styles.summarySep}>|</Text>
              <Text style={styles.summaryItem}>{item.destination}</Text>
              <Text style={styles.summarySep}>|</Text>
              <Text style={styles.summaryItem}>{item.timeslot}</Text>
              <Text style={styles.summarySep}>|</Text>
              <View style={styles.summaryPeople}>
                <MaterialCommunityIcons
                  name="account-group"
                  size={16}
                  color={colors.textPrimary}
                />
                <Text style={styles.summaryPeopleText}>{item.people}</Text>
              </View>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cardButton}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/guest/Directions",
                    params: {
                      microservice: item.title,
                      destination: item.destination,
                      timeslot: item.timeslot,
                      people: item.people,
                      latitude: String(item.latitude),
                      longitude: String(item.longitude),
                    },
                  })
                }
              >
                <Text>{t("booking.getDirections")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cardButton}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/guest/ManageBooking",
                    params: {
                      bookingId: item.id,
                      from: "bookings",
                      microservice: item.title,
                      destination: item.destination,
                      timeslot: item.timeslot,
                      people: item.people,
                    },
                  })
                }
              >
                <Text>{t("booking.manage")}</Text>
              </TouchableOpacity>
            </View>
          </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBackground },
  container: { padding: 16, paddingBottom: 24 },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    color: colors.textPrimary,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  cardImage: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: colors.border,
  },
  cardTitle: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 8,
  },
  summaryLine: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    columnGap: 8,
    rowGap: 4,
    marginBottom: 6,
  },
  summaryItem: {
    fontWeight: "600",
    color: colors.textPrimary,
  },
  summarySep: {
    color: colors.textMuted,
    fontWeight: "600",
  },
  summaryPeople: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summaryPeopleText: {
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  cardButton: {
    flex: 1,
    padding: 12,
    backgroundColor: colors.surfaceSoft,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 4,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 24,
    fontWeight: "600",
  },
});

