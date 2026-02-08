import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useI18n } from "../../../lib/i18n";
import { useEffect, useState } from "react";
import { useAuthState } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import QRCode from "react-native-qrcode-svg";
import { colors } from "../../../lib/theme";

export default function ManageBooking() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
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
  const [canceling, setCanceling] = useState(false);
  const { user } = useAuthState();

  useEffect(() => {
    let isMounted = true;
    if (!supabase || !bookingId) return;
    supabase
      .from("bookings")
      .select("qr_token")
      .eq("id", bookingId)
      .single()
      .then(({ data }) => {
        if (!isMounted) return;
        if (data?.qr_token) setToken(data.qr_token);
      });
    return () => {
      isMounted = false;
    };
  }, [bookingId]);

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
          onPress={() => {
            if (from === "bookings") {
              router.replace("/(tabs)/bookings");
            } else {
              router.back();
            }
          }}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.thankYou}>{t("booking.manageTitle")}</Text>

        {/* Service recap card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{microservice}</Text>
          <View style={styles.summaryLine}>
            <Text style={styles.summaryItem}>{microservice ?? "-"}</Text>
            <Text style={styles.summarySep}>|</Text>
            <Text style={styles.summaryItem}>{destination ?? "-"}</Text>
            <Text style={styles.summarySep}>|</Text>
            <Text style={styles.summaryItem}>{timeslot ?? "-"}</Text>
            <Text style={styles.summarySep}>|</Text>
            <View style={styles.summaryPeople}>
              <MaterialCommunityIcons name="account-group" size={16} color={colors.textPrimary} />
              <Text style={styles.summaryPeopleText}>{people ?? "-"}</Text>
            </View>
          </View>
        </View>

        {/* QR code card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("booking.accessQr")}</Text>
          <View style={styles.qrMock}>
            {token ? <QRCode value={token} size={160} /> : <Text>{t("booking.qrCode")}</Text>}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.danger]}
            onPress={() => {
              if (!bookingId || !supabase) {
                Alert.alert(
                  t("booking.cancel"),
                  "Unable to cancel this booking."
                );
                return;
              }
              Alert.alert(t("booking.cancel"), t("booking.cancelConfirm"), [
                { text: t("booking.cancelNo"), style: "cancel" },
                {
                  text: t("booking.cancelYes"),
                  style: "destructive",
                  onPress: async () => {
                    setCanceling(true);
                    try {
                      if (!user) {
                        setCanceling(false);
                        Alert.alert(t("booking.cancel"), t("bookings.signIn") || "Please sign in to cancel bookings.");
                        return;
                      }

                      // fetch booking owner to verify permissions (safe check)
                      const idToUse = bookingId && /^[0-9]+$/.test(String(bookingId)) ? Number(bookingId) : bookingId;
                      console.log("ManageBooking: attempting delete", { bookingId: idToUse, userId: user.id });
                      const { data: fetchData, error: fetchErr } = await supabase
                        .from("bookings")
                        .select("guest_id")
                        .eq("id", idToUse as any)
                        .maybeSingle();
                      if (fetchErr) {
                        setCanceling(false);
                        console.warn("ManageBooking: fetch owner error", fetchErr);
                        Alert.alert(t("booking.cancel"), fetchErr.message);
                        return;
                      }
                      if (!fetchData || fetchData.guest_id !== user.id) {
                        setCanceling(false);
                        console.warn("ManageBooking: permission denied or booking not found", fetchData);
                        Alert.alert(t("booking.cancel"), t("booking.cancelNotAllowed") || "You are not allowed to cancel this booking.");
                        return;
                      }

                      const { data, error } = await supabase
                        .from("bookings")
                        .delete()
                        .eq("id", idToUse as any);
                      setCanceling(false);
                      console.log("ManageBooking: delete result", { data, error });
                      if (error) {
                        Alert.alert(t("booking.cancel"), error.message);
                        return;
                      }
                      if (!data || (Array.isArray(data) && data.length === 0)) {
                        Alert.alert(t("booking.cancel"), t("booking.cancelFailed") || "No booking was deleted.");
                        return;
                      }
                      router.replace("/(tabs)/bookings");
                    } catch (e: any) {
                      setCanceling(false);
                      Alert.alert(t("booking.cancel"), e?.message || String(e));
                    }
                  },
                },
              ]);
            }}
            disabled={canceling}
          >
            <Text style={styles.actionTextLight}>{t("booking.cancel")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>{t("booking.contact")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, paddingBottom: 24 },
  thankYou: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
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
  qrMock: {
    height: 180,
    backgroundColor: colors.border,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    padding: 14,
    backgroundColor: colors.surfaceSoft,
    borderRadius: 10,
    alignItems: "center",
  },
  actionText: {
    fontWeight: "600",
    color: colors.textPrimary,
  },
  danger: {
    backgroundColor: colors.textPrimary,
  },
  actionTextLight: {
    fontWeight: "600",
    color: colors.background,
  },
});
