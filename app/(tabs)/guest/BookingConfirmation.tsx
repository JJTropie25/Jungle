import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function BookingConfirmation() {
  const { destination, timeslot, people, microservice, selectedHour } =
    useLocalSearchParams<{
      destination?: string;
      timeslot?: string;
      people?: string;
      microservice?: string;
      selectedHour?: string;
    }>();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.thankYou}>Thank you for your booking</Text>

      {/* Service recap card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{microservice}</Text>
        <Text>{destination} | {timeslot} | {people} person</Text>
        <Text>Time: {selectedHour}</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cardButton}>
            <Text>Get directions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cardButton}>
            <Text>Manage booking</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* QR code card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Access with this QR code</Text>
        <View style={styles.qrMock}>
          <Text>QR CODE</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  thankYou: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cardTitle: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  cardButton: {
    flex: 1,
    padding: 12,
    backgroundColor: "#eee",
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 4,
  },
  qrMock: {
    height: 180,
    backgroundColor: "#ddd",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
});
