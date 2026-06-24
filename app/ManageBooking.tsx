import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useI18n } from "../lib/i18n";
import { useEffect, useMemo, useState } from "react";
import { useAuthState } from "../lib/auth";
import { supabase } from "../lib/supabase";
import QRCode from "react-native-qrcode-svg";
import { useTheme } from "../lib/theme-context";
import { type ThemeColors } from "../lib/theme";
import { useAppDialog } from "../components/AppDialogProvider";

const HEADER_COLOR = "#4F9B9B";
const DANGER_COLOR = "#B94040";

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

    content: { paddingHorizontal: 16 },
    section: { paddingVertical: 16 },
    divider: { height: 1, backgroundColor: c.divider },

    serviceImage: {
      width: "100%", height: 140,
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

    btn: {
      height: 50, borderRadius: 12,
      justifyContent: "center", alignItems: "center",
      paddingHorizontal: 12,
      marginBottom: 10,
    },
    btnFilled: { backgroundColor: c.warmAccent },
    btnReview: { backgroundColor: c.warmAccentDark },
    btnDanger: { borderWidth: 1.5, borderColor: DANGER_COLOR, backgroundColor: "transparent" },
    btnText: { fontWeight: "600", fontSize: 14, color: "#fff" },
    btnTextDanger: { color: DANGER_COLOR, fontWeight: "600", fontSize: 14 },
    btnDisabled: { opacity: 0.5 },
  });
}

export default function ManageBooking() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const dialog = useAppDialog();
  const { destination, timeslot, people, microservice, from, bookingId, qrToken } =
    useLocalSearchParams<{
      destination?: string;
      timeslot?: string;
      people?: string;
      microservice?: string;
      from?: string;
      bookingId?: string;
      qrToken?: string;
    }>();
  const [token, setToken] = useState<string | null>(qrToken ?? null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [hostPhone, setHostPhone] = useState<string | null>(null);
  const [slotStart, setSlotStart] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [hasReview, setHasReview] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const { user } = useAuthState();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async function waitForSession(timeoutMs = 3000) {
    if (!supabase) return null;
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const { data } = await supabase.auth.getSession();
        const session = (data as any)?.session ?? null;
        if (session?.user) return session.user;
      } catch {
        // ignore and retry
      }
      await sleep(250);
    }
    return null;
  }

  useEffect(() => {
    let isMounted = true;
    if (!supabase || !bookingId) return;
    supabase
      .from("bookings")
      .select("qr_token, slot_start, service_id, service:services(image_url)")
      .eq("id", bookingId)
      .single()
      .then(({ data }) => {
        if (!isMounted) return;
        if (data?.qr_token) setToken(data.qr_token);
        setSlotStart(data?.slot_start ?? null);
        setServiceId(data?.service_id ?? null);
        const svc = Array.isArray(data?.service) ? (data.service as any[])[0] : (data?.service as any);
        if (svc?.image_url) setImageUrl(svc.image_url);
      });
    return () => { isMounted = false; };
  }, [bookingId]);

  useEffect(() => {
    let isMounted = true;
    if (!supabase || !bookingId) return;
    supabase
      .from("service_reviews")
      .select("id")
      .eq("booking_id", bookingId)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!isMounted) return;
        setHasReview(Boolean(data?.id));
      });
    return () => { isMounted = false; };
  }, [bookingId]);

  useEffect(() => {
    let isMounted = true;
    if (!supabase || !bookingId) return;
    const loadHostPhone = async () => {
      const sb = supabase;
      if (!sb) return;
      const { data: bookingRow } = await sb
        .from("bookings")
        .select("service_id")
        .eq("id", bookingId)
        .maybeSingle();
      if (!isMounted || !bookingRow?.service_id) return;
      const { data: serviceRow } = await sb
        .from("services")
        .select("host_id")
        .eq("id", bookingRow.service_id)
        .maybeSingle();
      if (!isMounted || !serviceRow?.host_id) return;
      const { data: hostRow } = await sb
        .from("hosts")
        .select("guest_id, phone_country_code, phone_number")
        .eq("id", serviceRow.host_id)
        .maybeSingle();
      if (!isMounted) return;
      if (hostRow?.phone_number) {
        const compact = `${hostRow.phone_country_code ?? ""}${hostRow.phone_number}`.replace(/[^\d+]/g, "");
        if (compact) { setHostPhone(compact); return; }
      }
      if (!hostRow?.guest_id) return;
      const { data: profileRow } = await sb
        .from("profiles")
        .select("phone_country_code, phone_number")
        .eq("id", hostRow.guest_id)
        .maybeSingle();
      if (!isMounted) return;
      if (profileRow?.phone_number) {
        const compact = `${profileRow.phone_country_code ?? ""}${profileRow.phone_number}`.replace(/[^\d+]/g, "");
        setHostPhone(compact || null);
      } else {
        setHostPhone(null);
      }
    };
    loadHostPhone();
    return () => { isMounted = false; };
  }, [bookingId]);

  const isExpired = slotStart ? new Date(slotStart).getTime() < Date.now() : false;

  const handleBack = () => {
    if (from === "bookings") {
      router.replace("/(tabs)/bookings");
    } else {
      router.back();
    }
  };

  const handleCancel = async () => {
    if (!bookingId || !supabase) {
      await dialog.alert(t("booking.cancel"), "Unable to cancel this booking.");
      return;
    }
    const confirmed = await dialog.confirm({
      title: t("booking.cancel"),
      message: t("booking.cancelConfirm"),
      cancelText: t("booking.cancelNo"),
      confirmText: t("booking.cancelYes"),
      confirmVariant: "danger",
    });
    if (!confirmed) return;
    setCanceling(true);
    try {
      const sessionUser = user ?? (await waitForSession(3000));
      const activeUserId = sessionUser?.id ?? null;
      if (!activeUserId) {
        setCanceling(false);
        await dialog.alert(t("booking.cancel"), t("bookings.signIn") || "Please sign in to cancel bookings.");
        return;
      }
      const idToUse = bookingId && /^[0-9]+$/.test(String(bookingId)) ? Number(bookingId) : bookingId;
      const { data: fetchData, error: fetchErr } = await supabase
        .from("bookings")
        .select("guest_id")
        .eq("id", idToUse as any)
        .maybeSingle();
      if (fetchErr) { setCanceling(false); await dialog.alert(t("booking.cancel"), fetchErr.message); return; }
      if (!fetchData || fetchData.guest_id !== activeUserId) {
        setCanceling(false);
        await dialog.alert(t("booking.cancel"), t("booking.cancelNotAllowed") || "You are not allowed to cancel this booking.");
        return;
      }
      const { data, error } = await supabase
        .from("bookings")
        .delete()
        .eq("id", idToUse as any)
        .eq("guest_id", activeUserId)
        .select("*");
      console.log("ManageBooking: delete result", { data, error });
      if (error) { setCanceling(false); await dialog.alert(t("booking.cancel"), error.message); return; }
      if (Array.isArray(data) && data.length > 0) { setCanceling(false); router.replace("/(tabs)/bookings"); return; }
      const { data: verify, error: verifyErr } = await supabase
        .from("bookings")
        .select("id")
        .eq("id", idToUse as any)
        .maybeSingle();
      setCanceling(false);
      if (verifyErr) { await dialog.alert(t("booking.cancel"), verifyErr.message); return; }
      if (verify?.id) {
        await dialog.alert(t("booking.cancel"), t("booking.cancelFailed") || `Unable to delete booking ${String(idToUse)}.`);
        return;
      }
      router.replace("/(tabs)/bookings");
    } catch (e: any) {
      setCanceling(false);
      await dialog.alert(t("booking.cancel"), e?.message || String(e));
    }
  };

  const handleContact = async () => {
    if (!hostPhone) {
      await dialog.alert(t("booking.contact"), "Host phone is not available.");
      return;
    }
    const url = `tel:${hostPhone}`;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      await dialog.alert(t("booking.contact"), "Unable to open phone dialer.");
      return;
    }
    await Linking.openURL(url);
  };

  const headerH = insets.top + 52;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.headerBtn} onPress={handleBack}>
          <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>{t("booking.manageTitle")}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: headerH + 8, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Service info */}
        <View style={styles.section}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.serviceImage} resizeMode="cover" />
          ) : null}
          <Text style={styles.serviceName}>{microservice ?? "-"}</Text>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{timeslot ?? "-"}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{destination ?? "-"}</Text>
          </View>
          <View style={[styles.infoRow, { marginBottom: 0 }]}>
            <MaterialCommunityIcons name="account-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{people ?? "-"}</Text>
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
        <View style={styles.section}>
          {isExpired ? (
            <Pressable
              style={[styles.btn, styles.btnReview, hasReview && styles.btnDisabled]}
              onPress={() => {
                if (!bookingId || !serviceId) return;
                router.push({
                  pathname: "/LeaveReview",
                  params: { bookingId, serviceId, microservice, destination, timeslot },
                });
              }}
              disabled={hasReview}
            >
              <Text style={styles.btnText}>
                {hasReview ? t("review.alreadySubmitted") : t("review.leave")}
              </Text>
            </Pressable>
          ) : (
            <>
              <Pressable style={[styles.btn, styles.btnFilled]} onPress={handleContact}>
                <Text style={styles.btnText}>{t("booking.contact")}</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.btnDanger, canceling && styles.btnDisabled]}
                onPress={handleCancel}
                disabled={canceling}
              >
                <Text style={styles.btnTextDanger}>{t("booking.cancel")}</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
