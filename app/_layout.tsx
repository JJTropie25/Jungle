import { Stack } from "expo-router";
import { I18nProvider } from "../lib/i18n";
import { useAuthState } from "../lib/auth";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AppDialogProvider } from "../components/AppDialogProvider";
import { useFonts } from "expo-font";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import SplashScreen from "../components/SplashScreen";
import NotificationsProvider from "../components/NotificationsProvider";
import { StripeProvider } from "@stripe/stripe-react-native";

export default function RootLayout() {
  useAuthState();
  const [fontsLoaded] = useFonts({
    ...MaterialCommunityIcons.font,
  });
  const stripePublishableKey =
    process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

  if (!fontsLoaded) return <SplashScreen />;

  return (
    <StripeProvider publishableKey={stripePublishableKey} merchantIdentifier="merchant.com.lagoon">
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

            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0B3F3F" } }} />
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
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
