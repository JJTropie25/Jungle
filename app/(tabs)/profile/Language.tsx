import { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useI18n } from "../../../lib/i18n";
import { useTheme } from "../../../lib/theme-context";
import { type ThemeColors } from "../../../lib/theme";

const HEADER_COLOR = "#4F9B9B";

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

    content: {
      paddingHorizontal: 20,
      gap: 10,
    },

    option: {
      paddingVertical: 15,
      paddingHorizontal: 18,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: c.surfaceSoft,
    },
    optionActive: {
      backgroundColor: HEADER_COLOR,
    },
    optionText: {
      fontWeight: "600",
      fontSize: 15,
      color: c.textPrimary,
    },
    optionTextActive: {
      color: "#fff",
    },
    optionRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    optionFlag: { fontSize: 20 },
  });
}

export default function Language() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, setLanguage, t } = useI18n();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const headerH = insets.top + 52;

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
    <View style={styles.screen}>

      {/* Fixed teal header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.replace("/(tabs)/profile")}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("language.title")}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: headerH + 16, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {options.map((option) => (
          <TouchableOpacity
            key={option.code}
            style={[styles.option, language === option.code && styles.optionActive]}
            onPress={() => setLanguage(option.code)}
          >
            <Text style={[styles.optionText, language === option.code && styles.optionTextActive]}>
              {option.label}
            </Text>
            <View style={styles.optionRight}>
              <Text style={styles.optionFlag}>{option.flag}</Text>
              {language === option.code ? (
                <MaterialCommunityIcons name="check" size={18} color="#fff" />
              ) : null}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

    </View>
  );
}
