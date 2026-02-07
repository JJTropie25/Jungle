import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function BookingConfirmation() {
  const insets = useSafeAreaInsets();
  const { destination, timeslot, people, microservice, selectedHour } =
    useLocalSearchParams<{
      destination?: string;
      timeslot?: string;
      people?: string;
      microservice?: string;
      selectedHour?: string;
    }>();

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 16 },
        ]}
      >
        <Text style={styles.thankYou}>Thank you for your booking</Text>

        {/* Service recap card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{microservice}</Text>
          <View style={styles.summaryLine}>
            <Text style={styles.summaryItem}>{microservice ?? "-"}</Text>
            <Text style={styles.summarySep}>|</Text>
            <Text style={styles.summaryItem}>{destination ?? "-"}</Text>
            <Text style={styles.summarySep}>|</Text>
            <Text style={styles.summaryItem}>{timeslot ?? "-"}</Text>
            <Text style={styles.summarySep}>|</Text>
            <View style={styles.summaryPeople}>
              <MaterialCommunityIcons
                name="account-group"
                size={16}
                color="#111827"
              />
              <Text style={styles.summaryPeopleText}>{people ?? "-"}</Text>
            </View>
          </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 16, paddingBottom: 24 },
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
  summaryLine: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    columnGap: 8,
    rowGap: 4,
    marginBottom: 6,
  },
  summaryItem: {
    fontWeight: "600",
    color: "#111827",
  },
  summarySep: {
    color: "#9ca3af",
    fontWeight: "600",
  },
  summaryPeople: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summaryPeopleText: {
    fontWeight: "600",
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
