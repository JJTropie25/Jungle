import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useI18n } from "../../../lib/i18n";
import { supabase } from "../../../lib/supabase";
import { useAuthState } from "../../../lib/auth";
import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as LegacyFileSystem from "expo-file-system/legacy";
import { Buffer } from "buffer";
import { colors } from "../../../lib/theme";
import { useAppDialog } from "../../../components/AppDialogProvider";

const PREFIX_OPTIONS = ["+39", "+33", "+34", "+44", "+49", "+1"];

export default function EditProfile() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const dialog = useAppDialog();
  const { user } = useAuthState();
  const returnRoute = returnTo === "host" ? "/(host)/profile" : "/(tabs)/profile";
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("+39");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [initialPhonePrefix, setInitialPhonePrefix] = useState("+39");
  const [initialPhoneNumber, setInitialPhoneNumber] = useState("");
  const [prefixOpen, setPrefixOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (user.user_metadata?.username) {
      setUsername(user.user_metadata.username);
    }
    if (user.email) {
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    if (!user) {
      setAvatarUrl(null);
      return;
    }
    if (user.user_metadata?.avatar_url) {
      setAvatarUrl(user.user_metadata.avatar_url);
    }
    if (!supabase) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!isMounted) return;
        const row = (data as any) ?? {};
        setAvatarUrl(row.avatar_url ?? user.user_metadata?.avatar_url ?? null);
        const loadedPrefix = row.phone_country_code ?? "+39";
        const loadedPhone = row.phone_number ?? "";
        setPhonePrefix(loadedPrefix);
        setPhoneNumber(loadedPhone);
        setInitialPhonePrefix(loadedPrefix);
        setInitialPhoneNumber(loadedPhone);
      });
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handlePickPhoto = async () => {
    if (!user || !supabase) {
      await dialog.alert(
        t("edit.changePhoto"),
        "Sign in and configure Supabase to upload a photo."
      );
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      await dialog.alert(t("edit.changePhoto"), "Permission denied.");
      return;
    }
    let result: ImagePicker.ImagePickerResult;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
        ...(Platform.OS === "android" ? { legacy: true } : {}),
      });
    } catch (error: any) {
      await dialog.alert(
        t("edit.changePhoto"),
        error?.message ?? t("edit.photoError")
      );
      return;
    }
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const inferredExt =
      asset.mimeType?.split("/").pop() ||
      asset.fileName?.split(".").pop() ||
      asset.uri.split(".").pop() ||
      "jpg";
    const fileExt = inferredExt.toLowerCase();
    const version = Date.now();
    const filePath = `${user.id}/avatar-${version}.${fileExt}`;
    let error: { message: string } | null = null;
    if (Platform.OS === "web") {
      try {
        const webFile = (asset as any).file as File | undefined;
        const payload = webFile ?? (await (await fetch(asset.uri)).blob());
        const upload = await supabase.storage
          .from("avatars")
          .upload(filePath, payload, {
            cacheControl: "3600",
            upsert: true,
            contentType: asset.mimeType ?? "image/jpeg",
          });
        error = upload.error;
      } catch (webError: any) {
        await dialog.alert(
          t("edit.changePhoto"),
          webError?.message ?? t("edit.photoError")
        );
        return;
      }
    } else {
      let fileBuffer: Uint8Array;
      try {
        const base64 = await LegacyFileSystem.readAsStringAsync(asset.uri, {
          encoding: "base64",
        });
        fileBuffer = Buffer.from(base64, "base64");
      } catch (nativeError: any) {
        await dialog.alert(
          t("edit.changePhoto"),
          nativeError?.message ?? t("edit.photoError")
        );
        return;
      }
      const upload = await supabase.storage
        .from("avatars")
        .upload(filePath, fileBuffer, {
          cacheControl: "3600",
          upsert: true,
          contentType: asset.mimeType ?? "image/jpeg",
        });
      error = upload.error;
    }
    if (error) {
      await dialog.alert(t("edit.changePhoto"), error.message);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    if (data?.publicUrl) {
      setAvatarUrl(data.publicUrl);
      const { error: profileUpsertError } = await supabase
        .from("profiles")
        .upsert({ id: user.id, avatar_url: data.publicUrl }, { onConflict: "id" });
      if (profileUpsertError) {
        await dialog.alert(t("edit.changePhoto"), profileUpsertError.message);
      }
    }
  };

  const handleSave = async () => {
    if (!supabase) {
      await dialog.alert(
        t("edit.saveChanges"),
        "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY."
      );
      return;
    }
    if (!user) {
      router.replace("/(auth)/sign-in");
      return;
    }
    const nextPhone = phoneNumber.trim();
    if (!phonePrefix || !nextPhone) {
      await dialog.alert(t("edit.saveChanges"), t("edit.phoneRequired"));
      return;
    }
    setSaving(true);
    const profileUpdates: {
      email?: string;
      data?: { username?: string };
    } = {};
    const nextEmail = email.trim();
    const nextUsername = username.trim();
    const nextPassword = password.trim();

    if (nextEmail && nextEmail !== user.email) profileUpdates.email = nextEmail;
    if (nextUsername && nextUsername !== user.user_metadata?.username) {
      profileUpdates.data = { username: nextUsername };
    }
    const hasProfileUpdates = Boolean(profileUpdates.email || profileUpdates.data);
    const hasPasswordUpdate = nextPassword.length > 0;
    const hasPhoneUpdates =
      phonePrefix !== initialPhonePrefix || nextPhone !== initialPhoneNumber;

    if (!hasProfileUpdates && !hasPasswordUpdate && !hasPhoneUpdates) {
      setSaving(false);
      router.replace(returnRoute as any);
      return;
    }

    if (hasProfileUpdates) {
      const { error: profileError } = await supabase.auth.updateUser(profileUpdates);
      if (profileError) {
        setSaving(false);
        await dialog.alert(t("edit.saveChanges"), profileError.message);
        return;
      }
    }

    if (hasPasswordUpdate) {
      const { error: passwordError } = await supabase.auth.updateUser({
        password: nextPassword,
      });
      if (passwordError) {
        if (passwordError.message.includes("different from the old password")) {
          setPassword("");
        } else {
          setSaving(false);
          await dialog.alert(t("edit.saveChanges"), passwordError.message);
          return;
        }
      }
    }

    if (hasPhoneUpdates) {
      const { error: phoneSaveError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            phone_country_code: phonePrefix,
            phone_number: nextPhone,
          },
          { onConflict: "id" }
        );
      if (phoneSaveError) {
        setSaving(false);
        await dialog.alert(t("edit.saveChanges"), phoneSaveError.message);
        return;
      }
      setInitialPhonePrefix(phonePrefix);
      setInitialPhoneNumber(nextPhone);
    }

    setSaving(false);
    await dialog.alert(t("edit.saveChanges"), t("edit.saved"));
    router.replace(returnRoute as any);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}> 
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace(returnRoute as any)}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.title}>{t("edit.title")}</Text>

        <View style={styles.avatarRow}>
          <Image
            source={
              avatarUrl ? { uri: avatarUrl } : require("../../../assets/images/icon.png")
            }
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.photoButton} onPress={handlePickPhoto}>
            <Text style={styles.photoButtonText}>{t("edit.changePhoto")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>{t("edit.username")}</Text>
          <TextInput
            style={styles.input}
            placeholder={user?.user_metadata?.username ?? t("edit.username")}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <Text style={styles.label}>{t("edit.email")}</Text>
          <TextInput
            style={styles.input}
            placeholder={user?.email ?? "email@example.com"}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>{t("edit.password")}</Text>
          <TextInput
            style={styles.input}
            placeholder="********"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoComplete="new-password"
            textContentType="newPassword"
            importantForAutofill="no"
          />

          <Text style={styles.label}>{t("edit.phoneNumber")}</Text>
          <View style={styles.phoneRow}>
            <TouchableOpacity style={styles.prefixButtonInline} onPress={() => setPrefixOpen(true)}>
              <Text style={styles.prefixButtonText}>{phonePrefix}</Text>
              <MaterialCommunityIcons name="chevron-down" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
            <TextInput
              style={[styles.input, styles.phoneInput]}
              placeholder="3331234567"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={(value) => setPhoneNumber(value.replace(/[^\d]/g, ""))}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.hostButton} onPress={handleSave}>
          <Text style={styles.hostButtonText}>
            {saving ? t("auth.loading") : t("edit.saveChanges")}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal transparent visible={prefixOpen} animationType="fade" onRequestClose={() => setPrefixOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPrefixOpen(false)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t("edit.phonePrefix")}</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBackground },
  container: {
    paddingHorizontal: 24,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 16,
  },
  form: {
    gap: 10,
    marginBottom: 24,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: colors.border,
  },
  photoButton: {
    backgroundColor: colors.surfaceSoft,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  photoButtonText: {
    fontWeight: "600",
    color: colors.textPrimary,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: colors.background,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  prefixButtonInline: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: colors.background,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: 92,
  },
  prefixButtonText: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  phoneInput: {
    flex: 1,
  },
  hostButton: {
    backgroundColor: colors.textPrimary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  hostButtonText: {
    color: colors.background,
    fontSize: 16,
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
  modalTitle: {
    color: colors.textPrimary,
    fontWeight: "700",
    marginBottom: 4,
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
