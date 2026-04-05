import { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "../lib/theme";

export default function OnboardingIntro() {
  const router = useRouter();
  const logo = require("../assets/images/Lagoon_notch.png");

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/onboarding");
    }, 1200);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <Image source={logo} resizeMode="contain" style={styles.logo} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 180,
    height: 60,
  },
});
