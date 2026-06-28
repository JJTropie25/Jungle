import { useEffect, useRef } from "react";
import { Animated, Easing, StyleProp, ViewStyle } from "react-native";
import { LagoonLogo } from "./LagoonLogo";
import { useTheme } from "../lib/theme-context";

type Props = {
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export default function BrandedLoader({ size = 52, style }: Props) {
  const { mode } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 950,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 950,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] });

  return (
    <Animated.View style={[{ opacity, transform: [{ scale }] }, style]}>
      <LagoonLogo size={size} tile={false} variant={mode === "dark" ? "dark" : "light"} />
    </Animated.View>
  );
}
