import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";

export default function ServiceDetails() {
  const router = useRouter();
  const { destination, timeslot, people, microservice } =
    useLocalSearchParams<{
      destination?: string;
      timeslot?: string;
      people?: string;
      microservice?: string;
    }>();

  const hours = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00"];
  const [selectedHour, setSelectedHour] = useState<string | null>(null);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* SUMMARY */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryText}>
          {destination} | {timeslot} | {people} person
        </Text>
        <Text style={styles.title}>{microservice}</Text>
      </View>

      {/* IMAGE MOCK */}
      <View style={styles.imageMock}>
        <Text>IMAGE</Text>
      </View>

      {/* HOURS */}
      <Text style={styles.sectionTitle}>Available times</Text>
      <View style={styles.grid}>
        {hours.map((h) => (
          <TouchableOpacity
            key={h}
            style={[
              styles.hourButton,
              selectedHour === h && styles.hourButtonSelected,
            ]}
            onPress={() => setSelectedHour(h)}
          >
            <Text
              style={selectedHour === h ? styles.hourTextSelected : undefined}
            >
              {h}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* BOOK */}
      <TouchableOpacity
        style={[
          styles.bookButton,
          !selectedHour && styles.bookButtonDisabled,
        ]}
        disabled={!selectedHour}
        onPress={() =>
          router.push({
            pathname: "/guest/BookingConfirmation",
            params: { destination, timeslot, people, microservice, selectedHour },
          })
        }
      >
        <Text style={styles.bookText}>Book now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  summaryBox: {
    backgroundColor: "#f2f2f2",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  summaryText: { fontWeight: "600" },
  title: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "700",
  },
  imageMock: {
    height: 180,
    backgroundColor: "#ddd",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  hourButton: {
    width: "30%",
    padding: 12,
    backgroundColor: "#eee",
    borderRadius: 8,
    alignItems: "center",
  },
  hourButtonSelected: {
    backgroundColor: "#007bff",
  },
  hourTextSelected: {
    fontWeight: "700",
    color: "#fff",
  },
  bookButton: {
    padding: 16,
    backgroundColor: "#000",
    borderRadius: 10,
    alignItems: "center",
  },
  bookButtonDisabled: {
    backgroundColor: "#888",
  },
  bookText: {
    color: "#fff",
    fontWeight: "700",
  },
});
