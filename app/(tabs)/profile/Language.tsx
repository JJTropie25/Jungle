import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useI18n } from "../../../lib/i18n";
import { colors } from "../../../lib/theme";

export default function Language() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, setLanguage, t } = useI18n();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/(tabs)/profile")}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.title}>{t("language.title")}</Text>

        <View style={styles.options}>
          <TouchableOpacity
            style={[
              styles.option,
              language === "en" && styles.optionSelected,
            ]}
            onPress={() => setLanguage("en")}
          >
            <Text
              style={[
                styles.optionText,
                language === "en" && styles.optionTextSelected,
              ]}
            >
              {t("language.english")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.option,
              language === "it" && styles.optionSelected,
            ]}
            onPress={() => setLanguage("it")}
          >
            <Text
              style={[
                styles.optionText,
                language === "it" && styles.optionTextSelected,
              ]}
            >
              {t("language.italian")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.option,
              language === "es" && styles.optionSelected,
            ]}
            onPress={() => setLanguage("es")}
          >
            <Text
              style={[
                styles.optionText,
                language === "es" && styles.optionTextSelected,
              ]}
            >
              {t("language.spanish")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.option,
              language === "zh" && styles.optionSelected,
            ]}
            onPress={() => setLanguage("zh")}
          >
            <Text
              style={[
                styles.optionText,
                language === "zh" && styles.optionTextSelected,
              ]}
            >
              {t("language.chinese")}
            </Text>
          </TouchableOpacity>
        </View>
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
  options: {
    gap: 12,
  },
  option: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: colors.surfaceSoft,
  },
  optionSelected: {
    backgroundColor: colors.textPrimary,
  },
  optionText: {
    fontWeight: "600",
    color: colors.textPrimary,
  },
  optionTextSelected: {
    color: colors.background,
  },
});
