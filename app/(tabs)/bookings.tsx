import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useI18n } from "../../lib/i18n";

export default function Bookings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const bookings = [
    {
      title: "Doccia Centrale",
      destination: "Roma, RM",
      timeslot: `${t("day.today")} 10:00`,
      people: "1",
      latitude: 41.9028,
      longitude: 12.4964,
    },
    {
      title: "Deposito Stazione",
      destination: "Milano, MI",
      timeslot: `${t("day.tomorrow")} 14:00`,
      people: "2",
      latitude: 45.4642,
      longitude: 9.19,
    },
    {
      title: "Riposo Centro",
      destination: "Firenze, FI",
      timeslot: `${t("day.friday")} 18:00`,
      people: "1",
      latitude: 43.7696,
      longitude: 11.2558,
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
        <Text style={styles.title}>{t("bookings.title")}</Text>

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
              <TouchableOpacity
                style={styles.cardButton}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/guest/Directions",
                    params: {
                      microservice: item.title,
                      destination: item.destination,
                      timeslot: item.timeslot,
                      people: item.people,
                      latitude: String(item.latitude),
                      longitude: String(item.longitude),
                    },
                  })
                }
              >
                <Text>{t("booking.getDirections")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cardButton}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/guest/ManageBooking",
                    params: {
                      from: "bookings",
                      microservice: item.title,
                      destination: item.destination,
                      timeslot: item.timeslot,
                      people: item.people,
                    },
                  })
                }
              >
                <Text>{t("booking.manage")}</Text>
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
