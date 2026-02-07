import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ServiceCard from "../../../components/ServiceCard";
import ResultsActionBar from "../../../components/ResultsActionBar";
import ResultsMap from "../../../components/ResultsMap";
import { useEffect, useMemo, useRef, useState } from "react";

export default function SearchResults() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const placeholderImage = require("../../../assets/images/react-logo.png");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const mapScrollRef = useRef<ScrollView>(null);
  const CARD_WIDTH = 260;
  const CARD_GAP = 12;
  const CARD_SNAP = CARD_WIDTH + CARD_GAP;

  const { destination, timeslot, people, microservice } =
    useLocalSearchParams<{
      destination?: string;
      timeslot?: string;
      people?: string;
      microservice?: string;
    }>();

  const results = [
    {
      title: "Doccia Centrale",
      type: "Doccia",
      rating: 4.5,
      distance: "300m",
      price: "EUR 5",
      location: "Roma, RM",
      latitude: 41.9028,
      longitude: 12.4964,
    },
    {
      title: "Deposito Stazione",
      type: "Deposito",
      rating: 4.2,
      distance: "450m",
      price: "EUR 8",
      location: "Milano, MI",
      latitude: 45.4642,
      longitude: 9.19,
    },
    {
      title: "Riposo Centro",
      type: "Riposo",
      rating: 4.8,
      distance: "200m",
      price: "EUR 10",
      location: "Firenze, FI",
      latitude: 43.7696,
      longitude: 11.2558,
    },
    {
      title: "Doccia Porta Nuova",
      type: "Doccia",
      rating: 4.4,
      distance: "380m",
      price: "EUR 6",
      location: "Torino, TO",
      latitude: 45.0703,
      longitude: 7.6869,
    },
    {
      title: "Deposito City Park",
      type: "Deposito",
      rating: 4.1,
      distance: "520m",
      price: "EUR 4",
      location: "Bologna, BO",
      latitude: 44.4949,
      longitude: 11.3426,
    },
    {
      title: "Riposo Lungomare",
      type: "Riposo",
      rating: 4.7,
      distance: "260m",
      price: "EUR 14",
      location: "Napoli, NA",
      latitude: 40.8518,
      longitude: 14.2681,
    },
    {
      title: "Doccia Universita",
      type: "Doccia",
      rating: 4.0,
      distance: "610m",
      price: "EUR 5",
      location: "Padova, PD",
      latitude: 45.4064,
      longitude: 11.8768,
    },
    {
      title: "Deposito Centro Storico",
      type: "Deposito",
      rating: 4.3,
      distance: "430m",
      price: "EUR 5",
      location: "Verona, VR",
      latitude: 45.4384,
      longitude: 10.9916,
    },
    {
      title: "Riposo Parco Nord",
      type: "Riposo",
      rating: 4.6,
      distance: "310m",
      price: "EUR 12",
      location: "Milano, MI",
      latitude: 45.4782,
      longitude: 9.2266,
    },
  ];
  const resultsByIndex = useMemo(() => results, [results]);

  useEffect(() => {
    if (viewMode === "map" && !selectedTitle && resultsByIndex.length > 0) {
      setSelectedTitle(resultsByIndex[0].title);
    }
  }, [resultsByIndex, selectedTitle, viewMode]);

  const SummaryLine = () => (
    <View style={styles.summaryLine}>
      <Text style={styles.summaryItem}>{microservice ?? "-"}</Text>
      <Text style={styles.summarySep}>|</Text>
      <Text style={styles.summaryItem}>{destination ?? "-"}</Text>
      <Text style={styles.summarySep}>|</Text>
      <Text style={styles.summaryItem}>{timeslot ?? "-"}</Text>
      <Text style={styles.summarySep}>|</Text>
      <View style={styles.summaryPeople}>
        <MaterialCommunityIcons name="account-group" size={16} color="#111827" />
        <Text style={styles.summaryPeopleText}>{people ?? "-"}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      {viewMode === "list" ? (
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { paddingTop: insets.top + 16 },
          ]}
        >
          {/* SUMMARY BOX ORIZZONTALE */}
          <View style={styles.summaryBox}>
            <TouchableOpacity
              style={styles.summaryBack}
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace("/(tabs)/guest")
              }
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color="#111827" />
            </TouchableOpacity>
            <SummaryLine />
          </View>

          {/* ACTIONS */}
          <ResultsActionBar
            actions={[
              { label: "Sort" },
              { label: "Filter" },
              { label: "Map", onPress: () => setViewMode("map") },
            ]}
          />

          {/* RESULTS */}
          {results.map((item) => (
            <ServiceCard
              key={item.title}
              fullWidth
              horizontal
              containerStyle={styles.card}
              imageStyle={styles.cardImage}
              imageSource={placeholderImage}
              title={item.title}
              price={item.price}
              location={item.location}
              meta={`${item.type} · ${item.distance} · Rating ${item.rating}`}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/guest/ServiceDetails",
                  params: {
                    destination,
                    timeslot,
                    people,
                    microservice: item.title,
                  },
                })
              }
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.mapContainer}>
          <ResultsMap
            results={results}
            selectedTitle={selectedTitle}
            onSelect={(title) => {
              const index = resultsByIndex.findIndex((r) => r.title === title);
              if (index >= 0) {
                mapScrollRef.current?.scrollTo({
                  x: index * CARD_SNAP,
                  animated: true,
                });
              }
              setSelectedTitle(title);
            }}
          />

          <View style={[styles.mapTop, { paddingTop: insets.top + 12 }]}>
            <View style={styles.summaryBox}>
              <TouchableOpacity
                style={styles.summaryBack}
                onPress={() =>
                  router.canGoBack() ? router.back() : router.replace("/(tabs)/guest")
                }
              >
                <MaterialCommunityIcons name="arrow-left" size={20} color="#111827" />
              </TouchableOpacity>
              <SummaryLine />
            </View>

            <ResultsActionBar
              actions={[
                { label: "Sort" },
                { label: "Filter" },
                { label: "List", onPress: () => setViewMode("list") },
              ]}
            />
          </View>

          <View style={styles.mapBottom}>
            <ScrollView
              ref={mapScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_SNAP}
              decelerationRate="fast"
              snapToAlignment="start"
              contentContainerStyle={styles.mapCards}
              onMomentumScrollEnd={(e) => {
                const x = e.nativeEvent.contentOffset.x;
                const index = Math.round(x / CARD_SNAP);
                const item = resultsByIndex[index];
                if (item) setSelectedTitle(item.title);
              }}
            >
              {results.map((item) => (
                <ServiceCard
                  key={item.title}
                  horizontal
                  containerStyle={styles.mapCard}
                  imageStyle={styles.mapCardImage}
                  imageSource={placeholderImage}
                  title={item.title}
                  price={item.price}
                  location={item.location}
                  meta={`${item.type} · ${item.distance} · Rating ${item.rating}`}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/guest/ServiceDetails",
                      params: {
                        destination,
                        timeslot,
                        people,
                        microservice: item.title,
                      },
                    })
                  }
                />
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  container: {
    padding: 16,
    paddingBottom: 24,
  },
  summaryBox: {
    backgroundColor: "#f2f2f2",
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
  summaryBack: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    marginBottom: 12,
  },
  cardImage: {
    height: 90,
  },
  mapContainer: {
    flex: 1,
  },
  mapTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  mapBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 16,
    paddingHorizontal: 16,
  },
  mapCards: {
    paddingRight: 16,
  },
  mapCard: {
    width: 260,
    marginRight: 12,
  },
  mapCardImage: {
    height: 80,
  },
});
