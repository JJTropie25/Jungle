import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useI18n } from "../../lib/i18n";
import { colors } from "../../lib/theme";
import { useAppDialog } from "../../components/AppDialogProvider";

export default function SignUp() {
  const router = useRouter();
  const { t } = useI18n();
  const dialog = useAppDialog();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("+39");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [prefixOpen, setPrefixOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const PREFIX_OPTIONS = ["+39", "+33", "+34", "+44", "+49", "+1"];

  const handleSignUp = async () => {
    if (!supabase) {
      await dialog.alert(
        t("auth.signUpTitle"),
        "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY."
      );
      return;
    }
    if (!phonePrefix || !phoneNumber.trim()) {
      await dialog.alert(t("auth.signUpTitle"), t("edit.phoneRequired"));
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          username: username.trim(),
          phone_country_code: phonePrefix,
          phone_number: phoneNumber.trim(),
        },
      },
    });
    setLoading(false);
    if (error) {
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("already") && msg.includes("registered")) {
        await dialog.alert(t("auth.signUpTitle"), t("auth.emailAlreadyRegistered"));
        return;
      }
      await dialog.alert(t("auth.signUpTitle"), error.message);
      return;
    }
    if (data?.user?.id) {
      await supabase
        .from("profiles")
        .upsert(
          {
            id: data.user.id,
            phone_country_code: phonePrefix,
            phone_number: phoneNumber.trim(),
          },
          { onConflict: "id" }
        );
    }
    await dialog.alert(t("auth.checkEmail"), t("auth.checkEmailDetail"));
    router.replace("/(auth)/sign-in");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("auth.signUpTitle")}</Text>
      <Text style={styles.subtitle}>{t("auth.signUpSubtitle")}</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
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
        <Text style={styles.phoneLabel}>{t("edit.phoneNumber")}</Text>
        <View style={styles.phoneRow}>
          <TouchableOpacity style={styles.prefixButton} onPress={() => setPrefixOpen(true)}>
            <Text style={styles.prefixButtonText}>{phonePrefix}</Text>
          </TouchableOpacity>
          <TextInput
            style={[styles.input, styles.phoneInput]}
            placeholder="3331234567"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={(value) => setPhoneNumber(value.replace(/[^\d]/g, ""))}
          />
        </View>
        <Pressable
          style={[styles.primaryButton, loading && styles.disabled]}
          onPress={handleSignUp}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? t("auth.loading") : t("auth.signUpAction")}
          </Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t("auth.haveAccount")}</Text>
        <Pressable onPress={() => router.push("/(auth)/sign-in")}>
          <Text style={styles.link}>{t("auth.signInAction")}</Text>
        </Pressable>
      </View>
      <Modal transparent visible={prefixOpen} animationType="fade" onRequestClose={() => setPrefixOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPrefixOpen(false)} />
          <View style={styles.modalCard}>
            {PREFIX_OPTIONS.map((prefix) => (
              <TouchableOpacity
                key={prefix}
                style={[styles.prefixItem, phonePrefix === prefix && styles.prefixItemActive]}
                onPress={() => {
                  setPhonePrefix(prefix);
                  setPrefixOpen(false);
                }}
              >
                <Text style={styles.prefixItemText}>{prefix}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
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
  phoneLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  prefixButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === "web" ? 13 : 12,
    backgroundColor: colors.background,
    width: 88,
    alignItems: "center",
  },
  prefixButtonText: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  phoneInput: {
    flex: 1,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  prefixItem: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  prefixItemActive: {
    backgroundColor: colors.surfaceSoft,
  },
  prefixItemText: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
});
