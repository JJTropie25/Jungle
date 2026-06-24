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

  if (!fontsLoaded) return <SplashScreen />;

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

            <Stack screenOptions={{ headerShown: false, animation: "slide_from_right", contentStyle: { backgroundColor: "#0B3F3F" } }} />
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
  return <StripeRootProvider>{Content}</StripeRootProvider>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
