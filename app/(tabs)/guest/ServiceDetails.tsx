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
import { useI18n } from "../../../lib/i18n";
import { supabase } from "../../../lib/supabase";
import { useAuthState } from "../../../lib/auth";
import { addFavorite, fetchFavoriteIds, removeFavorite } from "../../../lib/favorites";
import { colors } from "../../../lib/theme";
import { addRecentlyViewedId } from "../../../lib/recentlyViewed";
import { useAppDialog } from "../../../components/AppDialogProvider";

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
  const [isFavorite, setIsFavorite] = useState(false);
  const reviews = useMemo(
    () => [
      {
        id: "r1",
        author: "Giulia M.",
        rating: "4.8",
        text: "Very clean spot and quick access. Perfect for a short stop.",
      },
      {
        id: "r2",
        author: "Luca R.",
        rating: "4.6",
        text: "Easy check-in and friendly host. Would book again.",
      },
      {
        id: "r3",
        author: "Sara T.",
        rating: "4.9",
        text: "Exactly as described, great location and smooth booking.",
      },
    ],
    []
  );

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
      .select("title, location, image_url")
      .eq("id", serviceId)
      .single()
      .then(({ data }) => {
        if (!isMounted) return;
        setImageUrl(data?.image_url ?? null);
        setServiceTitle(data?.title ?? null);
        setServiceLocation(data?.location ?? null);
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
    return slots.map((s) => s.time);
  }, [slots]);
  const summaryTitle = serviceTitle ?? microservice ?? "-";
  const summaryLocation = serviceLocation ?? destination ?? "-";

  const handleBooking = async () => {
    if (!user) {
      router.push("/(auth)/sign-in");
      return;
    }
    if (!serviceId || !selectedHour) return;

    const match = slots.find((s) => s.time === selectedHour);
    const slotStart = match?.start ?? new Date().toISOString();
    const slotEnd =
      match?.end ??
      new Date(new Date(slotStart).getTime() + 30 * 60 * 1000).toISOString();

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
            <Image source={{ uri: imageUrl }} style={styles.imageFill} />
          ) : (
            <Text>IMAGE</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Description</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            {microservice ?? "This service"} near {destination ?? "your destination"} is designed
            for fast, reliable access with clear check-in flow, secure space, and flexible timing.
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

        <Text style={styles.sectionTitle}>Reviews</Text>
        <View style={styles.reviewsList}>
          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewAuthor}>{review.author}</Text>
                <Text style={styles.reviewRating}>★ {review.rating}</Text>
              </View>
              <Text style={styles.reviewText}>{review.text}</Text>
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
    resizeMode: "cover",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 10,
    marginTop: 6,
  },
  infoCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
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
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.textPrimary,
    borderRadius: 10,
    alignItems: "center",
  },
  bookButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  bookText: {
    color: colors.background,
    fontWeight: "700",
  },
});
