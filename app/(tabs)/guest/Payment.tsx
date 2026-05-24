import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useI18n } from "../../../lib/i18n";
import { useAuthState } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { colors } from "../../../lib/theme";
import { useAppDialog } from "../../../components/AppDialogProvider";
import { createPaymentIntent } from "../../../lib/stripe";
import { useStripeClient } from "../../../lib/useStripeClient";

export default function Payment() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { user } = useAuthState();
  const dialog = useAppDialog();
  const stripe = useStripeClient();
  const {
    serviceId,
    slotStart,
    slotEnd,
    destination,
    timeslot,
    people,
    microservice,
    selectedHour,
  } = useLocalSearchParams<{
    serviceId?: string;
    slotStart?: string;
    slotEnd?: string;
    destination?: string;
    timeslot?: string;
    people?: string;
    microservice?: string;
    selectedHour?: string;
  }>();

  const [method, setMethod] = useState<"card" | "cash">("cash");
  const [processing, setProcessing] = useState(false);
  const [priceEur, setPriceEur] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadPrice = async () => {
      if (!supabase || !serviceId) return;
      setLoadingPrice(true);
      const { data } = await supabase
        .from("services")
        .select("price_eur")
        .eq("id", serviceId)
        .maybeSingle();
      if (!mounted) return;
      setPriceEur(Number(data?.price_eur ?? 0));
      setLoadingPrice(false);
    };
    loadPrice().catch(() => setLoadingPrice(false));
    return () => {
      mounted = false;
    };
  }, [serviceId]);

  const handlePay = async () => {
    if (!supabase) {
      await dialog.alert(t("payment.title"), t("payment.supabaseMissing"));
      return;
    }
    if (!user) {
      router.replace("/(auth)/sign-in");
      return;
    }
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
      // Price and platform fee are computed server-side in Stripe function.
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
    // Persist booking only after card confirmation (or immediately for cash method).
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

    const methodLabel =
      method === "card" ? t("payment.methodCard") : t("payment.methodCash");
    await dialog.alert(
      t("payment.successTitle"),
      t("payment.successDetail", { method: methodLabel })
    );

    router.replace({
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/guest"))}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.title}>{t("payment.title")}</Text>
        <Text style={styles.subtitle}>{t("payment.chooseMethod")}</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{microservice ?? "-"}</Text>
          <Text style={styles.summaryLine}>{destination ?? "-"}</Text>
          <Text style={styles.summaryLine}>{timeslot ?? "-"}</Text>
          <View style={styles.summaryPeople}>
            <MaterialCommunityIcons
              name="account-group"
              size={16}
              color={colors.textPrimary}
            />
            <Text style={styles.summaryPeopleText}>{people ?? "-"}</Text>
          </View>
          <Text style={styles.summaryLine}>
            {t("payment.selectedTime", { time: selectedHour ?? "-" })}
          </Text>
          <Text style={styles.summaryLine}>
            {loadingPrice ? t("payment.loadingPrice") : `€${(priceEur ?? 0).toFixed(2)}`}
          </Text>
        </View>

        <View style={styles.methodColumn}>
          <TouchableOpacity
            style={[styles.methodCard, method === "card" && styles.methodCardSelected]}
            onPress={() => setMethod("card")}
          >
            <MaterialCommunityIcons name="credit-card-outline" size={22} color={colors.textPrimary} />
            <Text style={styles.methodTitle}>{t("payment.methodCard")}</Text>
            <Text style={styles.methodHint}>{t("payment.availableNow")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodCard, method === "cash" && styles.methodCardSelected]}
            onPress={() => setMethod("cash")}
          >
            <MaterialCommunityIcons name="cash" size={22} color={colors.warmAccentDark} />
            <Text style={styles.methodTitle}>{t("payment.methodCash")}</Text>
            <Text style={styles.methodHint}>{t("payment.availableNow")}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.payButton, processing && styles.payButtonDisabled]}
          onPress={handlePay}
          disabled={processing}
        >
          <Text style={styles.payButtonText}>
            {processing ? t("payment.processing") : t("payment.payNow")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBackground },
  container: { padding: 16, paddingBottom: 24 },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.surface,
  },
  subtitle: {
    marginTop: 8,
    color: colors.surface,
    marginBottom: 14,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  summaryTitle: {
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  summaryLine: {
    color: colors.textSecondary,
    marginBottom: 2,
  },
  summaryPeople: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  summaryPeopleText: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
  payButton: {
    backgroundColor: colors.textPrimary,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
  },
  payButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  payButtonText: {
    color: colors.background,
    fontWeight: "700",
  },
  methodColumn: {
    gap: 10,
    marginBottom: 18,
  },
  methodCard: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: colors.surfaceSoft,
    padding: 14,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  methodCardSelected: {
    borderColor: colors.warmAccent,
    backgroundColor: colors.warmSurface,
    borderWidth: 1,
  },
  methodTitle: {
    fontWeight: "700",
    color: colors.textPrimary,
  },
  methodHint: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});



