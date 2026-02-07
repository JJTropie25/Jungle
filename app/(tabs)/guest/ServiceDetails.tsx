import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useI18n } from "../../../lib/i18n";

export default function ServiceDetails() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
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
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 16 },
        ]}
      >
        {/* SUMMARY */}
        <View style={styles.summaryBox}>
          <TouchableOpacity
            style={styles.summaryBack}
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/(tabs)/guest")
            }
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color="#111827" />
          </TouchableOpacity>
          <View style={styles.summaryContent}>
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
          </View>
        </View>

        {/* IMAGE MOCK */}
        <View style={styles.imageMock}>
          <Text>IMAGE</Text>
        </View>

        {/* HOURS */}
        <Text style={styles.sectionTitle}>{t("service.availableTimes")}</Text>
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
            pathname: "/(tabs)/guest/BookingConfirmation",
            params: { destination, timeslot, people, microservice, selectedHour },
          })
        }
      >
          <Text style={styles.bookText}>{t("service.bookNow")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 16, paddingBottom: 24 },
  summaryBox: {
    backgroundColor: "#f2f2f2",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  summaryBack: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryContent: {
    flex: 1,
  },
  summaryText: { fontWeight: "600" },
  summaryLine: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    columnGap: 8,
    rowGap: 4,
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
