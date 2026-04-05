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
import { useCallback, useEffect, useMemo, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";
import { useAuthState } from "../../lib/auth";
import { colors } from "../../lib/theme";
import TabTopNotch from "../../components/TabTopNotch";
import { toCategoryIcon } from "../../lib/services";

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
      serviceId: string;
      hasReview: boolean;
      latitude?: number | null;
      longitude?: number | null;
      imageUrl?: string | null;
      category?: "rest" | "shower" | "storage" | null;
      slotStart: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const loadBookings = useCallback(() => {
    if (!supabase || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("bookings")
      .select(
        "id, slot_start, slot_end, people_count, service:services(id, title, location, latitude, longitude, image_url, category)"
      )
      .eq("guest_id", user.id)
      .order("slot_start", { ascending: false })
      .then(async ({ data }) => {
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
              serviceId: row.service?.id ?? "",
              hasReview: false,
              latitude: row.service?.latitude,
              longitude: row.service?.longitude,
              imageUrl: row.service?.image_url ?? null,
              category: row.service?.category ?? null,
              slotStart: row.slot_start,
            };
          }) ?? [];
        const bookingIds = mapped.map((item) => item.id);
        if (bookingIds.length > 0) {
          const { data: reviews } = await supabase
            .from("service_reviews")
            .select("booking_id")
            .in("booking_id", bookingIds);
          const reviewedIds = new Set((reviews ?? []).map((row: any) => row.booking_id));
          mapped.forEach((item) => {
            item.hasReview = reviewedIds.has(item.id);
          });
        }
        setBookings(mapped);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    if (isFocused) {
      loadBookings();
    }
  }, [isFocused, loadBookings]);

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
          bookings.map((item) => {
          const isExpired = new Date(item.slotStart).getTime() < Date.now();
          return (
          <View key={item.id} style={[styles.card, isExpired && styles.cardExpired]}>
            <Image
              source={item.imageUrl ? { uri: item.imageUrl } : placeholderImage}
              style={styles.cardImage}
            />
            <Text style={[styles.cardTitle, isExpired && styles.textExpired]}>{item.title}</Text>
            {isExpired ? <Text style={styles.expiredBadge}>{t("booking.expired")}</Text> : null}
            <View style={styles.summaryStack}>
              {item.category ? (
                <MaterialCommunityIcons
                  name={toCategoryIcon(item.category) as any}
                  size={16}
                  color={isExpired ? "#718080" : colors.textPrimary}
                />
              ) : null}
              <Text style={[styles.summaryItem, isExpired && styles.textExpired]}>{item.timeslot}</Text>
              <Text style={[styles.summaryItem, isExpired && styles.textExpired]}>{item.destination}</Text>
              <View style={styles.summaryPeople}>
                <MaterialCommunityIcons
                  name="account-group"
                  size={16}
                  color={isExpired ? "#718080" : colors.textPrimary}
                />
                <Text style={[styles.summaryPeopleText, isExpired && styles.textExpired]}>{item.people}</Text>
              </View>
            </View>
            <View style={styles.buttonRow}>
              {isExpired ? (
                <TouchableOpacity
                  style={[styles.cardButton, styles.reviewButton, item.hasReview && styles.reviewButtonDisabled]}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/guest/LeaveReview",
                      params: {
                        bookingId: item.id,
                        serviceId: item.serviceId,
                        microservice: item.title,
                        destination: item.destination,
                        timeslot: item.timeslot,
                      },
                    })
                  }
                  disabled={item.hasReview}
                >
                  <Text style={styles.reviewButtonText}>
                    {item.hasReview ? t("review.alreadySubmitted") : t("review.leave")}
                  </Text>
                </TouchableOpacity>
              ) : (
                <>
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
                </>
              )}
            </View>
          </View>
          )})
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
    color: colors.surface,
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
  cardExpired: {
    backgroundColor: "#EAF0F0",
    borderColor: "#B9C9C9",
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
  textExpired: {
    color: "#6C7C7C",
  },
  expiredBadge: {
    alignSelf: "flex-start",
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "#D5E0E0",
    color: "#687878",
    fontSize: 11,
    fontWeight: "700",
  },
  summaryStack: {
    gap: 6,
    marginBottom: 6,
  },
  summaryItem: {
    fontWeight: "600",
    color: colors.textPrimary,
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
    backgroundColor: colors.warmSurface,
    borderWidth: 1,
    borderColor: colors.warmAccentSoft,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 4,
  },
  reviewButton: {
    backgroundColor: colors.warmAccentDark,
    borderColor: colors.warmAccentDark,
    marginHorizontal: 0,
  },
  reviewButtonDisabled: {
    opacity: 0.6,
  },
  reviewButtonText: {
    color: colors.background,
    fontWeight: "700",
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 24,
    fontWeight: "600",
  },
});

