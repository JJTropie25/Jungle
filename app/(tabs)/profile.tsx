import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useI18n } from "../../lib/i18n";
import { supabase } from "../../lib/supabase";
import { useAuthState } from "../../lib/auth";
import { useEffect, useState } from "react";
import { colors } from "../../lib/theme";
import { useAppDialog } from "../../components/AppDialogProvider";
import TabTopNotch from "../../components/TabTopNotch";

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const dialog = useAppDialog();
  const { user } = useAuthState();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
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
    await dialog.alert(t("profile.logout"), t("profile.logoutSuccess"));
  };

  useEffect(() => {
    let isMounted = true;
    if (!supabase || !user) return;
    supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (!isMounted) return;
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      });
    return () => {
      isMounted = false;
    };
  }, [user]);
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
          {user ? (
            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push("/(tabs)/profile/Edit")}
            >
              <Text style={styles.primaryButtonText}>{t("profile.editInfo")}</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push("/(auth)/sign-in")}
            >
              <Text style={styles.primaryButtonText}>{t("auth.signInAction")}</Text>
            </Pressable>
          )}
          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.push("/(tabs)/profile/Language")}
          >
            <Text style={styles.secondaryButtonText}>
              {t("profile.changeLanguage")}
            </Text>
          </Pressable>
          {user ? (
            <Pressable style={styles.secondaryButton} onPress={handleLogout}>
              <Text style={styles.secondaryButtonText}>{t("profile.logout")}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 24,
  },
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
    color: colors.textPrimary,
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.textPrimary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: colors.surfaceSoft,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
});
