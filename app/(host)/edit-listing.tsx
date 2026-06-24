import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../lib/theme-context";
import { type ThemeColors } from "../../lib/theme";
import { useI18n } from "../../lib/i18n";
import {
  fetchHostListingById,
  fetchServiceSlots,
  updateHostListing,
} from "../../lib/host";
import type { ServiceAmenities } from "../../lib/services";
import { useAppDialog } from "../../components/AppDialogProvider";
import { useAuthState } from "../../lib/auth";
import { pickAndUploadListingImage } from "../../lib/listingImage";
import { type PlaceSuggestion } from "../../lib/geocoding";
import { fetchServiceReviews, replyToReview, type ServiceReview } from "../../lib/reviews";
import LocationPickerModal from "../../components/LocationPickerModal";

const HEADER_COLOR = "#4F9B9B";
const IMAGE_HEIGHT = 240;

const CATEGORY_COLORS: Record<string, string> = {
  rest: "#1A4F8A",
  shower: "#5BB5CC",
  storage: "#C8930A",
};
const CATEGORY_ICONS: Record<string, string> = {
  rest: "bed-king",
  shower: "shower",
  storage: "locker",
};

const SLOT_OPTIONS = Array.from({ length: 18 }, (_, i) => {
  const h = 9 + Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

const CATEGORIES: ("rest" | "shower" | "storage")[] = ["rest", "shower", "storage"];

function parsePrice(value: string) {
  const parsed = Number(value.replace(",", ".").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseImageUrls(imageUrl: string | null | undefined): string[] {
  if (!imageUrl) return [];
  if (imageUrl.startsWith("[")) {
    try { return JSON.parse(imageUrl); } catch { return [imageUrl]; }
  }
  return [imageUrl];
}

function serializeImageUrls(urls: string[]): string | null {
  if (urls.length === 0) return null;
  if (urls.length === 1) return urls[0];
  return JSON.stringify(urls);
}

type ReplyState = { text: string; editing: boolean; saving: boolean };

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.screenBackground },

    header: {
      position: "absolute",
      top: 0, left: 0, right: 0,
      zIndex: 10,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
      backgroundColor: HEADER_COLOR,
    },
    headerBtn: {
      width: 36, height: 36, borderRadius: 18,
      alignItems: "center", justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      fontSize: 15, fontWeight: "700",
      fontFamily: "Baloo2_700Bold",
      color: "#fff",
    },

    scroll: { flex: 1 },
    container: { paddingBottom: 40 },

    // Hero gallery
    galleryWrap: {
      height: IMAGE_HEIGHT,
      backgroundColor: c.surfaceSoft,
      overflow: "hidden",
    },
    galleryEmpty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    galleryEmptyText: {
      color: c.textMuted,
      fontWeight: "600",
      fontSize: 14,
    },
    galleryDots: {
      position: "absolute",
      bottom: 8,
      left: 0,
      right: 0,
      flexDirection: "row",
      justifyContent: "center",
      gap: 4,
    },
    galleryDot: {
      width: 6, height: 6, borderRadius: 3,
    },
    removeImageBtn: {
      position: "absolute",
      top: 10,
      right: 10,
      backgroundColor: "rgba(0,0,0,0.5)",
      borderRadius: 12,
      width: 26, height: 26,
      alignItems: "center", justifyContent: "center",
    },

    // Content
    content: { paddingHorizontal: 20 },

    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
    },
    loadingText: {
      color: c.textSecondary,
      fontWeight: "600",
    },

    sectionLabel: {
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      color: c.textSecondary,
      marginBottom: 10,
    },
    divider: {
      height: 1,
      backgroundColor: c.divider,
      marginVertical: 20,
    },

    input: {
      backgroundColor: c.surfaceSoft,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: c.textPrimary,
      fontSize: 15,
    },
    inputArea: {
      minHeight: 96,
      textAlignVertical: "top",
      paddingTop: 14,
    },

    // Photo actions
    photoActions: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 6,
    },
    photoBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: HEADER_COLOR,
      borderRadius: 12,
      paddingVertical: 13,
    },
    photoBtnDisabled: { opacity: 0.45 },
    photoBtnText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 14,
    },
    photoHint: {
      color: c.textSecondary,
      fontSize: 12,
      fontWeight: "500",
    },

    // Category chips
    categoryRow: {
      flexDirection: "row",
      gap: 8,
    },
    categoryChip: {
      flex: 1,
      borderRadius: 12,
      backgroundColor: c.surfaceSoft,
      alignItems: "center",
      paddingVertical: 12,
      gap: 4,
    },
    categoryChipText: {
      color: c.textSecondary,
      fontWeight: "700",
      fontSize: 13,
    },
    categoryChipTextSelected: { color: "#fff" },

    // Price
    priceRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    priceInput: {
      flex: 1,
      backgroundColor: c.surfaceSoft,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: c.textPrimary,
      fontSize: 20,
      fontWeight: "700",
    },
    currencyLabel: {
      fontSize: 16,
      fontWeight: "700",
      color: c.textSecondary,
    },

    // Location field (tap-to-open)
    locationField: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    locationFieldText: {
      flex: 1,
      fontSize: 15,
      color: c.textPrimary,
    },
    coordsHint: {
      color: c.textSecondary,
      fontSize: 12,
      fontWeight: "500",
      marginTop: 6,
      textAlign: "center",
    },

    // Chips
    chipWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: c.surfaceSoft,
    },
    chipSelected: { backgroundColor: c.warmAccent },
    chipText: { color: c.textSecondary, fontWeight: "700", fontSize: 13 },
    chipTextSelected: { color: "#fff" },

    // Cancellation
    cancellationRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      alignItems: "center",
    },
    cancellationInput: {
      backgroundColor: c.surfaceSoft,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
      minWidth: 72,
      textAlign: "center",
      color: c.textPrimary,
      fontWeight: "700",
      fontSize: 13,
    },

    // Amenities dimensions row
    dimensionsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },
    dimensionsLabel: {
      color: c.textSecondary,
      fontWeight: "600",
      fontSize: 13,
    },
    dimensionsInput: {
      flex: 1,
      backgroundColor: c.surfaceSoft,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      color: c.textPrimary,
      fontSize: 13,
    },

    // Reviews
    reviewsHint: {
      color: c.textSecondary,
      fontSize: 13,
      fontWeight: "500",
    },
    reviewCard: {
      borderRadius: 12,
      backgroundColor: c.surfaceSoft,
      padding: 14,
      gap: 6,
    },
    reviewHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    reviewAuthor: {
      color: c.textPrimary,
      fontWeight: "700",
      fontSize: 13,
    },
    scoreRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    reviewScore: {
      color: c.warmAccentDark,
      fontWeight: "700",
      fontSize: 13,
    },
    reviewBody: {
      color: c.textSecondary,
      fontWeight: "500",
      lineHeight: 19,
      fontSize: 13,
    },

    // Reply
    replyDivider: {
      height: 1,
      backgroundColor: c.divider,
      marginTop: 8,
      marginBottom: 4,
    },
    replyDisplay: {
      flexDirection: "row",
      gap: 6,
      alignItems: "flex-start",
      paddingRight: 8,
    },
    replyText: {
      flex: 1,
      fontSize: 13,
      color: c.textSecondary,
      fontWeight: "500",
      lineHeight: 18,
    },
    replyActionText: {
      fontSize: 12,
      fontWeight: "700",
      color: HEADER_COLOR,
      marginTop: 4,
    },
    replyForm: {
      marginTop: 4,
    },
    replyInput: {
      backgroundColor: c.screenBackground,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: c.textPrimary,
      fontSize: 13,
      minHeight: 64,
      textAlignVertical: "top",
    },
    replyBtns: {
      flexDirection: "row",
      gap: 8,
      marginTop: 8,
    },
    replyBtn: {
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      alignItems: "center",
    },
    replyBtnText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 13,
    },

    // Save
    saveButton: {
      marginTop: 28,
      backgroundColor: c.warmAccent,
      borderRadius: 14,
      alignItems: "center",
      paddingVertical: 16,
    },
    saveButtonDisabled: { backgroundColor: c.warmAccentSoft },
    saveButtonText: {
      color: "#fff",
      fontWeight: "700",
      fontFamily: "Baloo2_700Bold",
      fontSize: 16,
    },
  });
}

export default function HostEditListing() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { t } = useI18n();
  const dialog = useAppDialog();
  const { user } = useAuthState();
  const { serviceId } = useLocalSearchParams<{ serviceId?: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [category, setCategory] = useState<"rest" | "shower" | "storage">("rest");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [replyStates, setReplyStates] = useState<Record<string, ReplyState>>({});

  const [cancellationMinutes, setCancellationMinutes] = useState("");
  const [amenTowels, setAmenTowels] = useState(false);
  const [amenHairDryer, setAmenHairDryer] = useState(false);
  const [amenSoap, setAmenSoap] = useState(false);
  const [amenOpen24h, setAmenOpen24h] = useState(false);
  const [amenDimensions, setAmenDimensions] = useState("");
  const [amenQuietLocation, setAmenQuietLocation] = useState(false);
  const [amenBlanket, setAmenBlanket] = useState(false);
  const [amenSofaOrBed, setAmenSofaOrBed] = useState<"sofa" | "bed" | null>(null);
  const [amenToiletAccess, setAmenToiletAccess] = useState(false);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!serviceId) { setLoading(false); return; }
      setLoading(true);
      const [service, serviceSlots] = await Promise.all([
        fetchHostListingById(serviceId),
        fetchServiceSlots(serviceId),
      ]);
      if (!mounted) return;
      if (!service) { setLoading(false); return; }
      setTitle(service.title ?? "");
      setDescription(
        service.description ??
          `${service.title} near ${service.location} is designed for fast, reliable access with clear check-in flow.`
      );
      setImageUrls(parseImageUrls(service.image_url));
      setCategory(service.category);
      setPrice(String(service.price_eur ?? ""));
      setLocation(service.location ?? "");
      setLatitude(
        typeof service.latitude === "number" && Number.isFinite(service.latitude)
          ? String(service.latitude) : ""
      );
      setLongitude(
        typeof service.longitude === "number" && Number.isFinite(service.longitude)
          ? String(service.longitude) : ""
      );
      setSlots(serviceSlots);
      setCancellationMinutes(service.cancellation_minutes != null ? String(service.cancellation_minutes) : "");
      const a = service.amenities ?? {};
      setAmenTowels(a.towels_included ?? false);
      setAmenHairDryer(a.hair_dryer ?? false);
      setAmenSoap(a.soap_included ?? false);
      setAmenOpen24h(a.open_24h ?? false);
      setAmenDimensions(a.dimensions ?? "");
      setAmenQuietLocation(a.quiet_location ?? false);
      setAmenBlanket(a.blanket ?? false);
      setAmenSofaOrBed(a.sofa_or_bed ?? null);
      setAmenToiletAccess(a.toilet_access ?? false);
      setLoading(false);
    };
    run();
    return () => { mounted = false; };
  }, [serviceId]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      if (!serviceId) { setReviews([]); return () => { mounted = false; }; }
      setLoadingReviews(true);
      fetchServiceReviews(serviceId).then((data) => {
        if (!mounted) return;
        setReviews(data);
        const initial: Record<string, ReplyState> = {};
        for (const r of data) {
          initial[r.id] = { text: r.host_reply ?? "", editing: false, saving: false };
        }
        setReplyStates(initial);
        setLoadingReviews(false);
      });
      return () => { mounted = false; };
    }, [serviceId])
  );

  const canSave = useMemo(
    () => Boolean(title.trim()) && Boolean(location.trim()) && parsePrice(price) > 0 && slots.length > 0,
    [location, price, slots.length, title]
  );

  const toggleSlot = (value: string) =>
    setSlots((prev) => prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value].sort());

  const buildAmenities = (): ServiceAmenities | null => {
    const a: ServiceAmenities = {};
    if (category === "rest") {
      if (amenQuietLocation) a.quiet_location = true;
      if (amenBlanket) a.blanket = true;
      if (amenSofaOrBed) a.sofa_or_bed = amenSofaOrBed;
      if (amenToiletAccess) a.toilet_access = true;
    } else if (category === "shower") {
      if (amenTowels) a.towels_included = true;
      if (amenHairDryer) a.hair_dryer = true;
      if (amenSoap) a.soap_included = true;
      if (amenToiletAccess) a.toilet_access = true;
    } else if (category === "storage") {
      if (amenDimensions.trim()) a.dimensions = amenDimensions.trim();
      if (amenOpen24h) a.open_24h = true;
    }
    return Object.keys(a).length > 0 ? a : null;
  };

  const onSave = async () => {
    if (!serviceId || !canSave) return;
    setSaving(true);
    const parsedCancellation = cancellationMinutes.trim() ? parseInt(cancellationMinutes, 10) : null;
    const err = await updateHostListing({
      serviceId,
      title: title.trim(),
      description: description.trim(),
      category,
      price_eur: parsePrice(price),
      location: location.trim(),
      latitude: latitude.trim() ? Number(latitude) : null,
      longitude: longitude.trim() ? Number(longitude) : null,
      image_url: serializeImageUrls(imageUrls),
      slotTimes: slots,
      cancellationMinutes: Number.isFinite(parsedCancellation) ? parsedCancellation : null,
      amenities: buildAmenities(),
    });
    setSaving(false);
    if (err) { await dialog.alert(t("host.listings.editTitle"), err); return; }
    await dialog.alert(t("host.listings.editTitle"), t("host.listings.saved"));
    router.back();
  };

  const onPickPhoto = async () => {
    if (imageUrls.length >= 5) return;
    setUploadingImage(true);
    const result = await pickAndUploadListingImage(user?.id);
    setUploadingImage(false);
    if (result.error) { await dialog.alert(t("host.field.image"), result.error); return; }
    if (result.url) setImageUrls((prev) => [...prev, result.url!].slice(0, 5));
  };

  const handleLocationSelect = (place: PlaceSuggestion) => {
    setLocation(place.label);
    setLatitude(String(place.latitude));
    setLongitude(String(place.longitude));
  };

  const updateReplyState = (id: string, patch: Partial<ReplyState>) =>
    setReplyStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const headerH = insets.top + 52;

  const currentCoords = useMemo(() => {
    const lat = Number(latitude);
    const lon = Number(longitude);
    return Number.isFinite(lat) && Number.isFinite(lon)
      ? { latitude: lat, longitude: lon }
      : undefined;
  }, [latitude, longitude]);

  return (
    <View style={styles.screen}>
      {/* Fixed teal header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("host.listings.editTitle")}</Text>
        {saving ? <ActivityIndicator size="small" color="#fff" /> : null}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingTop: headerH }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Hero image gallery ───────────────── */}
        <View style={styles.galleryWrap}>
          {imageUrls.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
                setActiveImageIdx(Math.max(0, Math.min(idx, imageUrls.length - 1)));
              }}
              scrollEventThrottle={16}
            >
              {imageUrls.map((url, i) => (
                <View key={i} style={{ width: screenWidth, height: IMAGE_HEIGHT }}>
                  <Image source={{ uri: url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => {
                      setImageUrls((prev) => prev.filter((_, idx) => idx !== i));
                      setActiveImageIdx(0);
                    }}
                  >
                    <MaterialCommunityIcons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.galleryEmpty}>
              <MaterialCommunityIcons name="image-plus" size={40} color={colors.textMuted} />
              <Text style={styles.galleryEmptyText}>Add photos</Text>
            </View>
          )}
          {imageUrls.length > 1 && (
            <View style={styles.galleryDots}>
              {imageUrls.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.galleryDot,
                    { backgroundColor: i === activeImageIdx ? "#fff" : "rgba(255,255,255,0.4)" },
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* ── Scroll content ───────────────────── */}
        <View style={[styles.content, { paddingTop: 20 }]}>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.textSecondary} />
              <Text style={styles.loadingText}>{t("host.loading")}</Text>
            </View>
          ) : null}

          {/* Photo actions */}
          <Text style={styles.sectionLabel}>
            {t("host.field.image")} ({imageUrls.length}/5)
          </Text>
          <View style={styles.photoActions}>
            <TouchableOpacity
              style={[styles.photoBtn, (uploadingImage || imageUrls.length >= 5) && styles.photoBtnDisabled]}
              onPress={onPickPhoto}
              disabled={uploadingImage || imageUrls.length >= 5}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="image-plus" size={18} color="#fff" />
                  <Text style={styles.photoBtnText}>
                    {imageUrls.length === 0 ? "Choose photo" : "Add another"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.photoHint}>
            {imageUrls.length >= 5
              ? "Maximum 5 photos reached"
              : `${5 - imageUrls.length} slot${5 - imageUrls.length !== 1 ? "s" : ""} remaining`}
          </Text>

          <View style={styles.divider} />

          {/* Title */}
          <Text style={styles.sectionLabel}>{t("host.field.title")}</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Give your listing a clear name"
            placeholderTextColor={colors.textMuted}
          />

          <View style={{ height: 14 }} />

          {/* Description */}
          <Text style={styles.sectionLabel}>{t("host.field.description")}</Text>
          <TextInput
            style={[styles.input, styles.inputArea]}
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="Describe the experience guests can expect…"
            placeholderTextColor={colors.textMuted}
          />

          <View style={styles.divider} />

          {/* Category */}
          <Text style={styles.sectionLabel}>{t("host.field.serviceType")}</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.categoryChip,
                  category === item && { backgroundColor: CATEGORY_COLORS[item] },
                ]}
                onPress={() => setCategory(item)}
              >
                <MaterialCommunityIcons
                  name={CATEGORY_ICONS[item] as any}
                  size={20}
                  color={category === item ? "#fff" : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    category === item && styles.categoryChipTextSelected,
                  ]}
                >
                  {t(`category.${item}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Price */}
          <Text style={styles.sectionLabel}>{t("host.field.price")}</Text>
          <View style={styles.priceRow}>
            <TextInput
              style={styles.priceInput}
              value={price}
              onChangeText={(next) => setPrice(next.replace(",", "."))}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.currencyLabel}>€ / slot</Text>
          </View>

          <View style={styles.divider} />

          {/* Location */}
          <Text style={styles.sectionLabel}>{t("host.field.location")}</Text>
          <TouchableOpacity
            style={[styles.input, styles.locationField]}
            onPress={() => setLocationModalOpen(true)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="map-marker"
              size={16}
              color={location ? colors.textPrimary : colors.textMuted}
            />
            <Text
              style={[styles.locationFieldText, !location && { color: colors.textMuted }]}
              numberOfLines={1}
            >
              {location || "Search address or place name"}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          {latitude && longitude ? (
            <Text style={styles.coordsHint}>
              {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
            </Text>
          ) : null}

          <View style={styles.divider} />

          {/* Time slots */}
          <Text style={styles.sectionLabel}>{t("host.field.slots")}</Text>
          <View style={styles.chipWrap}>
            {SLOT_OPTIONS.map((time) => (
              <TouchableOpacity
                key={time}
                style={[styles.chip, slots.includes(time) && styles.chipSelected]}
                onPress={() => toggleSlot(time)}
              >
                <Text style={[styles.chipText, slots.includes(time) && styles.chipTextSelected]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Cancellation */}
          <Text style={styles.sectionLabel}>{t("host.field.cancellation")}</Text>
          <View style={styles.cancellationRow}>
            {[
              { value: 30, label: "30m" },
              { value: 60, label: "1h" },
              { value: 120, label: "2h" },
              { value: 240, label: "4h" },
            ].map(({ value, label }) => (
              <TouchableOpacity
                key={value}
                style={[styles.chip, cancellationMinutes === String(value) && styles.chipSelected]}
                onPress={() => setCancellationMinutes(cancellationMinutes === String(value) ? "" : String(value))}
              >
                <Text style={[styles.chipText, cancellationMinutes === String(value) && styles.chipTextSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
            <TextInput
              style={styles.cancellationInput}
              value={cancellationMinutes}
              onChangeText={(v) => setCancellationMinutes(v.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              placeholder="—"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.divider} />

          {/* Amenities */}
          <Text style={styles.sectionLabel}>{t("host.field.amenities")}</Text>
          <View style={styles.chipWrap}>
            {category === "rest" && (
              <>
                <TouchableOpacity
                  style={[styles.chip, amenQuietLocation && styles.chipSelected]}
                  onPress={() => setAmenQuietLocation((v) => !v)}
                >
                  <Text style={[styles.chipText, amenQuietLocation && styles.chipTextSelected]}>
                    {t("amenity.quietLocation")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chip, amenBlanket && styles.chipSelected]}
                  onPress={() => setAmenBlanket((v) => !v)}
                >
                  <Text style={[styles.chipText, amenBlanket && styles.chipTextSelected]}>
                    {t("amenity.blanket")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chip, amenSofaOrBed === "sofa" && styles.chipSelected]}
                  onPress={() => setAmenSofaOrBed(amenSofaOrBed === "sofa" ? null : "sofa")}
                >
                  <Text style={[styles.chipText, amenSofaOrBed === "sofa" && styles.chipTextSelected]}>
                    {t("host.field.sofa")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chip, amenSofaOrBed === "bed" && styles.chipSelected]}
                  onPress={() => setAmenSofaOrBed(amenSofaOrBed === "bed" ? null : "bed")}
                >
                  <Text style={[styles.chipText, amenSofaOrBed === "bed" && styles.chipTextSelected]}>
                    {t("host.field.bed")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chip, amenToiletAccess && styles.chipSelected]}
                  onPress={() => setAmenToiletAccess((v) => !v)}
                >
                  <Text style={[styles.chipText, amenToiletAccess && styles.chipTextSelected]}>
                    {t("amenity.toiletAccess")}
                  </Text>
                </TouchableOpacity>
              </>
            )}
            {category === "shower" && (
              <>
                <TouchableOpacity
                  style={[styles.chip, amenTowels && styles.chipSelected]}
                  onPress={() => setAmenTowels((v) => !v)}
                >
                  <Text style={[styles.chipText, amenTowels && styles.chipTextSelected]}>
                    {t("amenity.towels")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chip, amenHairDryer && styles.chipSelected]}
                  onPress={() => setAmenHairDryer((v) => !v)}
                >
                  <Text style={[styles.chipText, amenHairDryer && styles.chipTextSelected]}>
                    {t("amenity.hairDryer")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chip, amenSoap && styles.chipSelected]}
                  onPress={() => setAmenSoap((v) => !v)}
                >
                  <Text style={[styles.chipText, amenSoap && styles.chipTextSelected]}>
                    {t("amenity.soap")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chip, amenToiletAccess && styles.chipSelected]}
                  onPress={() => setAmenToiletAccess((v) => !v)}
                >
                  <Text style={[styles.chipText, amenToiletAccess && styles.chipTextSelected]}>
                    {t("amenity.toiletAccess")}
                  </Text>
                </TouchableOpacity>
              </>
            )}
            {category === "storage" && (
              <>
                <TouchableOpacity
                  style={[styles.chip, amenOpen24h && styles.chipSelected]}
                  onPress={() => setAmenOpen24h((v) => !v)}
                >
                  <Text style={[styles.chipText, amenOpen24h && styles.chipTextSelected]}>
                    {t("amenity.open24h")}
                  </Text>
                </TouchableOpacity>
                <View style={styles.dimensionsRow}>
                  <Text style={styles.dimensionsLabel}>{t("host.field.dimensions")}</Text>
                  <TextInput
                    style={styles.dimensionsInput}
                    value={amenDimensions}
                    onChangeText={setAmenDimensions}
                    placeholder="es. 60×40×30cm"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </>
            )}
          </View>

          <View style={styles.divider} />

          {/* Reviews */}
          <Text style={styles.sectionLabel}>{t("host.reviews.title")}</Text>
          <View style={{ gap: 10 }}>
            {loadingReviews ? (
              <Text style={styles.reviewsHint}>{t("host.reviews.loading")}</Text>
            ) : reviews.length === 0 ? (
              <Text style={styles.reviewsHint}>{t("host.reviews.empty")}</Text>
            ) : (
              reviews.map((review) => {
                const rs = replyStates[review.id] ?? { text: review.host_reply ?? "", editing: false, saving: false };
                return (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewAuthor}>{review.author_name}</Text>
                      <View style={styles.scoreRow}>
                        <MaterialCommunityIcons name="star" size={13} color={colors.warmAccentDark} />
                        <Text style={styles.reviewScore}>{review.rating_10}/10</Text>
                      </View>
                    </View>
                    <Text style={styles.reviewBody}>{review.description}</Text>

                    {/* Reply section */}
                    <View style={styles.replyDivider} />
                    {rs.editing ? (
                      <View style={styles.replyForm}>
                        <TextInput
                          style={[styles.replyInput, { borderWidth: 1, borderColor: colors.divider }]}
                          value={rs.text}
                          onChangeText={(v) => updateReplyState(review.id, { text: v })}
                          multiline
                          placeholder="Write your reply…"
                          placeholderTextColor={colors.textMuted}
                        />
                        <View style={styles.replyBtns}>
                          <TouchableOpacity
                            style={[styles.replyBtn, { backgroundColor: HEADER_COLOR }, rs.saving && { opacity: 0.6 }]}
                            disabled={rs.saving}
                            onPress={async () => {
                              updateReplyState(review.id, { saving: true });
                              const err = await replyToReview(review.id, rs.text);
                              if (err) {
                                updateReplyState(review.id, { saving: false });
                                await dialog.alert("Reply", err);
                              } else {
                                updateReplyState(review.id, { saving: false, editing: false });
                              }
                            }}
                          >
                            {rs.saving ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Text style={styles.replyBtnText}>Save</Text>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.replyBtn, { backgroundColor: colors.surfaceSoft }]}
                            onPress={() => updateReplyState(review.id, { editing: false, text: review.host_reply ?? "" })}
                          >
                            <Text style={[styles.replyBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View>
                        {rs.text ? (
                          <View style={styles.replyDisplay}>
                            <MaterialCommunityIcons name="reply" size={13} color={HEADER_COLOR} />
                            <Text style={styles.replyText}>{rs.text}</Text>
                          </View>
                        ) : null}
                        <TouchableOpacity onPress={() => updateReplyState(review.id, { editing: true, text: review.host_reply ?? "" })}>
                          <Text style={styles.replyActionText}>{rs.text ? "Edit reply" : "Reply"}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>

          {/* Save */}
          <TouchableOpacity
            style={[styles.saveButton, (!canSave || saving) && styles.saveButtonDisabled]}
            onPress={onSave}
            disabled={!canSave || saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? t("auth.loading") : t("host.listings.saveChanges")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Shared location picker modal */}
      <LocationPickerModal
        visible={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onSelect={handleLocationSelect}
        accentColor={HEADER_COLOR}
        showSuggested={false}
        initialCoords={currentCoords}
      />
    </View>
  );
}
