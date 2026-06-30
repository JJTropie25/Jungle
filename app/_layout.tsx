import { useState } from "react";
import { Stack } from "expo-router";
import { I18nProvider } from "../lib/i18n";
import { useAuthState } from "../lib/auth";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AppDialogProvider } from "../components/AppDialogProvider";
import { useFonts } from "expo-font";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Baloo2_700Bold } from "@expo-google-fonts/baloo-2";
import SplashScreen from "../components/SplashScreen";
import NotificationsProvider from "../components/NotificationsProvider";
import StripeRootProvider from "../components/StripeRootProvider";
import { ThemeProvider } from "../lib/theme-context";

export default function RootLayout() {
  useAuthState();
  const [fontsLoaded] = useFonts({
    ...MaterialCommunityIcons.font,
    Baloo2_700Bold,
  });
  const [splashDone, setSplashDone] = useState(false);

  // Hold a matching orange screen while fonts load — the animated splash
  // (same orange background) mounts immediately after, hiding any transition.
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: "#e0763c" }} />;
  }

  const Content = (
    <ThemeProvider>
      <I18nProvider>
        <AppDialogProvider>
          <NotificationsProvider />
          <View style={styles.root}>
            <LinearGradient
              colors={["#0B3F3F", "#0B3F3F", "#0B3F3F"]}
              locations={[0, 0.45, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
                contentStyle: { backgroundColor: "#0B3F3F" },
              }}
            />
            <LinearGradient
              colors={[
                "rgba(11,63,63,0)",
                "rgba(11,63,63,0)",
                "rgba(11,63,63,0)",
              ]}
              locations={[0, 0.35, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}
            />
          </View>
        </AppDialogProvider>
      </I18nProvider>
    </ThemeProvider>
  );

  return (
    <View style={{ flex: 1 }}>
      <StripeRootProvider>{Content}</StripeRootProvider>
      {/* Animated overlay — slides off to the right when done, revealing the
          app underneath with no flash. Fonts are loaded so Baloo2 is available. */}
      {!splashDone && (
        <SplashScreen onDone={() => setSplashDone(true)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
