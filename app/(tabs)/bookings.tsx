import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function Bookings() {
  const insets = useSafeAreaInsets();
  const bookings = [
    {
      title: "Doccia Centrale",
      destination: "Roma, RM",
      timeslot: "Oggi 10:00",
      people: "1",
    },
    {
      title: "Deposito Stazione",
      destination: "Milano, MI",
      timeslot: "Domani 14:00",
      people: "2",
    },
    {
      title: "Riposo Centro",
      destination: "Firenze, FI",
      timeslot: "Venerdi 18:00",
      people: "1",
    },
  ];

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 16 },
        ]}
      >
        <Text style={styles.title}>Le tue prenotazioni</Text>

        {bookings.map((item) => (
          <View key={item.title} style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryItem}>{item.title}</Text>
              <Text style={styles.summarySep}>|</Text>
              <Text style={styles.summaryItem}>{item.destination}</Text>
              <Text style={styles.summarySep}>|</Text>
              <Text style={styles.summaryItem}>{item.timeslot}</Text>
              <Text style={styles.summarySep}>|</Text>
              <View style={styles.summaryPeople}>
                <MaterialCommunityIcons
                  name="account-group"
                  size={16}
                  color="#111827"
                />
                <Text style={styles.summaryPeopleText}>{item.people}</Text>
              </View>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cardButton}>
                <Text>Get directions</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cardButton}>
                <Text>Manage booking</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 16, paddingBottom: 24 },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111827",
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
});
