import { View, Text, StyleSheet } from "react-native";

export default function Bookings() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prenotazioni</Text>
      <Text>Placeholder</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
});
