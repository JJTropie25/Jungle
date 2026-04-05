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
  const options = [
    { code: "en", label: t("language.english"), flag: "🇬🇧" },
    { code: "it", label: t("language.italian"), flag: "🇮🇹" },
    { code: "es", label: t("language.spanish"), flag: "🇪🇸" },
    { code: "zh", label: t("language.chinese"), flag: "🇨🇳" },
    { code: "de", label: t("language.german"), flag: "🇩🇪" },
    { code: "fr", label: t("language.french"), flag: "🇫🇷" },
    { code: "ja", label: t("language.japanese"), flag: "🇯🇵" },
  ] as const;

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
          {options.map((option) => (
            <TouchableOpacity
              key={option.code}
              style={[
                styles.option,
                language === option.code && styles.optionSelected,
              ]}
              onPress={() => setLanguage(option.code)}
            >
              <Text
                style={[
                  styles.optionText,
                  language === option.code && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
              <Text
                style={[
                  styles.optionFlag,
                  language === option.code && styles.optionFlagSelected,
                ]}
              >
                {option.flag}
              </Text>
            </TouchableOpacity>
          ))}
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
    color: colors.surface,
    marginBottom: 16,
  },
  options: {
    gap: 12,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  optionFlag: {
    fontSize: 18,
  },
  optionFlagSelected: {
    color: colors.background,
  },
});
