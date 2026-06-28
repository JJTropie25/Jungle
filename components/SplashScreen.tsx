import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { LagoonLogo } from "./LagoonLogo";

// Shown while fonts are loading — cannot use ThemeProvider or Baloo2 font yet.
// Uses LagoonLogo (no text) so there's no font dependency.
export default function SplashScreen() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim]);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] });

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: anim, transform: [{ scale }] }}>
        <LagoonLogo size={96} tile variant="light" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B3F3F",
    alignItems: "center",
    justifyContent: "center",
  },
});
