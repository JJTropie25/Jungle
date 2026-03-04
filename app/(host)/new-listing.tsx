import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../lib/theme";
import { useI18n } from "../../lib/i18n";
import { createHostListing, resolveHostForUser } from "../../lib/host";
import { useAppDialog } from "../../components/AppDialogProvider";
import { useAuthState } from "../../lib/auth";
import LocationPickerMap from "../../components/LocationPickerMap";
import { pickAndUploadListingImage } from "../../lib/listingImage";
import {
  PlaceSuggestion,
  reverseGeocodeLabel,
  searchPlaceSuggestions,
} from "../../lib/geocoding";

const SLOT_OPTIONS = Array.from({ length: 18 }, (_, i) => {
  const h = 9 + Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

const CATEGORIES: ("rest" | "shower" | "storage")[] = ["rest", "shower", "storage"];
const DEFAULT_COORDS = { latitude: 41.9028, longitude: 12.4964 };

function parsePrice(value: string) {
  const normalized = value.replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function HostNewListing() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { user } = useAuthState();
  const dialog = useAppDialog();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState<"rest" | "shower" | "storage">("rest");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<PlaceSuggestion[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapResolving, setMapResolving] = useState(false);
  const [pickedCoords, setPickedCoords] = useState(DEFAULT_COORDS);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const suggestReqSeq = useRef(0);

  const parseCurrentCoords = () => {
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return { latitude: lat, longitude: lon };
    }
    return DEFAULT_COORDS;
  };

  const canSave = useMemo(
    () => Boolean(title.trim()) && Boolean(location.trim()) && parsePrice(price) > 0 && slots.length > 0,
    [location, price, slots.length, title]
  );

  useEffect(() => {
    const query = location.trim();
    if (query.length < 3) {
      setLocationSuggestions([]);
      setSuggestLoading(false);
      return;
    }

    const controller = new AbortController();
    const reqId = ++suggestReqSeq.current;
    const timer = setTimeout(async () => {
      try {
        setSuggestLoading(true);
        const data = await searchPlaceSuggestions(query, 5);
        if (controller.signal.aborted) return;
        if (reqId === suggestReqSeq.current) {
          setLocationSuggestions(data);
        }
      } catch (error: any) {
        if (error?.name !== "AbortError" && reqId === suggestReqSeq.current) {
          setLocationSuggestions([]);
        }
      } finally {
        if (reqId === suggestReqSeq.current) {
          setSuggestLoading(false);
        }
      }
    }, 320);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [location]);

  const toggleSlot = (value: string) => {
    setSlots((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value].sort()
    );
  };

  const openMapPicker = () => {
    setPickedCoords(parseCurrentCoords());
    setMapOpen(true);
  };

  const confirmPickedLocation = async () => {
    setMapResolving(true);
    const name = await reverseGeocodeLabel(pickedCoords.latitude, pickedCoords.longitude);
    setLatitude(String(pickedCoords.latitude));
    setLongitude(String(pickedCoords.longitude));
    setLocation(name);
    setLocationSuggestions([]);
    setMapResolving(false);
    setMapOpen(false);
  };

  const onSave = async () => {
    if (!canSave) return;
    const { host } = await resolveHostForUser(user?.id);
    if (!host) {
      await dialog.alert(t("host.listings.title"), t("host.notAvailable"));
      return;
    }

    setSaving(true);
    const { error } = await createHostListing({
      hostId: host.id,
      title: title.trim(),
      description: description.trim(),
      category,
      price_eur: parsePrice(price),
      location: location.trim(),
      latitude: latitude.trim() ? Number(latitude) : null,
      longitude: longitude.trim() ? Number(longitude) : null,
      image_url: imageUrl.trim() || null,
      slotTimes: slots,
    });
    setSaving(false);
    if (error) {
      await dialog.alert(t("host.listings.title"), error);
      return;
    }
    await dialog.alert(t("host.listings.title"), t("host.listings.saved"));
    router.back();
  };

  const onPickPhoto = async () => {
    setUploadingImage(true);
    const result = await pickAndUploadListingImage(user?.id);
    setUploadingImage(false);
    if (result.error) {
      await dialog.alert(t("host.field.image"), result.error);
      return;
    }
    if (result.url) {
      setImageUrl(result.url);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>New listing</Text>

        <Text style={styles.label}>{t("host.field.title")}</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} />

        <Text style={styles.label}>{t("host.field.image")}</Text>
        <View style={styles.photoActions}>
          <TouchableOpacity
            style={[styles.photoButton, uploadingImage && styles.photoButtonDisabled]}
            onPress={onPickPhoto}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Text style={styles.photoButtonText}>Choose photo</Text>
            )}
          </TouchableOpacity>
          {imageUrl ? (
            <TouchableOpacity style={styles.photoRemoveButton} onPress={() => setImageUrl("")}>
              <Text style={styles.photoRemoveText}>Remove</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={styles.photoHint}>
          Upload from your device. URL is generated automatically.
        </Text>
        {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.previewImage} /> : null}

        <Text style={styles.label}>{t("host.field.description")}</Text>
        <TextInput
          style={[styles.input, styles.inputArea]}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.label}>{t("host.field.serviceType")}</Text>
        <View style={styles.categoryRow}>
          {CATEGORIES.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.categoryChip, category === item && styles.categoryChipSelected]}
              onPress={() => setCategory(item)}
            >
              <Text style={[styles.categoryChipText, category === item && styles.categoryChipTextSelected]}>
                {t(`category.${item}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t("host.field.price")}</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={(next) => setPrice(next.replace(",", "."))}
          keyboardType="decimal-pad"
          placeholder="0"
        />

        <Text style={styles.label}>{t("host.field.location")}</Text>
        <TextInput style={styles.input} value={location} onChangeText={setLocation} />
        {suggestLoading ? (
          <Text style={styles.suggestHint}>{t("host.field.searching")}</Text>
        ) : null}
        {locationSuggestions.length > 0 ? (
          <View style={styles.suggestBox}>
            {locationSuggestions.map((item) => (
              <TouchableOpacity
                key={`${item.label}:${item.latitude}:${item.longitude}`}
                style={styles.suggestItem}
                onPress={() => {
                  setLocation(item.label);
                  setLatitude(String(item.latitude));
                  setLongitude(String(item.longitude));
                  setLocationSuggestions([]);
                }}
              >
                <Text style={styles.suggestText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <View style={styles.mapActions}>
          <TouchableOpacity style={styles.mapButton} onPress={openMapPicker}>
            <MaterialCommunityIcons name="map-marker-radius" size={18} color={colors.background} />
            <Text style={styles.mapButtonText}>Choose on map</Text>
          </TouchableOpacity>
          <Text style={styles.coordsHint}>
            {latitude && longitude
              ? `Lat: ${Number(latitude).toFixed(6)} | Lon: ${Number(longitude).toFixed(6)}`
              : "No map point selected yet"}
          </Text>
        </View>

        <Text style={styles.label}>{t("host.field.slots")}</Text>
        <View style={styles.slotWrap}>
          {SLOT_OPTIONS.map((time) => (
            <TouchableOpacity
              key={time}
              style={[styles.slotChip, slots.includes(time) && styles.slotChipSelected]}
              onPress={() => toggleSlot(time)}
            >
              <Text style={[styles.slotChipText, slots.includes(time) && styles.slotChipTextSelected]}>
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, (!canSave || saving) && styles.saveButtonDisabled]}
          onPress={onSave}
          disabled={!canSave || saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? t("auth.loading") : t("host.listings.saveChanges")}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal transparent visible={mapOpen} animationType="slide" onRequestClose={() => setMapOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMapOpen(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pick listing location</Text>
              <TouchableOpacity onPress={() => setMapOpen(false)} style={styles.modalClose}>
                <MaterialCommunityIcons name="close" size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Tap the map to place the marker.</Text>
            <View style={styles.mapFrame}>
              <LocationPickerMap
                latitude={pickedCoords.latitude}
                longitude={pickedCoords.longitude}
                onPick={(coords) => setPickedCoords(coords)}
              />
            </View>
            <Text style={styles.modalCoords}>
              {pickedCoords.latitude.toFixed(6)}, {pickedCoords.longitude.toFixed(6)}
            </Text>
            <TouchableOpacity
              style={[styles.saveButton, mapResolving && styles.saveButtonDisabled]}
              disabled={mapResolving}
              onPress={confirmPickedLocation}
            >
              {mapResolving ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={styles.saveButtonText}>Use this location</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBackground },
  container: { paddingHorizontal: 16, paddingBottom: 28 },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  label: {
    color: colors.textSecondary,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
  },
  inputArea: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  previewImage: {
    marginTop: 10,
    width: "100%",
    height: 160,
    borderRadius: 10,
    backgroundColor: colors.surfaceSoft,
  },
  photoActions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  photoButton: {
    flex: 1,
    backgroundColor: colors.textPrimary,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  photoButtonDisabled: {
    opacity: 0.7,
  },
  photoButtonText: {
    color: colors.background,
    fontWeight: "700",
  },
  photoRemoveButton: {
    borderWidth: 1,
    borderColor: "#A53B3B",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  photoRemoveText: {
    color: "#A53B3B",
    fontWeight: "700",
  },
  photoHint: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  categoryRow: {
    flexDirection: "row",
    gap: 8,
  },
  categoryChip: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    paddingVertical: 10,
  },
  categoryChipSelected: {
    backgroundColor: colors.warmAccent,
    borderColor: colors.warmAccent,
  },
  categoryChipText: {
    color: colors.textPrimary,
    fontWeight: "700",
  },
  categoryChipTextSelected: {
    color: colors.background,
  },
  slotWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  suggestHint: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  suggestBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.background,
    overflow: "hidden",
  },
  suggestItem: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSoft,
  },
  suggestText: {
    color: colors.textPrimary,
    fontSize: 13,
  },
  mapActions: {
    marginTop: 10,
    gap: 8,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.textPrimary,
    borderRadius: 10,
    paddingVertical: 12,
  },
  mapButtonText: {
    color: colors.background,
    fontWeight: "700",
  },
  coordsHint: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  slotChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: colors.background,
  },
  slotChipSelected: {
    borderColor: colors.warmAccent,
    backgroundColor: colors.warmSurface,
  },
  slotChipText: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  slotChipTextSelected: {
    color: colors.warmAccentDark,
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: colors.warmAccent,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 14,
  },
  saveButtonDisabled: {
    backgroundColor: colors.warmAccentSoft,
  },
  saveButtonText: {
    color: colors.background,
    fontWeight: "700",
    fontSize: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 14,
    gap: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  modalClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSoft,
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontWeight: "500",
  },
  mapFrame: {
    height: 340,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCoords: {
    color: colors.textSecondary,
    fontWeight: "600",
    textAlign: "center",
  },
});
