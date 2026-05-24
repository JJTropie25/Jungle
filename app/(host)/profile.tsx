import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useI18n } from "../../lib/i18n";
import { colors } from "../../lib/theme";
import { useAuthState } from "../../lib/auth";
import { useAppDialog } from "../../components/AppDialogProvider";
import { supabase } from "../../lib/supabase";
import TabTopNotch from "../../components/TabTopNotch";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import { createAccountLink, createConnectedAccount, getStripeReturnUrl } from "../../lib/stripe";

WebBrowser.maybeCompleteAuthSession();

export default function HostProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const dialog = useAppDialog();
  const { user } = useAuthState();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [hostStatus, setHostStatus] = useState<any>(null);
  const [activating, setActivating] = useState(false);

  const handleLogout = async () => {
    if (!supabase) {
      await dialog.alert(
        t("profile.logout"),
        "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY."
      );
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      await dialog.alert(t("profile.logout"), error.message);
      return;
    }
    router.replace("/(tabs)/guest");
  };

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      if (!supabase || !user) {
        setAvatarUrl(null);
        return () => {
          isMounted = false;
        };
      }
      supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (!isMounted) return;
          setAvatarUrl(data?.avatar_url ?? null);
        });
      supabase
        .from("hosts")
        .select(
          "id, stripe_account_id, stripe_onboarding_complete, stripe_charges_enabled, stripe_payouts_enabled"
        )
        .eq("guest_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (!isMounted) return;
          setHostStatus(data ?? null);
        });
      return () => {
        isMounted = false;
      };
    }, [user])
  );

  const handleActivatePayments = async () => {
    if (!user) return;
    setActivating(true);
    // Ensure host has (or reuses) a connected account before generating onboarding link.
    const created = await createConnectedAccount();
    if (created.error) {
      setActivating(false);
      await dialog.alert("Payments", created.error);
      return;
    }
    const returnUrl = getStripeReturnUrl("/host-onboarding");
    const refreshUrl = getStripeReturnUrl("/host-onboarding");
    if (!returnUrl || !refreshUrl) {
      setActivating(false);
      await dialog.alert("Payments", "Missing Supabase URL.");
      return;
    }
    const link = await createAccountLink(returnUrl, refreshUrl);
    setActivating(false);
    if (link.error || !link.url) {
      await dialog.alert("Payments", link.error ?? "Could not start onboarding.");
      return;
    }
    await WebBrowser.openBrowserAsync(link.url);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <TabTopNotch />
      <View style={[styles.container, { paddingTop: insets.top + 58 }]}>
        <View style={styles.header}>
          <Image
            source={
              avatarUrl ? { uri: avatarUrl } : require("../../assets/images/icon.png")
            }
            style={styles.avatar}
          />
          <Text style={styles.username}>
            {user?.user_metadata?.username
              ? `@${user.user_metadata.username}`
              : user?.email
              ? user.email
              : "@guest"}
          </Text>
        </View>
        <View style={styles.actions}>
          <View style={styles.paymentCard}>
            <Text style={styles.paymentTitle}>{t("payments.title")}</Text>
            <Text style={styles.paymentBody}>
              {hostStatus?.stripe_onboarding_complete
                ? t("payments.active")
                : t("payments.inactive")}
            </Text>
            {!hostStatus?.stripe_onboarding_complete ? (
              <Pressable
                style={[styles.primaryButton, activating && styles.disabled]}
                onPress={handleActivatePayments}
                disabled={activating}
              >
                <Text style={styles.primaryButtonText}>
                  {activating ? t("auth.loading") : t("payments.activate")}
                </Text>
              </Pressable>
            ) : null}
          </View>
          <Pressable style={styles.primaryButton} onPress={() => router.replace("/(tabs)/guest")}>
            <Text style={styles.primaryButtonText}>{t("host.profile.switchGuest")}</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButton}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/profile/Edit",
                params: { returnTo: "host" },
              })
            }
          >
            <Text style={styles.secondaryButtonText}>{t("profile.editInfo")}</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => router.push("/(tabs)/profile/Language")}>
            <Text style={styles.secondaryButtonText}>{t("profile.changeLanguage")}</Text>
          </Pressable>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>{t("profile.logout")}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBackground },
  container: { flex: 1, alignItems: "center", justifyContent: "flex-start", paddingHorizontal: 24 },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  username: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.surface,
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  paymentCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  paymentTitle: {
    fontWeight: "700",
    color: colors.textPrimary,
  },
  paymentBody: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: colors.warmAccent,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  disabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: colors.background,
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: colors.surfaceSoft,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: colors.textPrimary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutButtonText: {
    color: colors.background,
    fontWeight: "700",
    fontSize: 16,
  },
});
