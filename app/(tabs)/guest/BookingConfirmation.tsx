import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useI18n } from "../../../lib/i18n";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import QRCode from "react-native-qrcode-svg";
import { useTheme } from "../../../lib/theme-context";
import { type ThemeColors } from "../../../lib/theme";

const HEADER_COLOR = "#4F9B9B";
const SUCCESS_GREEN = "#2A7A3A";

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.screenBackground },

    header: {
      position: "absolute",
      top: 0, left: 0, right: 0,
      zIndex: 10,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
      backgroundColor: HEADER_COLOR,
    },
    headerBtn: {
      width: 36, height: 36, borderRadius: 18,
      alignItems: "center", justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      fontSize: 15, fontWeight: "700",
      fontFamily: "Baloo2_700Bold",
      color: "#fff",
    },

    content: { paddingHorizontal: 16, paddingBottom: 40 },
    section: { paddingVertical: 16 },
    divider: { height: 1, backgroundColor: c.divider },

    successSection: {
      paddingVertical: 20,
      alignItems: "center",
      gap: 10,
    },
    successText: {
      fontSize: 17, fontWeight: "700",
      fontFamily: "Baloo2_700Bold",
      color: SUCCESS_GREEN,
      textAlign: "center",
    },

    serviceImage: {
      width: "100%", height: 150,
      borderRadius: 10,
      backgroundColor: c.border,
      marginBottom: 12,
    },
    serviceName: {
      fontSize: 20, fontWeight: "700",
      fontFamily: "Baloo2_700Bold",
      color: c.textPrimary,
      marginBottom: 10,
    },
    infoRow: {
      flexDirection: "row", alignItems: "center",
      gap: 8, marginBottom: 8,
    },
    infoText: { color: c.textSecondary, fontSize: 14, flex: 1 },

    qrLabel: {
      fontSize: 15, fontWeight: "700",
      fontFamily: "Baloo2_700Bold",
      color: c.textPrimary,
      marginBottom: 16,
    },
    qrCenter: { alignItems: "center" },
    qrPlaceholder: { color: c.textSecondary, fontWeight: "600" },

    actionRow: { flexDirection: "row", gap: 10 },
    actionBtn: {
      flex: 1, height: 50, borderRadius: 12,
      alignItems: "center", justifyContent: "center",
      backgroundColor: c.surfaceSoft,
      borderWidth: 1.5, borderColor: c.border,
    },
    actionBtnPrimary: {
      backgroundColor: c.warmAccent,
      borderColor: c.warmAccent,
    },
    actionBtnText: { color: c.textPrimary, fontWeight: "600", fontSize: 14 },
    actionBtnTextPrimary: { color: "#fff" },
  });
}

export default function BookingConfirmation() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
        const svc = Array.isArray(data?.service) ? (data.service as any[])[0] : (data?.service as any);
        if (svc?.title) setServiceTitle(svc.title);
        if (svc?.location) setServiceLocation(svc.location);
        if (svc?.image_url) setImageUrl(svc.image_url);
      });
    return () => { isMounted = false; };
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

  const headerH = insets.top + 52;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.replace("/(tabs)/guest")}
        >
          <MaterialCommunityIcons name="home-outline" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("booking.thankYou")}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: headerH + 8, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Success banner */}
        <View style={styles.successSection}>
          <MaterialCommunityIcons name="check-circle" size={58} color={SUCCESS_GREEN} />
          <Text style={styles.successText}>{t("payment.successTitle")}</Text>
        </View>
        <View style={styles.divider} />

        {/* Service info */}
        <View style={styles.section}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.serviceImage} resizeMode="cover" />
          ) : null}
          <Text style={styles.serviceName}>{summaryTitle}</Text>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{summaryDestination}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{summaryTimeslot}</Text>
          </View>
          <View style={[styles.infoRow, { marginBottom: 0 }]}>
            <MaterialCommunityIcons name="account-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{people ?? "1"}</Text>
          </View>
        </View>
        <View style={styles.divider} />

        {/* QR Code */}
        <View style={styles.section}>
          <Text style={styles.qrLabel}>{t("booking.accessQr")}</Text>
          <View style={styles.qrCenter}>
            {token ? (
              <QRCode value={token} size={180} />
            ) : (
              <Text style={styles.qrPlaceholder}>{t("booking.qrCode")}</Text>
            )}
          </View>
        </View>
        <View style={styles.divider} />

        {/* Actions */}
        <View style={[styles.section, styles.actionRow]}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() =>
              router.push({
                pathname: "/Directions",
                params: {
                  microservice: summaryTitle,
                  destination: summaryDestination,
                  timeslot: summaryTimeslot,
                  people,
                },
              })
            }
          >
            <Text style={styles.actionBtnText}>{t("booking.getDirections")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={() =>
              router.push({
                pathname: "/ManageBooking",
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
            <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>
              {t("booking.manage")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
