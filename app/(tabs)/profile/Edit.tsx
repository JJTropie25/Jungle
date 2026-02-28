import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
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

export default function EditProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const dialog = useAppDialog();
  const { user } = useAuthState();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    if (!supabase || !user) return;
    supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (!isMounted) return;
        if (data?.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
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
    const filePath = `avatars/${user.id}.${fileExt}`;
    let fileBuffer: Uint8Array;
    try {
      const base64 = await LegacyFileSystem.readAsStringAsync(asset.uri, {
        encoding: "base64",
      });
      fileBuffer = Buffer.from(base64, "base64");
    } catch (error: any) {
      await dialog.alert(
        t("edit.changePhoto"),
        error?.message ?? t("edit.photoError")
      );
      return;
    }
    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, fileBuffer, {
        cacheControl: "3600",
        upsert: true,
        contentType: asset.mimeType ?? "image/jpeg",
      });
    if (error) {
      await dialog.alert(t("edit.changePhoto"), error.message);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    if (data?.publicUrl) {
      setAvatarUrl(data.publicUrl);
      await supabase
        .from("profiles")
        .upsert({ id: user.id, avatar_url: data.publicUrl });
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
    setSaving(true);
    const updates: {
      email?: string;
      password?: string;
      data?: { username?: string };
    } = {};
    if (email && email !== user.email) updates.email = email.trim();
    if (password) updates.password = password;
    if (username && username !== user.user_metadata?.username) {
      updates.data = { username: username.trim() };
    }
    if (!updates.email && !updates.password && !updates.data) {
      setSaving(false);
      router.replace("/(tabs)/profile");
      return;
    }
    const { error } = await supabase.auth.updateUser(updates);
    setSaving(false);
    if (error) {
      await dialog.alert(t("edit.saveChanges"), error.message);
      return;
    }
    await dialog.alert(t("edit.saveChanges"), t("edit.saved"));
    router.replace("/(tabs)/profile");
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}> 
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/(tabs)/profile")}
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
          />
        </View>

        <TouchableOpacity style={styles.hostButton}>
          <Text style={styles.hostButtonText}>{t("edit.becomeHost")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.hostButton} onPress={handleSave}>
          <Text style={styles.hostButtonText}>
            {saving ? t("auth.loading") : t("edit.saveChanges")}
          </Text>
        </TouchableOpacity>
      </View>
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
});
