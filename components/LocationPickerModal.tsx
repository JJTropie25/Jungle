import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { reverseGeocodeLabel, searchPlaceSuggestions, type PlaceSuggestion } from "../lib/geocoding";
import { useTheme } from "../lib/theme-context";
// @ts-ignore – Metro resolves platform extensions at build time
import LocationPickerMap from "./LocationPickerMap";

const SUGGESTED: PlaceSuggestion[] = [
  { label: "Venezia", latitude: 45.4408, longitude: 12.3155 },
  { label: "Roma",    latitude: 41.9028, longitude: 12.4964 },
  { label: "Milano",  latitude: 45.4642, longitude: 9.1900  },
  { label: "Firenze", latitude: 43.7696, longitude: 11.2558 },
  { label: "Napoli",  latitude: 40.8518, longitude: 14.2681 },
  { label: "Torino",  latitude: 45.0703, longitude: 7.6869  },
  { label: "Bologna", latitude: 44.4949, longitude: 11.3426 },
  { label: "Verona",  latitude: 45.4384, longitude: 10.9916 },
];

const DEFAULT_COORDS = { latitude: 41.9028, longitude: 12.4964 };

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (place: PlaceSuggestion) => void;
  accentColor?: string;
  showSuggested?: boolean;
  initialCoords?: { latitude: number; longitude: number };
};

export default function LocationPickerModal({
  visible,
  onClose,
  onSelect,
  accentColor = "#4F9B9B",
  showSuggested = false,
  initialCoords,
}: Props) {
  const { colors } = useTheme();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapMode, setMapMode] = useState(false);
  const [pickedCoords, setPickedCoords] = useState(initialCoords ?? DEFAULT_COORDS);
  const [mapResolving, setMapResolving] = useState(false);
  const reqSeq = useRef(0);

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setSuggestions([]);
      setMapMode(false);
      setPickedCoords(initialCoords ?? DEFAULT_COORDS);
    }
  }, [visible, initialCoords]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) { setSuggestions([]); setLoading(false); return; }
    const id = ++reqSeq.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const data = await searchPlaceSuggestions(q, 8);
        if (id === reqSeq.current) setSuggestions(data);
      } catch {
        if (id === reqSeq.current) setSuggestions([]);
      } finally {
        if (id === reqSeq.current) setLoading(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  const handleConfirmMap = async () => {
    setMapResolving(true);
    const label = await reverseGeocodeLabel(pickedCoords.latitude, pickedCoords.longitude);
    setMapResolving(false);
    onSelect({ label, latitude: pickedCoords.latitude, longitude: pickedCoords.longitude });
    onClose();
  };

  const handleSelect = (item: PlaceSuggestion) => {
    onSelect(item);
    onClose();
    setQuery("");
  };

  const listData = query.trim().length > 0 ? suggestions : (showSuggested ? SUGGESTED : []);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.screenBackground }}>

        {/* Header bar */}
        <View style={[s.header, { backgroundColor: accentColor }]}>
          <TouchableOpacity
            onPress={onClose}
            style={s.headerBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>

          {mapMode ? (
            <Text style={s.headerMapTitle}>Drag map to pin location</Text>
          ) : (
            <>
              <TextInput
                style={s.searchInput}
                placeholder="Search location…"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={query}
                onChangeText={setQuery}
                autoFocus
                returnKeyType="search"
              />
              {query.length > 0 ? (
                <TouchableOpacity onPress={() => setQuery("")} style={s.headerBtn}>
                  <MaterialCommunityIcons name="close-circle" size={18} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              ) : null}
            </>
          )}

          <TouchableOpacity
            onPress={() => setMapMode((v) => !v)}
            style={[s.mapToggle, mapMode && s.mapToggleActive]}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <MaterialCommunityIcons
              name={mapMode ? "format-list-bulleted" : "map-outline"}
              size={18}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        {/* Map mode */}
        {mapMode ? (
          <View style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
              <LocationPickerMap
                latitude={pickedCoords.latitude}
                longitude={pickedCoords.longitude}
                onPick={(coords: { latitude: number; longitude: number }) => setPickedCoords(coords)}
              />
            </View>
            <View style={[s.mapFooter, { backgroundColor: colors.screenBackground, borderTopColor: colors.divider }]}>
              <Text style={[s.coordsText, { color: colors.textSecondary }]}>
                {pickedCoords.latitude.toFixed(5)}, {pickedCoords.longitude.toFixed(5)}
              </Text>
              <TouchableOpacity
                style={[s.confirmBtn, { backgroundColor: accentColor }, mapResolving && { opacity: 0.6 }]}
                disabled={mapResolving}
                onPress={handleConfirmMap}
              >
                {mapResolving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={s.confirmBtnText}>Use this location</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* List mode */
          <View style={{ flex: 1, backgroundColor: colors.screenBackground }}>
            {query.trim().length === 0 && showSuggested ? (
              <Text style={[s.sectionLabel, { color: colors.textMuted }]}>Suggested destinations</Text>
            ) : null}
            {loading ? (
              <View style={s.loadingRow}>
                <ActivityIndicator size="small" color={accentColor} />
                <Text style={[s.mutedText, { color: colors.textMuted }]}>Searching…</Text>
              </View>
            ) : listData.length === 0 && query.trim().length > 0 ? (
              <Text style={[s.mutedText, { color: colors.textMuted, paddingHorizontal: 16, paddingTop: 20 }]}>
                No results found
              </Text>
            ) : (
              <FlatList
                data={listData}
                keyExtractor={(item) => `${item.label}:${item.latitude}`}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity style={s.listItem} onPress={() => handleSelect(item)}>
                    <MaterialCommunityIcons
                      name="map-marker"
                      size={18}
                      color={accentColor}
                      style={{ marginRight: 12 }}
                    />
                    <Text style={[s.listItemText, { color: colors.textPrimary }]}>{item.label}</Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={[s.sep, { backgroundColor: colors.divider }]} />}
              />
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  headerBtn: {
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  headerMapTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  mapToggle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  mapToggleActive: {
    backgroundColor: "rgba(255,255,255,0.38)",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  mutedText: {
    fontSize: 14,
    fontWeight: "500",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  listItemText: {
    fontSize: 16,
    fontWeight: "500",
  },
  sep: {
    height: 1,
    marginHorizontal: 16,
  },
  mapFooter: {
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
  },
  coordsText: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
  },
  confirmBtn: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  confirmBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontFamily: "Baloo2_700Bold",
    fontSize: 15,
  },
});
