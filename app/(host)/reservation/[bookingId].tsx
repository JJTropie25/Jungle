import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../../lib/theme";
import { supabase } from "../../../lib/supabase";
import { useI18n } from "../../../lib/i18n";
import { useAppDialog } from "../../../components/AppDialogProvider";

function toSlotLabel(startIso?: string, endIso?: string) {
  if (!startIso || !endIso) return "-";
  const start = new Date(startIso);
  const end = new Date(endIso);
  const date = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(
    start.getDate()
  ).padStart(2, "0")}`;
  const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${date} ${hhmm(start)}-${hhmm(end)}`;
}

export default function HostReservationDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const dialog = useAppDialog();
  const { bookingId } = useLocalSearchParams<{ bookingId?: string }>();
  const placeholderImage = require("../../../assets/images/react-logo.png");

  const [serviceTitle, setServiceTitle] = useState("-");
  const [serviceLocation, setServiceLocation] = useState("-");
  const [serviceImage, setServiceImage] = useState<string | null>(null);
  const [slotStart, setSlotStart] = useState<string | undefined>(undefined);
  const [slotEnd, setSlotEnd] = useState<string | undefined>(undefined);
  const [people, setPeople] = useState(1);
  const [guestPhone, setGuestPhone] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!supabase || !bookingId) return;

    const load = async () => {
      const { data: booking } = await supabase
        .from("bookings")
        .select("guest_id, people_count, slot_start, slot_end, qr_token, service:services(title, location, image_url)")
        .eq("id", bookingId)
        .maybeSingle();
      if (!mounted || !booking) return;

      setPeople(booking.people_count ?? 1);
      setSlotStart(booking.slot_start ?? undefined);
      setSlotEnd(booking.slot_end ?? undefined);
      setQrToken(booking.qr_token ?? null);
      setServiceTitle(booking.service?.title ?? "-");
      setServiceLocation(booking.service?.location ?? "-");
      setServiceImage(booking.service?.image_url ?? null);

      if (booking.guest_id) {
        const { data: guestProfile } = await supabase
          .from("profiles")
          .select("phone_country_code, phone_number")
          .eq("id", booking.guest_id)
          .maybeSingle();
        if (!mounted) return;
        if (guestProfile?.phone_number) {
          setGuestPhone(
            `${guestProfile.phone_country_code ?? ""}${guestProfile.phone_number}`.replace(/[^\d+]/g, "")
          );
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [bookingId]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => (router.canGoBack() ? router.back() : router.replace("/(host)/reservations"))}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.card}>
          <Image source={serviceImage ? { uri: serviceImage } : placeholderImage} style={styles.cardImage} />
          <Text style={styles.cardTitle}>{serviceTitle}</Text>
          <Text style={styles.cardText}>{serviceLocation}</Text>
          <Text style={styles.cardText}>{toSlotLabel(slotStart, slotEnd)}</Text>
          <Text style={styles.cardText}>
            {t("home.people")}: {people}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={async () => {
            if (!guestPhone) {
              await dialog.alert("Contact guest", "Guest phone is not available.");
              return;
            }
            const url = `tel:${guestPhone}`;
            const supported = await Linking.canOpenURL(url);
            if (!supported) {
              await dialog.alert("Contact guest", "Unable to open phone dialer.");
              return;
            }
            await Linking.openURL(url);
          }}
        >
          <Text style={styles.primaryText}>Contact guest</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() =>
            router.push({
              pathname: "/(host)/scan-qr",
              params: { bookingId, expectedToken: qrToken ?? "" },
            })
          }
        >
          <Text style={styles.secondaryText}>Scan QR</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBackground },
  container: { flex: 1, paddingHorizontal: 16 },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  card: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  cardImage: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    backgroundColor: colors.surfaceSoft,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardText: {
    color: colors.textSecondary,
    fontWeight: "600",
    marginBottom: 2,
  },
  primaryButton: {
    backgroundColor: colors.textPrimary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryText: {
    color: colors.background,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: colors.warmAccent,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryText: {
    color: colors.background,
    fontWeight: "700",
  },
});
