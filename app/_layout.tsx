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
            colors={["#166A6A", "#A5D3D3", "#E2F2F2"]}
            locations={[0, 0.45, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "transparent" } }} />
          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(15,78,78,0.32)",
              "rgba(22,106,106,0.16)",
              "rgba(226,242,242,0.02)",
            ]}
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
