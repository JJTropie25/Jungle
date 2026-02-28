import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useI18n } from "../../../lib/i18n";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import QRCode from "react-native-qrcode-svg";
import { colors } from "../../../lib/theme";

export default function BookingConfirmation() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { destination, timeslot, people, microservice, selectedHour, bookingId, qrToken } =
    useLocalSearchParams<{
      destination?: string;
      timeslot?: string;
      people?: string;
      microservice?: string;
      selectedHour?: string;
      bookingId?: string;
      qrToken?: string;
    }>();
  const [token, setToken] = useState<string | null>(qrToken ?? null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [serviceTitle, setServiceTitle] = useState<string | null>(null);
  const [serviceLocation, setServiceLocation] = useState<string | null>(null);
  const [slotStart, setSlotStart] = useState<string | null>(null);
  const placeholderImage = require("../../../assets/images/react-logo.png");

  useEffect(() => {
    let isMounted = true;
    if (!supabase || !bookingId) return;
    supabase
      .from("bookings")
      .select("qr_token, slot_start, service:services(title, location, image_url)")
      .eq("id", bookingId)
      .single()
      .then(({ data }) => {
        if (!isMounted) return;
        if (data?.qr_token) setToken(data.qr_token);
        if (data?.slot_start) setSlotStart(data.slot_start);
        if (data?.service?.title) setServiceTitle(data?.service?.title ?? null);
        if (data?.service?.location) setServiceLocation(data?.service?.location ?? null);
        if (data?.service?.image_url) setImageUrl(data?.service?.image_url ?? null);
      });
    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  const fallbackTimeslot = useMemo(() => {
    if (!slotStart) return null;
    const d = new Date(slotStart);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
  }, [slotStart]);

  const summaryTitle = serviceTitle ?? microservice ?? "-";
  const summaryDestination = serviceLocation ?? destination ?? "-";
  const summaryTimeslot = selectedHour ?? timeslot ?? fallbackTimeslot ?? "-";

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 16 },
        ]}
      >
        <Text style={styles.thankYou}>{t("booking.thankYou")}</Text>

        {/* Service recap card */}
        <View style={styles.card}>
          <Image
            source={imageUrl ? { uri: imageUrl } : placeholderImage}
            style={styles.cardImage}
          />
          <Text style={styles.cardTitle}>{summaryTitle}</Text>
          <View style={styles.summaryLine}>
            <Text style={styles.summaryItem}>{summaryTitle}</Text>
            <Text style={styles.summarySep}>|</Text>
            <Text style={styles.summaryItem}>{summaryDestination}</Text>
            <Text style={styles.summarySep}>|</Text>
            <Text style={styles.summaryItem}>{summaryTimeslot}</Text>
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
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cardButton}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/guest/Directions",
                  params: {
                    microservice: summaryTitle,
                    destination: summaryDestination,
                    timeslot: summaryTimeslot,
                    people,
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
                    bookingId,
                    qrToken,
                    microservice: summaryTitle,
                    destination: summaryDestination,
                    timeslot: summaryTimeslot,
                    people,
                  },
                })
              }
            >
              <Text>{t("booking.manage")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* QR code card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("booking.accessQr")}</Text>
          <View style={styles.qrMock}>
            {token ? (
              <QRCode value={token} size={160} />
            ) : (
              <Text>{t("booking.qrCode")}</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBackground },
  container: { padding: 16, paddingBottom: 24 },
  thankYou: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
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
    height: 140,
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
  qrMock: {
    height: 180,
    backgroundColor: colors.background,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
});

