import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useI18n } from "../../../lib/i18n";
import { useAuthState } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { useTheme } from "../../../lib/theme-context";
import { type ThemeColors } from "../../../lib/theme";
import { useAppDialog } from "../../../components/AppDialogProvider";
import { createPaymentIntent } from "../../../lib/stripe";
import { useStripeClient } from "../../../lib/useStripeClient";

const CATEGORY_COLORS: Record<string, string> = {
  rest: "#1A4F8A",
  shower: "#5BB5CC",
  storage: "#C8930A",
};
const DEFAULT_HEADER_COLOR = "#4F9B9B";

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.screenBackground },

    header: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
    },
    headerBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      fontSize: 15,
      fontWeight: "700",
      fontFamily: "Baloo2_700Bold",
      color: "#fff",
    },

    content: {
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    section: {
      paddingVertical: 16,
    },
    divider: {
      height: 1,
      backgroundColor: c.divider,
    },

    serviceName: {
      fontSize: 20,
      fontWeight: "700",
      fontFamily: "Baloo2_700Bold",
      color: c.textPrimary,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 10,
    },
    infoText: {
      color: c.textSecondary,
      fontSize: 14,
      flex: 1,
    },

    priceRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    priceLabel: {
      fontSize: 15,
      fontWeight: "600",
      color: c.textSecondary,
    },
    priceValue: {
      fontSize: 26,
      fontWeight: "700",
      fontFamily: "Baloo2_700Bold",
      color: c.warmAccent,
    },

    sectionLabel: {
      fontSize: 15,
      fontWeight: "700",
      fontFamily: "Baloo2_700Bold",
      color: c.textPrimary,
      marginBottom: 12,
    },
    methodRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: c.surfaceSoft,
      marginBottom: 10,
      gap: 12,
      borderWidth: 1.5,
      borderColor: "transparent",
    },
    methodRowSelected: {
      backgroundColor: c.warmSurface,
      borderColor: c.warmAccent,
    },
    methodText: { flex: 1 },
    methodLabel: {
      fontWeight: "600",
      color: c.textPrimary,
      fontSize: 14,
    },
    methodHint: {
      color: c.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    radioSelected: { borderColor: c.warmAccent },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: c.warmAccent,
    },

    bookBar: {
      paddingHorizontal: 16,
      paddingTop: 12,
      backgroundColor: c.screenBackground,
      borderTopWidth: 1,
      borderTopColor: c.divider,
    },
    payButton: {
      padding: 16,
      backgroundColor: c.warmAccent,
      borderRadius: 12,
      alignItems: "center",
    },
    payButtonDisabled: { backgroundColor: c.warmAccentSoft },
    payButtonText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 16,
    },
  });
}

export default function Payment() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { user } = useAuthState();
  const dialog = useAppDialog();
  const stripe = useStripeClient();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const {
    serviceId,
    slotStart,
    slotEnd,
    destination,
    timeslot,
    people,
    microservice,
    selectedHour,
    category,
  } = useLocalSearchParams<{
    serviceId?: string;
    slotStart?: string;
    slotEnd?: string;
    destination?: string;
    timeslot?: string;
    people?: string;
    microservice?: string;
    selectedHour?: string;
    category?: string;
  }>();

  const headerColor = (category && CATEGORY_COLORS[category]) ?? DEFAULT_HEADER_COLOR;

  const [method, setMethod] = useState<"card" | "cash">("cash");
  const [processing, setProcessing] = useState(false);
  const [priceEur, setPriceEur] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!supabase || !serviceId) return;
    setLoadingPrice(true);
    const sb = supabase;
    (async () => {
      try {
        const { data } = await sb
          .from("services")
          .select("price_eur")
          .eq("id", serviceId)
          .maybeSingle();
        if (!mounted) return;
        setPriceEur(Number(data?.price_eur ?? 0));
      } finally {
        if (mounted) setLoadingPrice(false);
      }
    })();
    return () => { mounted = false; };
  }, [serviceId]);

  const handlePay = async () => {
    if (!supabase) {
      await dialog.alert(t("payment.title"), t("payment.supabaseMissing"));
      return;
    }
    if (!user) { router.replace("/(auth)/sign-in"); return; }
    if (!serviceId || !slotStart || !slotEnd) {
      await dialog.alert(t("payment.title"), t("payment.invalidData"));
      return;
    }

    setProcessing(true);
    const peopleCount = Number(people ?? 1) || 1;
    let paymentIntentId: string | null = null;
    let amountCents: number | null = null;
    let platformFeeCents: number | null = null;

    if (method === "card") {
      if (!stripe) {
        setProcessing(false);
        await dialog.alert(t("payment.title"), t("payment.cardNotAvailableWeb"));
        return;
      }
      const paymentIntent = await createPaymentIntent({
        service_id: serviceId,
        slot_start: slotStart,
        slot_end: slotEnd,
        people_count: peopleCount,
        currency: "eur",
      });
      if (!paymentIntent.client_secret || !paymentIntent.payment_intent_id) {
        setProcessing(false);
        await dialog.alert(t("payment.title"), paymentIntent.error ?? "Payment setup failed.");
        return;
      }
      const init = await stripe.initPaymentSheet({
        paymentIntentClientSecret: paymentIntent.client_secret,
        merchantDisplayName: "Lagoon",
        allowsDelayedPaymentMethods: true,
      });
      if (init.error) {
        setProcessing(false);
        await dialog.alert(t("payment.title"), init.error.message);
        return;
      }
      const present = await stripe.presentPaymentSheet();
      if (present.error) {
        setProcessing(false);
        await dialog.alert(t("payment.title"), present.error.message);
        return;
      }
      paymentIntentId = paymentIntent.payment_intent_id ?? null;
      amountCents = paymentIntent.amount_cents ?? null;
      platformFeeCents = paymentIntent.platform_fee_cents ?? null;
    }

    const qrToken = `BK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        guest_id: user.id,
        service_id: serviceId,
        slot_start: slotStart,
        slot_end: slotEnd,
        people_count: peopleCount,
        qr_token: qrToken,
        payment_intent_id: paymentIntentId,
        payment_status: method === "card" ? "paid" : "cash",
        amount_cents: amountCents ?? (priceEur != null ? Math.round(priceEur * 100) : null),
        platform_fee_cents: platformFeeCents,
        currency: "eur",
      })
      .select("id")
      .single();

    setProcessing(false);

    if (error) {
      await dialog.alert(t("payment.title"), error.message);
      return;
    }

    router.replace({
      pathname: "/(tabs)/guest/BookingConfirmation",
      params: { bookingId: data.id, qrToken, destination, timeslot, people, microservice, selectedHour },
    });
  };

  const displayTime = selectedHour ?? timeslot ?? "-";
  const displayPeople = people ?? "1";

  return (
    <View style={styles.screen}>

      {/* Fixed header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: headerColor }]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/guest")}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("payment.title")}</Text>
      </View>

      {/* Scrollable content */}
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 64 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Service name */}
        <View style={styles.section}>
          <Text style={styles.serviceName}>{microservice ?? "-"}</Text>
        </View>
        <View style={styles.divider} />

        {/* Details */}
        <View style={styles.section}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{destination ?? "-"}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{displayTime}</Text>
          </View>
          <View style={[styles.infoRow, { marginBottom: 0 }]}>
            <MaterialCommunityIcons name="account-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{displayPeople}</Text>
          </View>
        </View>
        <View style={styles.divider} />

        {/* Price */}
        <View style={[styles.section, styles.priceRow]}>
          <Text style={styles.priceLabel}>Totale</Text>
          <Text style={styles.priceValue}>
            {loadingPrice ? "…" : `€${(priceEur ?? 0).toFixed(2)}`}
          </Text>
        </View>
        <View style={styles.divider} />

        {/* Payment method */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t("payment.chooseMethod")}</Text>

          <TouchableOpacity
            style={[styles.methodRow, method === "card" && styles.methodRowSelected]}
            onPress={() => setMethod("card")}
          >
            <MaterialCommunityIcons
              name="credit-card-outline"
              size={22}
              color={method === "card" ? colors.warmAccent : colors.textSecondary}
            />
            <View style={styles.methodText}>
              <Text style={styles.methodLabel}>{t("payment.methodCard")}</Text>
              <Text style={styles.methodHint}>{t("payment.availableNow")}</Text>
            </View>
            <View style={[styles.radio, method === "card" && styles.radioSelected]}>
              {method === "card" && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodRow, method === "cash" && styles.methodRowSelected]}
            onPress={() => setMethod("cash")}
          >
            <MaterialCommunityIcons
              name="cash"
              size={22}
              color={method === "cash" ? colors.warmAccent : colors.textSecondary}
            />
            <View style={styles.methodText}>
              <Text style={styles.methodLabel}>{t("payment.methodCash")}</Text>
              <Text style={styles.methodHint}>{t("payment.availableNow")}</Text>
            </View>
            <View style={[styles.radio, method === "cash" && styles.radioSelected]}>
              {method === "cash" && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Fixed pay button */}
      <View style={[styles.bookBar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity
          style={[styles.payButton, processing && styles.payButtonDisabled]}
          onPress={handlePay}
          disabled={processing}
        >
          <Text style={styles.payButtonText}>
            {processing ? t("payment.processing") : t("payment.payNow")}
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}
