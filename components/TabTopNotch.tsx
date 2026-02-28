import { Image, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabTopNotch() {
  const insets = useSafeAreaInsets();
  const logoModule = require("../assets/images/Jungle_Logo_Green.svg") as any;
  const Logo = (logoModule?.default ?? logoModule) as any;
  const canRenderSvg = typeof Logo === "function" || typeof Logo === "object";

  return (
    <View style={[styles.fixedNotch, { top: insets.top }]}>
      {canRenderSvg ? (
        <Logo width={148} height={148} />
      ) : (
        <Image
          source={require("../assets/images/android-icon-foreground.png")}
          style={styles.brandFallbackLogo}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fixedNotch: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: "#2E6A52",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingLeft: 20,
    zIndex: 50,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  brandFallbackLogo: {
    width: 148,
    height: 148,
    marginLeft: 12,
  },
});
