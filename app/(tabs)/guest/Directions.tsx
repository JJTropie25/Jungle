import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../../lib/theme";
import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../../../lib/i18n";
import * as Location from "expo-location";
import DirectionsMap from "../../../components/DirectionsMap";

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

const directionsKey =
  process.env.EXPO_PUBLIC_GOOGLE_DIRECTIONS_API_KEY?.trim() ??
  process.env.EXPO_PUBLIC_GOOGLE_GEOCODING_API_KEY?.trim() ??
  "";

type LatLng = { latitude: number; longitude: number };

function decodePolyline(encoded: string): LatLng[] {
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;
  const coordinates: LatLng[] = [];

  while (index < len) {
    let b = 0;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coordinates;
}

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
  const { t } = useI18n();

  const mapRef = useRef<any>(null);
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [route, setRoute] = useState<LatLng[]>([]);

  const destinationCoords = useMemo(() => {
    const fallback = cityCoords[destination ?? ""] ?? cityCoords["Roma, RM"];
    const lat = latitude ? Number(latitude) : fallback.lat;
    const lon = longitude ? Number(longitude) : fallback.lon;
    return { latitude: lat, longitude: lon };
  }, [destination, latitude, longitude]);

  useEffect(() => {
    let mounted = true;
    const loadOrigin = async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") return;
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (!mounted) return;
      setOrigin({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    };
    loadOrigin().catch(() => null);
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadRoute = async () => {
      if (!origin || !directionsKey) {
        setRoute(origin ? [origin, destinationCoords] : [destinationCoords]);
        return;
      }
      const url =
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}` +
        `&destination=${destinationCoords.latitude},${destinationCoords.longitude}` +
        `&mode=walking&key=${encodeURIComponent(directionsKey)}`;
      const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
      if (!res.ok) return;
      const payload = (await res.json()) as {
        status?: string;
        routes?: { overview_polyline?: { points?: string } }[];
      };
      if (!mounted) return;
      if (payload.status !== "OK") {
        setRoute([origin, destinationCoords]);
        return;
      }
      const points = payload.routes?.[0]?.overview_polyline?.points;
      if (!points) {
        setRoute([origin, destinationCoords]);
        return;
      }
      setRoute(decodePolyline(points));
    };
    loadRoute().catch(() => null);
    return () => {
      mounted = false;
    };
  }, [origin, destinationCoords]);

  useEffect(() => {
    const points = route.length > 1 ? route : [destinationCoords];
    if (points.length === 0) return;
    mapRef.current?.fitToCoordinates(points, {
      edgePadding: { top: 120, bottom: 120, left: 60, right: 60 },
      animated: true,
    });
  }, [route, destinationCoords]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.mapContainer}>
        <DirectionsMap
          mapRef={mapRef}
          destinationCoords={destinationCoords}
          origin={origin}
          route={route}
          microservice={microservice}
          destination={destination}
          title={t("directions.webTitle")}
          body={t("directions.webBody")}
          back={t("directions.webBack")}
          onBack={() => router.back()}
        />
        <View style={[styles.mapTop, { paddingTop: insets.top + 12 }]}>
          <View style={styles.summaryBox}>
            <TouchableOpacity
              style={styles.summaryBack}
              onPress={() => router.back()}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={20}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
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
                  color={colors.textPrimary}
                />
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
  screen: { flex: 1, backgroundColor: colors.screenBackground },
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
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
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

