import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useI18n } from "../../../lib/i18n";

export default function EditProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/(tabs)/profile")}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#111827" />
        </TouchableOpacity>

        <Text style={styles.title}>{t("edit.title")}</Text>

        <View style={styles.avatarRow}>
          <Image
            source={require("../../../assets/images/icon.png")}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.photoButton}>
            <Text style={styles.photoButtonText}>{t("edit.changePhoto")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>{t("edit.username")}</Text>
          <TextInput style={styles.input} placeholder={t("edit.username")} />

          <Text style={styles.label}>{t("edit.email")}</Text>
          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>{t("edit.password")}</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.hostButton}>
          <Text style={styles.hostButtonText}>{t("edit.becomeHost")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.hostButton}
          onPress={() => router.replace("/(tabs)/profile")}
        >
          <Text style={styles.hostButtonText}>{t("edit.saveChanges")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  container: {
    paddingHorizontal: 24,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
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
    borderColor: "#E5E7EB",
  },
  photoButton: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  photoButtonText: {
    fontWeight: "600",
    color: "#111827",
  },
  label: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
  },
  hostButton: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  hostButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
