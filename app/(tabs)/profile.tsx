import { View, Text, StyleSheet, Image, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useI18n } from "../../lib/i18n";

export default function Profile() {
  const router = useRouter();
  const { t } = useI18n();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.avatar}
        />
        <Text style={styles.username}>@username</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push("/(tabs)/profile/Edit")}
        >
          <Text style={styles.primaryButtonText}>{t("profile.editInfo")}</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push("/(tabs)/profile/Language")}
        >
          <Text style={styles.secondaryButtonText}>
            {t("profile.changeLanguage")}
          </Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          onPress={() =>
            Alert.alert(t("profile.logout"), t("profile.logoutNotImplemented"))
          }
        >
          <Text style={styles.secondaryButtonText}>{t("profile.logout")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 48,
    paddingHorizontal: 24,
    backgroundColor: "#fff",
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
    borderColor: "#E5E7EB",
  },
  username: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
  },
});
