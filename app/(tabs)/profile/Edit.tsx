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
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useI18n } from "../../../lib/i18n";
import { supabase } from "../../../lib/supabase";
import { useAuthState } from "../../../lib/auth";
import { useEffect, useMemo, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as LegacyFileSystem from "expo-file-system/legacy";
import { Buffer } from "buffer";
import { useTheme } from "../../../lib/theme-context";
import { type ThemeColors } from "../../../lib/theme";
import { useAppDialog } from "../../../components/AppDialogProvider";

const HEADER_COLOR = "#4F9B9B";
const DANGER_COLOR = "#B94040";

const PREFIX_OPTIONS = [
  { code: "+1",   country: "US / Canada",    flag: "🇺🇸" },
  { code: "+7",   country: "Russia",          flag: "🇷🇺" },
  { code: "+20",  country: "Egypt",           flag: "🇪🇬" },
  { code: "+27",  country: "South Africa",    flag: "🇿🇦" },
  { code: "+30",  country: "Greece",          flag: "🇬🇷" },
  { code: "+31",  country: "Netherlands",     flag: "🇳🇱" },
  { code: "+32",  country: "Belgium",         flag: "🇧🇪" },
  { code: "+33",  country: "France",          flag: "🇫🇷" },
  { code: "+34",  country: "Spain",           flag: "🇪🇸" },
  { code: "+36",  country: "Hungary",         flag: "🇭🇺" },
  { code: "+39",  country: "Italy",           flag: "🇮🇹" },
  { code: "+40",  country: "Romania",         flag: "🇷🇴" },
  { code: "+41",  country: "Switzerland",     flag: "🇨🇭" },
  { code: "+43",  country: "Austria",         flag: "🇦🇹" },
  { code: "+44",  country: "United Kingdom",  flag: "🇬🇧" },
  { code: "+45",  country: "Denmark",         flag: "🇩🇰" },
  { code: "+46",  country: "Sweden",          flag: "🇸🇪" },
  { code: "+47",  country: "Norway",          flag: "🇳🇴" },
  { code: "+48",  country: "Poland",          flag: "🇵🇱" },
  { code: "+49",  country: "Germany",         flag: "🇩🇪" },
  { code: "+52",  country: "Mexico",          flag: "🇲🇽" },
  { code: "+54",  country: "Argentina",       flag: "🇦🇷" },
  { code: "+55",  country: "Brazil",          flag: "🇧🇷" },
  { code: "+56",  country: "Chile",           flag: "🇨🇱" },
  { code: "+61",  country: "Australia",       flag: "🇦🇺" },
  { code: "+62",  country: "Indonesia",       flag: "🇮🇩" },
  { code: "+63",  country: "Philippines",     flag: "🇵🇭" },
  { code: "+65",  country: "Singapore",       flag: "🇸🇬" },
  { code: "+66",  country: "Thailand",        flag: "🇹🇭" },
  { code: "+81",  country: "Japan",           flag: "🇯🇵" },
  { code: "+82",  country: "South Korea",     flag: "🇰🇷" },
  { code: "+84",  country: "Vietnam",         flag: "🇻🇳" },
  { code: "+86",  country: "China",           flag: "🇨🇳" },
  { code: "+90",  country: "Turkey",          flag: "🇹🇷" },
  { code: "+91",  country: "India",           flag: "🇮🇳" },
  { code: "+92",  country: "Pakistan",        flag: "🇵🇰" },
  { code: "+94",  country: "Sri Lanka",       flag: "🇱🇰" },
  { code: "+212", country: "Morocco",         flag: "🇲🇦" },
  { code: "+213", country: "Algeria",         flag: "🇩🇿" },
  { code: "+216", country: "Tunisia",         flag: "🇹🇳" },
  { code: "+234", country: "Nigeria",         flag: "🇳🇬" },
  { code: "+351", country: "Portugal",        flag: "🇵🇹" },
  { code: "+353", country: "Ireland",         flag: "🇮🇪" },
  { code: "+355", country: "Albania",         flag: "🇦🇱" },
  { code: "+358", country: "Finland",         flag: "🇫🇮" },
  { code: "+359", country: "Bulgaria",        flag: "🇧🇬" },
  { code: "+380", country: "Ukraine",         flag: "🇺🇦" },
  { code: "+385", country: "Croatia",         flag: "🇭🇷" },
  { code: "+386", country: "Slovenia",        flag: "🇸🇮" },
  { code: "+420", country: "Czech Republic",  flag: "🇨🇿" },
  { code: "+421", country: "Slovakia",        flag: "🇸🇰" },
  { code: "+966", country: "Saudi Arabia",    flag: "🇸🇦" },
  { code: "+971", country: "UAE",             flag: "🇦🇪" },
  { code: "+972", country: "Israel",          flag: "🇮🇱" },
  { code: "+977", country: "Nepal",           flag: "🇳🇵" },
  { code: "+880", country: "Bangladesh",      flag: "🇧🇩" },
];

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.screenBackground },

    header: {
      position: "absolute",
      top: 0, left: 0, right: 0,
      zIndex: 10,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
      backgroundColor: HEADER_COLOR,
    },
    headerBtn: {
      width: 36, height: 36, borderRadius: 18,
      alignItems: "center", justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      fontSize: 15, fontWeight: "700",
      fontFamily: "Baloo2_700Bold",
      color: "#fff",
    },

    content: { paddingHorizontal: 20 },
    section: { paddingVertical: 14 },
    divider: { height: 1, backgroundColor: c.divider },

    // Avatar row
    avatarSection: {
      flexDirection: "row",
      alignItems: "center",
      gap: 18,
      paddingVertical: 20,
    },
    avatarWrapper: {},
    avatar: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: c.surfaceSoft,
    },
    cameraBadge: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: HEADER_COLOR,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: c.screenBackground,
    },
    avatarMeta: { flex: 1 },
    avatarHint: {
      fontSize: 12,
      color: c.textSecondary,
      marginBottom: 6,
    },
    changePhotoText: {
      fontSize: 14,
      fontWeight: "700",
      color: HEADER_COLOR,
    },

    fieldLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: c.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 8,
    },
    input: {
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: c.surfaceSoft,
      color: c.textPrimary,
      fontSize: 15,
    },

    // Password row (input + eye toggle)
    passwordRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.surfaceSoft,
      borderRadius: 12,
    },
    passwordInput: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: c.textPrimary,
      fontSize: 15,
      backgroundColor: "transparent",
    },
    passwordEye: {
      paddingHorizontal: 14,
      paddingVertical: 10,
    },

    // Phone row
    phoneRow: { flexDirection: "row", gap: 10 },
    prefixBtn: {
      backgroundColor: c.surfaceSoft,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      minWidth: 86,
    },
    prefixBtnText: { color: c.textPrimary, fontWeight: "700", fontSize: 14 },
    phoneInput: { flex: 1 },

    // Buttons
    saveBtn: {
      backgroundColor: c.warmAccent,
      paddingVertical: 15,
      borderRadius: 12,
      alignItems: "center",
      marginBottom: 12,
    },
    saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700", fontFamily: "Baloo2_700Bold" },
    saveBtnDisabled: { opacity: 0.55 },
    logoutBtn: {
      borderWidth: 1.5,
      borderColor: DANGER_COLOR,
      paddingVertical: 15,
      borderRadius: 12,
      alignItems: "center",
    },
    logoutBtnText: { color: DANGER_COLOR, fontSize: 15, fontWeight: "700" },

    // Bottom-sheet prefix modal
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    modalSheet: {
      backgroundColor: c.screenBackground,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      paddingTop: 12,
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    modalHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
      alignSelf: "center",
      marginBottom: 16,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: "700",
      fontFamily: "Baloo2_700Bold",
      color: c.textPrimary,
    },
    prefixItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
    },
    prefixItemActive: {},
    prefixFlag: { fontSize: 18, width: 26 },
    prefixCode: {
      fontSize: 14,
      fontWeight: "700",
      color: c.textPrimary,
      width: 46,
    },
    prefixCodeActive: { color: HEADER_COLOR },
    prefixCountry: { flex: 1, fontSize: 14, color: c.textSecondary },
    prefixCountryActive: { color: c.textPrimary, fontWeight: "600" },
  });
}

export default function EditProfile() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const dialog = useAppDialog();
  const { user } = useAuthState();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const returnRoute = returnTo === "host" ? "/(host)/profile" : "/(tabs)/profile";
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phonePrefix, setPhonePrefix] = useState("+39");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [initialPhonePrefix, setInitialPhonePrefix] = useState("+39");
  const [initialPhoneNumber, setInitialPhoneNumber] = useState("");
  const [prefixOpen, setPrefixOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (user.user_metadata?.username) setUsername(user.user_metadata.username);
    if (user.email) setEmail(user.email);
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    if (!user) { setAvatarUrl(null); return; }
    if (user.user_metadata?.avatar_url) setAvatarUrl(user.user_metadata.avatar_url);
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
    return () => { isMounted = false; };
  }, [user]);

  const handlePickPhoto = async () => {
    if (!user || !supabase) {
      await dialog.alert(t("edit.changePhoto"), "Sign in and configure Supabase to upload a photo.");
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { await dialog.alert(t("edit.changePhoto"), "Permission denied."); return; }
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
      await dialog.alert(t("edit.changePhoto"), error?.message ?? t("edit.photoError"));
      return;
    }
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const inferredExt = asset.mimeType?.split("/").pop() || asset.fileName?.split(".").pop() || asset.uri.split(".").pop() || "jpg";
    const fileExt = inferredExt.toLowerCase();
    const version = Date.now();
    const filePath = `${user.id}/avatar-${version}.${fileExt}`;
    let error: { message: string } | null = null;
    if (Platform.OS === "web") {
      try {
        const webFile = (asset as any).file as File | undefined;
        const payload = webFile ?? (await (await fetch(asset.uri)).blob());
        const upload = await supabase.storage.from("avatars").upload(filePath, payload, { cacheControl: "3600", upsert: true, contentType: asset.mimeType ?? "image/jpeg" });
        error = upload.error;
      } catch (webError: any) {
        await dialog.alert(t("edit.changePhoto"), webError?.message ?? t("edit.photoError"));
        return;
      }
    } else {
      let fileBuffer: Uint8Array;
      try {
        const base64 = await LegacyFileSystem.readAsStringAsync(asset.uri, { encoding: "base64" });
        fileBuffer = Buffer.from(base64, "base64");
      } catch (nativeError: any) {
        await dialog.alert(t("edit.changePhoto"), nativeError?.message ?? t("edit.photoError"));
        return;
      }
      const upload = await supabase.storage.from("avatars").upload(filePath, fileBuffer, { cacheControl: "3600", upsert: true, contentType: asset.mimeType ?? "image/jpeg" });
      error = upload.error;
    }
    if (error) { await dialog.alert(t("edit.changePhoto"), error.message); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    if (data?.publicUrl) {
      setAvatarUrl(data.publicUrl);
      const { error: profileUpsertError } = await supabase.from("profiles").upsert({ id: user.id, avatar_url: data.publicUrl }, { onConflict: "id" });
      if (profileUpsertError) await dialog.alert(t("edit.changePhoto"), profileUpsertError.message);
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) { await dialog.alert(t("profile.logout"), error.message); return; }
    router.replace("/(auth)/sign-in");
  };

  const handleSave = async () => {
    if (!supabase) {
      await dialog.alert(t("edit.saveChanges"), "Supabase is not configured.");
      return;
    }
    if (!user) { router.replace("/(auth)/sign-in"); return; }
    const nextPhone = phoneNumber.trim();
    if (!phonePrefix || !nextPhone) { await dialog.alert(t("edit.saveChanges"), t("edit.phoneRequired")); return; }
    setSaving(true);
    const profileUpdates: { email?: string; data?: { username?: string } } = {};
    const nextEmail = email.trim();
    const nextUsername = username.trim();
    const nextPassword = password.trim();
    if (nextEmail && nextEmail !== user.email) profileUpdates.email = nextEmail;
    if (nextUsername && nextUsername !== user.user_metadata?.username) profileUpdates.data = { username: nextUsername };
    const hasProfileUpdates = Boolean(profileUpdates.email || profileUpdates.data);
    const hasPasswordUpdate = nextPassword.length > 0;
    const hasPhoneUpdates = phonePrefix !== initialPhonePrefix || nextPhone !== initialPhoneNumber;
    if (!hasProfileUpdates && !hasPasswordUpdate && !hasPhoneUpdates) {
      setSaving(false);
      router.replace(returnRoute as any);
      return;
    }
    if (hasProfileUpdates) {
      const { error: profileError } = await supabase.auth.updateUser(profileUpdates);
      if (profileError) { setSaving(false); await dialog.alert(t("edit.saveChanges"), profileError.message); return; }
    }
    if (hasPasswordUpdate) {
      const { error: passwordError } = await supabase.auth.updateUser({ password: nextPassword });
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
      const { error: phoneSaveError } = await supabase.from("profiles").upsert({ id: user.id, phone_country_code: phonePrefix, phone_number: nextPhone }, { onConflict: "id" });
      if (phoneSaveError) { setSaving(false); await dialog.alert(t("edit.saveChanges"), phoneSaveError.message); return; }
      setInitialPhonePrefix(phonePrefix);
      setInitialPhoneNumber(nextPhone);
    }
    setSaving(false);
    await dialog.alert(t("edit.saveChanges"), t("edit.saved"));
    router.replace(returnRoute as any);
  };

  const headerH = insets.top + 52;

  return (
    <View style={styles.screen}>

      {/* Fixed teal header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.replace(returnRoute as any)}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("edit.title")}</Text>
      </View>

      {/* Scrollable form */}
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: headerH + 8, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* Avatar row — tappable with camera badge, info on right */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickPhoto}>
            <Image
              source={avatarUrl ? { uri: avatarUrl } : require("../../../assets/images/icon.png")}
              style={styles.avatar}
            />
            <View style={styles.cameraBadge}>
              <MaterialCommunityIcons name="camera" size={13} color="#fff" />
            </View>
          </TouchableOpacity>
          <View style={styles.avatarMeta}>
            <Text style={styles.avatarHint}>Profile photo</Text>
            <TouchableOpacity onPress={handlePickPhoto}>
              <Text style={styles.changePhotoText}>{t("edit.changePhoto")}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.divider} />

        {/* Username */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>{t("edit.username")}</Text>
          <TextInput
            style={styles.input}
            placeholder={user?.user_metadata?.username ?? t("edit.username")}
            placeholderTextColor={colors.textMuted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>
        <View style={styles.divider} />

        {/* Email */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>{t("edit.email")}</Text>
          <TextInput
            style={styles.input}
            placeholder={user?.email ?? "email@example.com"}
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>
        <View style={styles.divider} />

        {/* Password with toggle */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>{t("edit.password")}</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.passwordEye}
              onPress={() => setShowPassword((v) => !v)}
            >
              <MaterialCommunityIcons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.divider} />

        {/* Phone */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>{t("edit.phoneNumber")}</Text>
          <View style={styles.phoneRow}>
            <TouchableOpacity style={styles.prefixBtn} onPress={() => setPrefixOpen(true)}>
              <Text style={styles.prefixBtnText}>{phonePrefix}</Text>
              <MaterialCommunityIcons name="chevron-down" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <TextInput
              style={[styles.input, styles.phoneInput]}
              placeholder="3331234567"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={(v) => setPhoneNumber(v.replace(/[^\d]/g, ""))}
            />
          </View>
        </View>
        <View style={styles.divider} />

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>
              {saving ? t("auth.loading") : t("edit.saveChanges")}
            </Text>
          </TouchableOpacity>
          {user ? (
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutBtnText}>{t("profile.logout")}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

      </ScrollView>

      {/* Country code bottom sheet */}
      <Modal
        transparent
        visible={prefixOpen}
        animationType="slide"
        onRequestClose={() => setPrefixOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPrefixOpen(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("edit.phonePrefix")}</Text>
              <Pressable onPress={() => setPrefixOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView
              style={{ maxHeight: 360 }}
              showsVerticalScrollIndicator={false}
            >
              {PREFIX_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.code}
                  style={styles.prefixItem}
                  onPress={() => { setPhonePrefix(opt.code); setPrefixOpen(false); }}
                >
                  <Text style={styles.prefixFlag}>{opt.flag}</Text>
                  <Text style={[styles.prefixCode, phonePrefix === opt.code && styles.prefixCodeActive]}>
                    {opt.code}
                  </Text>
                  <Text style={[styles.prefixCountry, phonePrefix === opt.code && styles.prefixCountryActive]}>
                    {opt.country}
                  </Text>
                  {phonePrefix === opt.code ? (
                    <MaterialCommunityIcons name="check" size={18} color={HEADER_COLOR} />
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}
