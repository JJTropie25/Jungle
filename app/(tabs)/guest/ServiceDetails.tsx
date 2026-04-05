import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useI18n } from "../../../lib/i18n";
import { supabase } from "../../../lib/supabase";
import { useAuthState } from "../../../lib/auth";
import { addFavorite, fetchFavoriteIds, removeFavorite } from "../../../lib/favorites";
import { colors } from "../../../lib/theme";
import { addRecentlyViewedId } from "../../../lib/recentlyViewed";
import { useAppDialog } from "../../../components/AppDialogProvider";
import { fetchServiceReviews, type ServiceReview } from "../../../lib/reviews";

export default function ServiceDetails() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { user } = useAuthState();
  const dialog = useAppDialog();
  const { destination, timeslot, people, microservice, serviceId } =
    useLocalSearchParams<{
      destination?: string;
      timeslot?: string;
      people?: string;
      microservice?: string;
      serviceId?: string;
    }>();

  const [slots, setSlots] = useState<{ id: string; time: string; start: string; end: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedHour, setSelectedHour] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [serviceTitle, setServiceTitle] = useState<string | null>(null);
  const [serviceLocation, setServiceLocation] = useState<string | null>(null);
  const [serviceDescription, setServiceDescription] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviews, setReviews] = useState<ServiceReview[]>([]);

  useEffect(() => {
    let isMounted = true;
    if (!serviceId || !supabase) {
      setLoadingSlots(false);
      return;
    }
    setLoadingSlots(true);
    supabase
      .from("service_slots")
      .select("id, slot_start, slot_end")
      .eq("service_id", serviceId)
      .order("slot_start", { ascending: true })
      .then(({ data }) => {
        if (!isMounted) return;
        const mapped =
          data?.map((row) => {
            const start = new Date(row.slot_start);
            const time = `${String(start.getHours()).padStart(2, "0")}:${String(
              start.getMinutes()
            ).padStart(2, "0")}`;
            return {
              id: row.id,
              time,
              start: row.slot_start,
              end: row.slot_end,
            };
          }) ?? [];
        setSlots(mapped);
        setLoadingSlots(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoadingSlots(false);
      });
    return () => {
      isMounted = false;
    };
  }, [serviceId]);

  useEffect(() => {
    let isMounted = true;
    if (!serviceId || !supabase) return;
    supabase
      .from("services")
      .select("title, location, image_url, description")
      .eq("id", serviceId)
      .single()
      .then(({ data }) => {
        if (!isMounted) return;
        setImageUrl(data?.image_url ?? null);
        setServiceTitle(data?.title ?? null);
        setServiceLocation(data?.location ?? null);
        setServiceDescription(data?.description ?? null);
      });
    return () => {
      isMounted = false;
    };
  }, [serviceId]);

  useEffect(() => {
    let isMounted = true;
    if (!user || !serviceId) {
      setIsFavorite(false);
      return;
    }
    fetchFavoriteIds(user.id).then((ids) => {
      if (!isMounted) return;
      setIsFavorite(ids.has(serviceId));
    });
    return () => {
      isMounted = false;
    };
  }, [serviceId, user]);

  useEffect(() => {
    if (!serviceId) return;
    addRecentlyViewedId(serviceId, user?.id);
  }, [serviceId, user?.id]);

  useFocusEffect(
    useMemo(
      () => () => {
        let mounted = true;
        if (!serviceId) {
          setReviews([]);
          return () => {
            mounted = false;
          };
        }
        fetchServiceReviews(serviceId).then((data) => {
          if (!mounted) return;
          setReviews(data);
        });
        return () => {
          mounted = false;
        };
      },
      [serviceId]
    )
  );

  const toggleFavorite = async () => {
    if (!user || !serviceId) {
      await dialog.alert(t("favorites.title"), t("favorites.signIn"));
      return;
    }
    if (isFavorite) {
      const { error } = await removeFavorite(user.id, serviceId);
      if (error) {
        await dialog.alert(t("favorites.title"), error.message);
        return;
      }
      setIsFavorite(false);
    } else {
      const { error } = await addFavorite(user.id, serviceId);
      if (error) {
        await dialog.alert(t("favorites.title"), error.message);
        return;
      }
      setIsFavorite(true);
    }
  };

  const availableHours = useMemo(() => {
    if (slots.length === 0) {
      return ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00"];
    }
    return Array.from(new Set(slots.map((s) => s.time)));
  }, [slots]);
  const summaryTitle = serviceTitle ?? microservice ?? "-";
  const summaryLocation = serviceLocation ?? destination ?? "-";

  const requestedDate = useMemo(() => {
    const raw = String(timeslot ?? "").trim();
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;
    const [, y, m, d] = match;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }, [timeslot]);

  const handleBooking = async () => {
    if (!user) {
      router.push("/(auth)/sign-in");
      return;
    }
    if (!serviceId || !selectedHour) return;

    const [hh, mm] = selectedHour.split(":").map((v) => Number(v));
    const baseDate = requestedDate ?? new Date();
    const bookingStart = new Date(baseDate);
    bookingStart.setHours(hh, mm, 0, 0);

    // If user did not choose a specific date, avoid creating immediately expired bookings.
    if (!requestedDate && bookingStart.getTime() < Date.now()) {
      bookingStart.setDate(bookingStart.getDate() + 1);
    }

    const bookingEnd = new Date(bookingStart.getTime() + 30 * 60 * 1000);
    const slotStart = bookingStart.toISOString();
    const slotEnd = bookingEnd.toISOString();

    router.push({
      pathname: "/(tabs)/guest/Payment",
      params: {
        serviceId,
        slotStart,
        slotEnd,
        destination: serviceLocation ?? destination ?? "",
        timeslot: selectedHour ?? timeslot ?? "",
        people,
        microservice: serviceTitle ?? microservice ?? "",
        selectedHour,
      },
    });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 16 },
        ]}
      >
        <View style={styles.summaryBox}>
          <TouchableOpacity
            style={styles.summaryBack}
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/(tabs)/guest")
            }
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryTitle}>{summaryTitle}</Text>
            <View style={styles.summaryMetaLine}>
              <Text style={styles.summaryItem}>{summaryLocation}</Text>
              <Text style={styles.summarySep}>|</Text>
              <View style={styles.summaryPeople}>
                <MaterialCommunityIcons
                  name="account-group"
                  size={16}
                  color={colors.textPrimary}
                />
                <Text style={styles.summaryPeopleText}>{people ?? "-"}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.summaryStar} onPress={toggleFavorite}>
            <MaterialCommunityIcons
              name={isFavorite ? "star" : "star-outline"}
              size={20}
              color={isFavorite ? colors.accent : colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.imageMock}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} resizeMode="cover" style={styles.imageFill} />
          ) : (
            <Text>IMAGE</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>{t("service.description")}</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            {serviceDescription ??
              t("service.descriptionFallback", {
                title: summaryTitle,
                location: summaryLocation,
              })}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>{t("service.availableTimes")}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timeRow}
        >
          {availableHours.map((h) => (
            <TouchableOpacity
              key={h}
              style={[
                styles.hourButton,
                selectedHour === h && styles.hourButtonSelected,
              ]}
              onPress={() => setSelectedHour(h)}
            >
              <Text
                style={selectedHour === h ? styles.hourTextSelected : undefined}
              >
                {h}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>{t("service.reviews")}</Text>
        <View style={styles.reviewsList}>
          {reviews.length === 0 ? (
            <View style={styles.reviewCard}>
              <Text style={styles.reviewText}>{t("review.none")}</Text>
            </View>
          ) : reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewAuthor}>{review.author_name}</Text>
                <Text style={styles.reviewRating}>{review.rating_10}/10</Text>
              </View>
              <Text style={styles.reviewText}>{review.description}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.bookButton,
            !selectedHour && styles.bookButtonDisabled,
          ]}
          disabled={!selectedHour}
          onPress={handleBooking}
        >
          <Text style={styles.bookText}>{t("service.bookNow")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBackground },
  container: { padding: 16, paddingBottom: 24 },
  summaryBox: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  summaryBack: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryStar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  summaryMetaLine: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    columnGap: 8,
    rowGap: 4,
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
  imageMock: {
    height: 180,
    backgroundColor: colors.border,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  imageFill: {
    width: "100%",
    height: "100%",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.surface,
    marginBottom: 10,
    marginTop: 6,
  },
  infoCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  infoText: {
    color: colors.textSecondary,
    lineHeight: 20,
    fontWeight: "500",
  },
  timeRow: {
    gap: 8,
    paddingRight: 8,
    marginBottom: 14,
  },
  hourButton: {
    minWidth: 92,
    padding: 12,
    backgroundColor: colors.surfaceSoft,
    borderRadius: 8,
    alignItems: "center",
  },
  hourButtonSelected: {
    backgroundColor: colors.accent,
  },
  hourTextSelected: {
    fontWeight: "700",
    color: colors.background,
  },
  reviewsList: {
    gap: 10,
    marginBottom: 18,
  },
  reviewCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    alignItems: "center",
  },
  reviewAuthor: {
    fontWeight: "700",
    color: colors.textPrimary,
  },
  reviewRating: {
    fontWeight: "700",
    color: colors.textPrimary,
  },
  reviewText: {
    color: colors.textSecondary,
    lineHeight: 19,
  },
  bookButton: {
    padding: 16,
    backgroundColor: colors.warmAccent,
    borderRadius: 10,
    alignItems: "center",
  },
  bookButtonDisabled: {
    backgroundColor: colors.warmAccentSoft,
  },
  bookText: {
    color: colors.background,
    fontWeight: "700",
  },
});
