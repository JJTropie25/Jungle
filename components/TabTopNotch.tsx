import { Image, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabTopNotch() {
  const insets = useSafeAreaInsets();
  const logo = require("../assets/images/Lagoon_notch.png");

  return (
    <View style={[styles.fixedNotch, { top: insets.top }]}>
      <Image source={logo} style={styles.notchLogo} />
    </View>
  );
}

const styles = StyleSheet.create({
  fixedNotch: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: "#4F9B9B",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingLeft: 14,
    zIndex: 50,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  notchLogo: {
    width: 110,
    height: 30,
    resizeMode: "cover",
    marginTop: -1,
    marginLeft: -4,
  },
});
