import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useI18n } from "../../lib/i18n";
import { colors } from "../../lib/theme";
import { useAppDialog } from "../../components/AppDialogProvider";

export default function SignIn() {
  const router = useRouter();
  const { t } = useI18n();
  const dialog = useAppDialog();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const handleSignIn = async () => {
    if (!supabase) {
      await dialog.alert(
        t("auth.signInTitle"),
        "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY."
      );
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      await dialog.alert(t("auth.signInTitle"), error.message);
      return;
    }
    router.replace("/(tabs)/guest");
  };

  const handleForgotPassword = async () => {
    if (!supabase) {
      await dialog.alert(
        t("auth.signInTitle"),
        "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY."
      );
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      await dialog.alert(t("auth.resetPasswordTitle"), t("auth.resetPasswordEnterEmail"));
      return;
    }

    setResettingPassword(true);
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);
    setResettingPassword(false);
    if (error) {
      await dialog.alert(t("auth.resetPasswordTitle"), error.message);
      return;
    }
    await dialog.alert(t("auth.resetPasswordTitle"), t("auth.resetPasswordSent"));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("auth.signInTitle")}</Text>
      <Text style={styles.subtitle}>{t("auth.signInSubtitle")}</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder={t("auth.email")}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder={t("auth.password")}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Pressable
          style={[styles.primaryButton, loading && styles.disabled]}
          onPress={handleSignIn}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? t("auth.loading") : t("auth.signInAction")}
          </Text>
        </Pressable>
        <Pressable
          onPress={handleForgotPassword}
          disabled={resettingPassword}
          style={styles.secondaryAction}
        >
          <Text style={styles.link}>
            {resettingPassword
              ? t("auth.loading")
              : t("auth.forgotPasswordAction")}
          </Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t("auth.noAccount")}</Text>
        <Pressable onPress={() => router.push("/(auth)/sign-up")}>
          <Text style={styles.link}>{t("auth.signUpAction")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenBackground,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: colors.textSecondary,
  },
  form: {
    marginTop: 32,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  primaryButton: {
    backgroundColor: colors.textPrimary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.7,
  },
  footer: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerText: {
    color: colors.textSecondary,
  },
  link: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  secondaryAction: {
    alignSelf: "flex-start",
    marginTop: 4,
  },
});
