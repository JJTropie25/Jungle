import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../lib/theme";

export default function CheckInConfirmed() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="check-circle" size={86} color="#2FA46D" />
        </View>
        <Text style={styles.title}>Check in confirmed</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace("/(host)/reservations")}>
          <Text style={styles.buttonText}>Back to reservations</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBackground },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 18,
  },
  button: {
    backgroundColor: colors.textPrimary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: colors.background,
    fontWeight: "700",
  },
});

