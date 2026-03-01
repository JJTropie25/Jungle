import { useState } from "react";
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

type PaymentMethod = "card" | "wallet" | "cash";

export default function Payment() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { user } = useAuthState();
  const dialog = useAppDialog();
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

  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [processing, setProcessing] = useState(false);

  const handlePay = async () => {
    if (!supabase) {
      await dialog.alert(t("payment.title"), "Supabase is not configured.");
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
    await new Promise((r) => setTimeout(r, 1200));

    const peopleCount = Number(people ?? 1) || 1;
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
      })
      .select("id")
      .single();

    setProcessing(false);

    if (error) {
      await dialog.alert(t("payment.title"), error.message);
      return;
    }

    const methodLabel =
      method === "card"
        ? t("payment.methodCard")
        : method === "wallet"
        ? t("payment.methodWallet")
        : "Pay in cash at the property";

    await dialog.alert(t("payment.successTitle"), t("payment.successDetail", { method: methodLabel }));

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
            Selected times: {selectedHour ?? "-"}
          </Text>
        </View>

        <View style={styles.methodColumn}>
          <TouchableOpacity
            activeOpacity={1}
            disabled
            style={[styles.methodCard, styles.methodCardDisabled]}
          >
            <MaterialCommunityIcons name="credit-card-outline" size={22} color={colors.textMuted} />
            <Text style={styles.methodTitle}>{t("payment.methodCard")}</Text>
            <Text style={styles.methodHintDisabled}>Coming soon</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={1}
            disabled
            style={[styles.methodCard, styles.methodCardDisabled]}
          >
            <MaterialCommunityIcons name="wallet-outline" size={22} color={colors.textMuted} />
            <Text style={styles.methodTitle}>{t("payment.methodWallet")}</Text>
            <Text style={styles.methodHintDisabled}>Coming soon</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodCard, method === "cash" && styles.methodCardSelected]}
            onPress={() => setMethod("cash")}
          >
            <MaterialCommunityIcons name="cash" size={22} color={colors.warmAccentDark} />
            <Text style={styles.methodTitle}>Pay in cash at the property</Text>
            <Text style={styles.methodHint}>Available now</Text>
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
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 8,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: colors.border,
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
  methodColumn: {
    gap: 10,
    marginBottom: 18,
  },
  methodCard: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border,
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
  methodCardDisabled: {
    opacity: 0.55,
    backgroundColor: colors.surface,
  },
  methodCardSelected: {
    borderColor: colors.warmAccent,
    backgroundColor: colors.warmSurface,
  },
  methodTitle: {
    fontWeight: "700",
    color: colors.textPrimary,
  },
  methodHint: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  methodHintDisabled: {
    color: colors.textMuted,
    fontSize: 12,
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
});
