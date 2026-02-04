import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

export default function GuestHome() {
  const router = useRouter();

  const [searchOpen, setSearchOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const [timeslot, setTimeslot] = useState("");
  const [people, setPeople] = useState("");
  const [microservice, setMicroservice] = useState("");

  // MOCK DATA CARDS
  const recentlyViewed = [
    { title: "Casa di Marcello", type: "Riposo" },
    { title: "Doccia Stazione", type: "Doccia" },
    { title: "Deposito Centro", type: "Deposito" },
  ];

  const aroundYou = [
    { title: "Doccia Parco", type: "Doccia" },
    { title: "Deposito Piazza", type: "Deposito" },
    { title: "Riposo Stazione", type: "Riposo" },
  ];

  // funzione per navigare a ServiceDetails con dati della card
  const goToServiceDetails = (item: { title: string; type: string }) => {
    router.push({
      pathname: "/guest/ServiceDetails",
      params: {
        destination: destination || "Default Destination",
        timeslot: timeslot || "Anytime",
        people: people || "1",
        microservice: item.title,
      },
    });
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Categories */}
        <View style={styles.categories}>
          {["Riposo", "Doccia", "Deposito"].map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.categoryButton}
              onPress={() => {
                setSearchOpen(true);
                setMicroservice(item);
              }}
            >
              <Text>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => {
            setSearchOpen(true);
            setMicroservice("");
          }}
        >
          <Text style={styles.searchPlaceholder}>
            Search for microservices
          </Text>
        </TouchableOpacity>

        {/* Recently viewed */}
        <Text style={styles.sectionTitle}>Recently viewed</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {recentlyViewed.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={styles.card}
              onPress={() => goToServiceDetails(item)}
            >
              <Text>{item.title}</Text>
              <Text>{item.type}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Around you */}
        <Text style={styles.sectionTitle}>Around you</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {aroundYou.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={styles.card}
              onPress={() => goToServiceDetails(item)}
            >
              <Text>{item.title}</Text>
              <Text>{item.type}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>

      {/* SEARCH OVERLAY */}
      {searchOpen && (
        <>
          <TouchableOpacity
            style={styles.overlay}
            onPress={() => setSearchOpen(false)}
          />

          <View style={styles.searchPanel}>
            <TextInput
              style={styles.input}
              placeholder="Destination"
              value={destination}
              onChangeText={setDestination}
            />
            <TextInput
              style={styles.input}
              placeholder="Timeslot"
              value={timeslot}
              onChangeText={setTimeslot}
            />
            <TextInput
              style={styles.input}
              placeholder="People"
              value={people}
              onChangeText={setPeople}
            />
            <TextInput
              style={styles.input}
              placeholder="Microservice"
              value={microservice}
              onChangeText={setMicroservice}
            />

            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => {
                setSearchOpen(false);
                router.push({
                  pathname: "/guest/SearchResults",
                  params: { destination, timeslot, people, microservice },
                });
              }}
            >
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: 16 },
  categories: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  categoryButton: {
    padding: 12,
    backgroundColor: "#eee",
    borderRadius: 8,
    width: "30%",
    alignItems: "center",
  },
  searchBar: {
    padding: 14,
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
  },
  searchPlaceholder: { color: "#666" },
  sectionTitle: { fontWeight: "600", marginVertical: 10 },
  card: {
    width: 160,
    height: 100,
    backgroundColor: "#eee",
    borderRadius: 10,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  searchPanel: {
    position: "absolute",
    top: 120,
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  searchButton: {
    marginTop: 8,
    padding: 14,
    backgroundColor: "#000",
    borderRadius: 8,
    alignItems: "center",
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
