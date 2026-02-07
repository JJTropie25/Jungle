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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ServiceCard from "../../../components/ServiceCard";
import CategoryButton from "../../../components/CategoryButton";

export default function GuestHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [people, setPeople] = useState("");
  const [microservice, setMicroservice] = useState("");
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const placeholderImage = require("../../../assets/images/react-logo.png");
  const categories = [
    { label: "Riposo", icon: "bed-king" },
    { label: "Doccia", icon: "shower" },
    { label: "Deposito", icon: "locker" },
  ];

  // MOCK DATA CARDS
  const recentlyViewed = [
    {
      title: "Casa di Marcello",
      type: "Riposo",
      price: "EUR 18",
      location: "Roma, RM",
    },
    {
      title: "Doccia Stazione",
      type: "Doccia",
      price: "EUR 6",
      location: "Milano, MI",
    },
    {
      title: "Deposito Centro",
      type: "Deposito",
      price: "EUR 4",
      location: "Firenze, FI",
    },
    {
      title: "Riposo Trastevere",
      type: "Riposo",
      price: "EUR 22",
      location: "Roma, RM",
    },
    {
      title: "Doccia Navigli",
      type: "Doccia",
      price: "EUR 7",
      location: "Milano, MI",
    },
    {
      title: "Deposito Duomo",
      type: "Deposito",
      price: "EUR 5",
      location: "Firenze, FI",
    },
  ];

  const aroundYou = [
    {
      title: "Doccia Parco",
      type: "Doccia",
      price: "EUR 5",
      location: "Torino, TO",
    },
    {
      title: "Deposito Piazza",
      type: "Deposito",
      price: "EUR 3",
      location: "Bologna, BO",
    },
    {
      title: "Riposo Stazione",
      type: "Riposo",
      price: "EUR 16",
      location: "Napoli, NA",
    },
    {
      title: "Riposo Mare",
      type: "Riposo",
      price: "EUR 19",
      location: "Genova, GE",
    },
    {
      title: "Doccia Porto",
      type: "Doccia",
      price: "EUR 6",
      location: "Livorno, LI",
    },
    {
      title: "Deposito Centro Storico",
      type: "Deposito",
      price: "EUR 4",
      location: "Bari, BA",
    },
  ];

  // funzione per navigare a ServiceDetails con dati della card
  const goToServiceDetails = (item: { title: string; type: string }) => {
    router.push({
      pathname: "/(tabs)/guest/ServiceDetails",
      params: {
        destination: destination || "Default Destination",
        timeslot: date && time ? `${date} ${time}` : "Anytime",
        people: people || "1",
        microservice: item.title,
      },
    });
  };
  const closeDropdowns = () => {
    setDateOpen(false);
    setTimeOpen(false);
    setPeopleOpen(false);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 16 },
        ]}
      >
        {/* Search (always open) */}
        <View style={styles.searchContainer}>
          <View style={styles.searchExpanded}>
            {selectedCategory ? (
              <View style={styles.categoryBadge}>
                <MaterialCommunityIcons
                  name={
                    categories.find((c) => c.label === selectedCategory)?.icon as any
                  }
                  size={18}
                  color="#111827"
                />
                <Text style={styles.categoryBadgeText}>{selectedCategory}</Text>
              </View>
            ) : null}
            {!selectedCategory && (
              <View style={[styles.categories, styles.fieldGap]}>
                {categories.map((item) => (
                  <CategoryButton
                    key={item.label}
                    label={item.label}
                    icon={item.icon}
                    onPress={() => {
                      closeDropdowns();
                      setMicroservice(item.label);
                    }}
                    selected={microservice === item.label}
                  />
                ))}
              </View>
            )}
            <View style={styles.inputWithIcon}>
              <MaterialCommunityIcons
                name="map-marker"
                size={18}
                color="#6b7280"
              />
              <TextInput
                style={styles.inputField}
                placeholder="Destination"
                value={destination}
                onChangeText={setDestination}
                onFocus={closeDropdowns}
              />
            </View>
              <View style={[styles.row, styles.fieldGap]}>
                <View style={styles.half}>
                  <TouchableOpacity
                    style={styles.selectField}
                    onPress={() => {
                      closeDropdowns();
                      setDateOpen((v) => !v);
                      setTimeOpen(false);
                    }}
                  >
                    <Text style={styles.selectLabel}>
                      {date || "Date"}
                    </Text>
                    <MaterialCommunityIcons
                      name="calendar-month"
                      size={18}
                      color="#6b7280"
                    />
                  </TouchableOpacity>
                  {dateOpen && (
                    <View style={styles.dropdown}>
                      {["Today", "Tomorrow", "This weekend"].map((d) => (
                        <TouchableOpacity
                          key={d}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setDate(d);
                            setDateOpen(false);
                          }}
                        >
                          <Text>{d}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                <View style={styles.half}>
                  <TouchableOpacity
                    style={styles.selectField}
                    onPress={() => {
                      closeDropdowns();
                      setTimeOpen((v) => !v);
                      setDateOpen(false);
                    }}
                  >
                    <Text style={styles.selectLabel}>
                      {time || "Time"}
                    </Text>
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={18}
                      color="#6b7280"
                    />
                  </TouchableOpacity>
                  {timeOpen && (
                    <View style={styles.dropdown}>
                      {["09:00", "12:00", "15:00", "18:00"].map((t) => (
                        <TouchableOpacity
                          key={t}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setTime(t);
                            setTimeOpen(false);
                          }}
                        >
                          <Text>{t}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.fieldGap}>
                <TouchableOpacity
                  style={styles.selectField}
                  onPress={() => {
                    closeDropdowns();
                    setPeopleOpen((v) => !v);
                  }}
                >
                  <Text style={styles.selectLabel}>{people || "People"}</Text>
                  <MaterialCommunityIcons
                    name="account-group-outline"
                    size={18}
                    color="#6b7280"
                  />
                </TouchableOpacity>
                {peopleOpen && (
                  <View style={styles.dropdown}>
                    {["1", "2", "3", "4+"].map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setPeople(p);
                          setPeopleOpen(false);
                        }}
                      >
                        <Text>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.searchButton}
                onPress={() => {
                  closeDropdowns();
                  router.push({
                    pathname: "/(tabs)/guest/SearchResults",
                    params: {
                      destination,
                      timeslot: date && time ? `${date} ${time}` : "",
                      people,
                      microservice: selectedCategory ?? microservice,
                    },
                  });
                }}
              >
                <Text style={styles.searchButtonText}>Search</Text>
              </TouchableOpacity>
          </View>
        </View>

        {/* Recently viewed */}
        <Text style={styles.sectionTitle}>Recently viewed</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {recentlyViewed.map((item) => (
            <ServiceCard
              key={item.title}
              onPress={() => goToServiceDetails(item)}
              title={item.title}
              price={item.price}
              location={item.location}
              imageSource={placeholderImage}
            />
          ))}
        </ScrollView>

        {/* Around you */}
        <Text style={styles.sectionTitle}>Around you</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {aroundYou.map((item) => (
            <ServiceCard
              key={item.title}
              onPress={() => goToServiceDetails(item)}
              title={item.title}
              price={item.price}
              location={item.location}
              imageSource={placeholderImage}
            />
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 16, paddingBottom: 24 },
  categories: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  searchContainer: {
    marginBottom: 4,
  },
  searchExpanded: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    padding: 12,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  categoryBadgeText: {
    fontWeight: "600",
    color: "#111827",
  },
  sectionTitle: { fontWeight: "600", marginVertical: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  inputField: {
    flex: 1,
    paddingVertical: 2,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  half: {
    flex: 1,
  },
  selectField: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fieldGap: {
    marginBottom: 10,
  },
  selectLabel: {
    color: "#111827",
  },
  dropdown: {
    marginTop: 6,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
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
