import { Image, StyleSheet, View } from "react-native";

export default function SplashScreen() {
  const logo = require("../assets/images/Lagoon_notch.png");
  return (
    <View style={styles.container}>
      <Image source={logo} resizeMode="contain" style={styles.logo} />
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
  logo: {
    width: 180,
    height: 60,
  },
});