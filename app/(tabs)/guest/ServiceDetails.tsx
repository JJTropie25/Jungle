import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
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

export default function ServiceDetails() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { user } = useAuthState();
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
  const [isFavorite, setIsFavorite] = useState(false);

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
      .select("image_url")
      .eq("id", serviceId)
      .single()
      .then(({ data }) => {
        if (!isMounted) return;
        setImageUrl(data?.image_url ?? null);
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

  const toggleFavorite = async () => {
    if (!user || !serviceId) {
      Alert.alert(t("favorites.title"), t("favorites.signIn"));
      return;
    }
    if (isFavorite) {
      await removeFavorite(user.id, serviceId);
      setIsFavorite(false);
    } else {
      await addFavorite(user.id, serviceId);
      setIsFavorite(true);
    }
  };

  const availableHours = useMemo(() => {
    if (slots.length === 0) {
      return ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00"];
    }
    return slots.map((s) => s.time);
  }, [slots]);

  const handleBooking = async () => {
    if (!supabase) {
      Alert.alert(t("service.bookNow"), "Supabase is not configured.");
      return;
    }
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
    const peopleCount = Number(people ?? 1) || 1;
    const qrToken = `BK-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        guest_id: user.id,
        service_id: serviceId,
        slot_start: slotStart,
        slot_end: slotEnd,
        people_count: peopleCount,
        qr_token: qrToken,
      })
      .select("id")
      .single();
    if (error) {
      Alert.alert(t("service.bookNow"), error.message);
      return;
    }
    router.push({
      pathname: "/(tabs)/guest/BookingConfirmation",
      params: {
        bookingId: data.id,
        qrToken,
        destination,
        timeslot,
        people,
        microservice,
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
        {/* SUMMARY */}
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
            <View style={styles.summaryLine}>
              <Text style={styles.summaryItem}>{microservice ?? "-"}</Text>
              <Text style={styles.summarySep}>|</Text>
              <Text style={styles.summaryItem}>{destination ?? "-"}</Text>
              <Text style={styles.summarySep}>|</Text>
              <Text style={styles.summaryItem}>{timeslot ?? "-"}</Text>
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

        {/* IMAGE MOCK */}
        <View style={styles.imageMock}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.imageFill} />
          ) : (
            <Text>IMAGE</Text>
          )}
        </View>

        {/* HOURS */}
        <Text style={styles.sectionTitle}>{t("service.availableTimes")}</Text>
        <View style={styles.grid}>
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
        </View>

        {/* BOOK */}
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
  screen: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, paddingBottom: 24 },
  summaryBox: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  summaryText: { fontWeight: "600" },
  summaryLine: {
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
    fontWeight: "600",
    marginBottom: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  hourButton: {
    width: "30%",
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
