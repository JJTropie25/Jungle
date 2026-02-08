import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ResultsMap from "../../../components/ResultsMap";
import { colors } from "../../../lib/theme";

type Params = {
  microservice?: string;
  destination?: string;
  timeslot?: string;
  people?: string;
  latitude?: string;
  longitude?: string;
};

const cityCoords: Record<string, { lat: number; lon: number }> = {
  "Roma, RM": { lat: 41.9028, lon: 12.4964 },
  "Milano, MI": { lat: 45.4642, lon: 9.19 },
  "Firenze, FI": { lat: 43.7696, lon: 11.2558 },
  "Torino, TO": { lat: 45.0703, lon: 7.6869 },
  "Bologna, BO": { lat: 44.4949, lon: 11.3426 },
  "Napoli, NA": { lat: 40.8518, lon: 14.2681 },
  "Padova, PD": { lat: 45.4064, lon: 11.8768 },
  "Verona, VR": { lat: 45.4384, lon: 10.9916 },
};

export default function Directions() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    microservice,
    destination,
    timeslot,
    people,
    latitude,
    longitude,
  } = useLocalSearchParams<Params>();

  const fallback = cityCoords[destination ?? ""] ?? cityCoords["Roma, RM"];
  const lat = latitude ? Number(latitude) : fallback.lat;
  const lon = longitude ? Number(longitude) : fallback.lon;

  const results = [
    {
      title: microservice ?? "Service",
      price: "",
      location: destination ?? "Unknown",
      latitude: lat,
      longitude: lon,
    },
  ];

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.mapContainer}>
        <ResultsMap results={results} selectedTitle={results[0].title} />
        <View style={[styles.mapTop, { paddingTop: insets.top + 12 }]}>
          <View style={styles.summaryBox}>
            <TouchableOpacity
              style={styles.summaryBack}
              onPress={() => router.back()}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryItem}>{microservice ?? "-"}</Text>
              <Text style={styles.summarySep}>|</Text>
              <Text style={styles.summaryItem}>{destination ?? "-"}</Text>
              <Text style={styles.summarySep}>|</Text>
              <Text style={styles.summaryItem}>{timeslot ?? "-"}</Text>
              <Text style={styles.summarySep}>|</Text>
              <View style={styles.summaryPeople}>
                <MaterialCommunityIcons name="account-group" size={16} color={colors.textPrimary} />
                <Text style={styles.summaryPeopleText}>{people ?? "-"}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  mapContainer: { flex: 1 },
  mapTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  summaryBox: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  summaryLine: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    columnGap: 8,
    rowGap: 4,
  },
  summaryItem: {
    fontWeight: "600",
    color: colors.textPrimary,
  },
  summarySep: {
    color: colors.textMuted,
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
  summaryBack: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
});
