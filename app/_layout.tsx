import { Stack } from "expo-router";
import { I18nProvider } from "../lib/i18n";
import { useAuthState } from "../lib/auth";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AppDialogProvider } from "../components/AppDialogProvider";

export default function RootLayout() {
  useAuthState();

  return (
    <I18nProvider>
      <AppDialogProvider>
        <View style={styles.root}>
          <LinearGradient
            colors={["#2E6A52", "#DFF2E8", "#FFFFFF"]}
            locations={[0, 0.45, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "transparent" } }} />
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(24,59,45,0.34)", "rgba(46,106,82,0.14)", "rgba(255,255,255,0.02)"]}
            locations={[0, 0.35, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

        </View>
      </AppDialogProvider>
    </I18nProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
