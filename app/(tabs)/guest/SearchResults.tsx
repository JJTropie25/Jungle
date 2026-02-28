import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ServiceCard from "../../../components/ServiceCard";
import ResultsActionBar from "../../../components/ResultsActionBar";
import ResultsMap from "../../../components/ResultsMap";
import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../../../lib/i18n";
import { colors } from "../../../lib/theme";
import {
  fetchServices,
  Service,
  toDistanceLabel,
  toPriceLabel,
  toTypeKey,
} from "../../../lib/services";
import { useAuthState } from "../../../lib/auth";
import { addFavorite, fetchFavoriteIds, removeFavorite } from "../../../lib/favorites";

export default function SearchResults() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language } = useI18n();
  const { user } = useAuthState();
  const placeholderImage = require("../../../assets/images/react-logo.png");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<
    "priceUp" | "priceDown" | "topRated" | "nearest"
  >("topRated");
  const [priceMax, setPriceMax] = useState(500);
  const [distanceMax, setDistanceMax] = useState(50);
  const [ratingMin, setRatingMin] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const mapScrollRef = useRef<FlatList<Service>>(null);
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

  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoadingServices(true);
    fetchServices()
      .then((data) => {
        if (!isMounted) return;
        setServices(data);
        setLoadingServices(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoadingServices(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    fetchFavoriteIds(user.id).then((ids) => {
      if (!isMounted) return;
      setFavoriteIds(ids);
    });
    return () => {
      isMounted = false;
    };
  }, [user]);

  const normalizedCategory = useMemo(() => {
    if (!microservice) return null;
    const value = String(microservice).toLowerCase();
    if (value.includes("rest") || value.includes(t("category.rest").toLowerCase())) {
      return "rest";
    }
    if (
      value.includes("shower") ||
      value.includes(t("category.shower").toLowerCase())
    ) {
      return "shower";
    }
    if (
      value.includes("storage") ||
      value.includes(t("category.storage").toLowerCase())
    ) {
      return "storage";
    }
    return null;
  }, [microservice, t]);

  const filteredResults = useMemo(() => {
    let items = services;
    if (normalizedCategory) {
      items = items.filter((s) => s.category === normalizedCategory);
    }
    if (destination) {
      const needle = destination.toLowerCase();
      items = items.filter((s) => s.location.toLowerCase().includes(needle));
    }
    items = items.filter((s) => s.price_eur <= priceMax);
    items = items.filter((s) => (s.distance_meters ?? 0) <= distanceMax * 1000);
    items = items.filter((s) => (s.rating ?? 0) >= ratingMin);
    if (sortBy === "priceUp") {
      items = [...items].sort((a, b) => a.price_eur - b.price_eur);
    } else if (sortBy === "priceDown") {
      items = [...items].sort((a, b) => b.price_eur - a.price_eur);
    } else if (sortBy === "topRated") {
      items = [...items].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sortBy === "nearest") {
      items = [...items].sort(
        (a, b) => (a.distance_meters ?? 0) - (b.distance_meters ?? 0)
      );
    }
    return items;
  }, [
    services,
    normalizedCategory,
    destination,
    priceMax,
    distanceMax,
    ratingMin,
    sortBy,
  ]);

  const mapResults = useMemo(
    () =>
      filteredResults.filter(
        (item) =>
          typeof item.latitude === "number" &&
          typeof item.longitude === "number"
      ),
    [filteredResults]
  );
  const resultsByIndex = useMemo(() => filteredResults, [filteredResults]);

  useEffect(() => {
    if (viewMode === "map" && !selectedTitle && resultsByIndex.length > 0) {
      setSelectedTitle(resultsByIndex[0].title);
    }
  }, [resultsByIndex, selectedTitle, viewMode]);

  const { summaryDate, summaryTime } = useMemo(() => {
    const raw = String(timeslot ?? "").trim();
    if (!raw) return { summaryDate: "-", summaryTime: "-" };

    const isoLike = raw.match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}:\d{2}))?$/
    );
    if (isoLike) {
      const [, y, m, d, hhmm] = isoLike;
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      const locale =
        language === "it"
          ? "it-IT"
          : language === "es"
          ? "es-ES"
          : language === "zh"
          ? "zh-CN"
          : "en-US";
      let month = new Intl.DateTimeFormat(locale, { month: "short" }).format(date);
      month = month.charAt(0).toUpperCase() + month.slice(1);
      if (!month.endsWith(".")) month += ".";
      return {
        summaryDate: `${Number(d)} ${month}`,
        summaryTime: hhmm ?? "-",
      };
    }

    if (/^\d{2}:\d{2}$/.test(raw)) {
      return { summaryDate: "-", summaryTime: raw };
    }

    const [maybeDate, maybeTime] = raw.split(" ");
    return {
      summaryDate: maybeDate || "-",
      summaryTime: maybeTime || "-",
    };
  }, [language, timeslot]);

  const SummaryLine = () => (
    <View style={styles.summaryLine}>
      <Text style={styles.summaryItem}>{microservice ?? "-"}</Text>
      <Text style={styles.summarySep}>|</Text>
      <Text style={styles.summaryItem}>{destination ?? "-"}</Text>
      <Text style={styles.summarySep}>|</Text>
      <Text style={styles.summaryItem}>{summaryDate}</Text>
      <Text style={styles.summarySep}>|</Text>
      <Text style={styles.summaryItem}>{summaryTime}</Text>
      <Text style={styles.summarySep}>|</Text>
      <View style={styles.summaryPeople}>
        <MaterialCommunityIcons name="account-group" size={16} color={colors.textPrimary} />
        <Text style={styles.summaryPeopleText}>{people ?? "-"}</Text>
      </View>
    </View>
  );
  const closeMenus = () => {
    setSortOpen(false);
    setFilterOpen(false);
  };

  const priceOptions = useMemo(
    () => Array.from({ length: 101 }, (_, i) => i * 5),
    []
  );
  const distanceOptions = useMemo(
    () => Array.from({ length: 11 }, (_, i) => i * 5),
    []
  );
  const ratingOptions = useMemo(
    () => Array.from({ length: 21 }, (_, i) => i * 0.5),
    []
  );
  const isFilterActive =
    priceMax !== 500 || distanceMax !== 50 || ratingMin !== 0;

  const SortFilterMenus = () => (
    <View style={styles.menuWrap}>
      {sortOpen && (
        <View style={styles.menuBox}>
          {[
            { value: "priceUp", label: t("search.sort.priceUp") },
            { value: "priceDown", label: t("search.sort.priceDown") },
            { value: "topRated", label: t("search.sort.topRated") },
            { value: "nearest", label: t("search.sort.nearest") },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={styles.menuItem}
              onPress={() => {
                setSortBy(opt.value as any);
                setSortOpen(false);
              }}
            >
              <Text style={styles.menuText}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {filterOpen && (
        <View style={styles.menuBox}>
          <View style={styles.sliderBox}>
            <Text style={styles.sliderLabel}>
              {t("search.maxPrice", { value: priceMax })}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.optionRow}
            >
              {priceOptions.map((value) => (
                <TouchableOpacity
                  key={`price-${value}`}
                  style={[
                    styles.optionChip,
                    priceMax === value && styles.optionChipSelected,
                  ]}
                  onPress={() => setPriceMax(value)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      priceMax === value && styles.optionChipTextSelected,
                    ]}
                  >
                    {value}€
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.sliderBox}>
            <Text style={styles.sliderLabel}>
              {t("search.maxDistance", { value: distanceMax })}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.optionRow}
            >
              {distanceOptions.map((value) => (
                <TouchableOpacity
                  key={`distance-${value}`}
                  style={[
                    styles.optionChip,
                    distanceMax === value && styles.optionChipSelected,
                  ]}
                  onPress={() => setDistanceMax(value)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      distanceMax === value && styles.optionChipTextSelected,
                    ]}
                  >
                    {value}km
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.sliderBox}>
            <Text style={styles.sliderLabel}>
              {t("search.minRating", { value: ratingMin })}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.optionRow}
            >
              {ratingOptions.map((value) => (
                <TouchableOpacity
                  key={`rating-${value}`}
                  style={[
                    styles.optionChip,
                    ratingMin === value && styles.optionChipSelected,
                  ]}
                  onPress={() => setRatingMin(value)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      ratingMin === value && styles.optionChipTextSelected,
                    ]}
                  >
                    {value.toFixed(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.applyWrap}>
            <TouchableOpacity
              style={[styles.applyButton, styles.clearButton]}
              onPress={() => {
                setPriceMax(500);
                setDistanceMax(50);
                setRatingMin(0);
              }}
            >
              <Text style={[styles.applyButtonText, styles.clearButtonText]}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setFilterOpen(false)}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      {viewMode === "list" ? (
        <View style={styles.listWrap}>
          <View style={[styles.listHeader, { paddingTop: insets.top + 16 }]}>
            <View style={styles.summaryBox}>
              <TouchableOpacity
                style={styles.summaryBack}
                onPress={() =>
                  router.canGoBack() ? router.back() : router.replace("/(tabs)/guest")
                }
              >
                <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <SummaryLine />
            </View>

            <ResultsActionBar
              actions={[
              {
                label: t(`search.sort.${sortBy}`),
                onPress: () => {
                  setSortOpen((v) => !v);
                  setFilterOpen(false);
                },
              },
              {
                label: t("search.filter"),
                onPress: () => {
                  setFilterOpen((v) => !v);
                  setSortOpen(false);
                },
                badge: isFilterActive,
              },
              {
                label: t("search.map"),
                onPress: () => {
                  closeMenus();
                  setViewMode("map");
                },
              },
            ]}
          />
            <SortFilterMenus />
          </View>

          <FlatList
            data={filteredResults}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.container}
            scrollEnabled={!sortOpen && !filterOpen}
            initialNumToRender={8}
            maxToRenderPerBatch={10}
            windowSize={7}
            ListEmptyComponent={
              <Text style={styles.emptyText}>{t("search.noResults")}</Text>
            }
            renderItem={({ item }) => (
              <ServiceCard
                fullWidth
                horizontal
                containerStyle={styles.card}
                imageStyle={styles.cardImage}
                imageSource={
                  item.image_url ? { uri: item.image_url } : placeholderImage
                }
                title={item.title}
                price={toPriceLabel(item.price_eur)}
                location={item.location}
                meta={`${t(toTypeKey(item.category))} - ${toDistanceLabel(
                  item.distance_meters
                )}`}
                rating={item.rating}
                isFavorite={favoriteIds.has(item.id)}
                onToggleFavorite={async () => {
                  if (!user) return;
                  const next = new Set(favoriteIds);
                  if (next.has(item.id)) {
                    const { error } = await removeFavorite(user.id, item.id);
                    if (error) {
                      console.warn("remove favorite failed", error.message);
                      return;
                    }
                    next.delete(item.id);
                  } else {
                    const { error } = await addFavorite(user.id, item.id);
                    if (error) {
                      console.warn("add favorite failed", error.message);
                      return;
                    }
                    next.add(item.id);
                  }
                  setFavoriteIds(next);
                }}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/guest/ServiceDetails",
                    params: {
                      serviceId: item.id,
                      destination,
                      timeslot,
                      people,
                      microservice: item.title,
                    },
                  })
                }
              />
            )}
          />
        </View>
      ) : (
        <View style={styles.mapContainer}>
          {mapResults.length === 0 ? (
            <View style={styles.emptyMap}>
              <Text style={styles.emptyText}>{t("search.noResults")}</Text>
            </View>
          ) : (
            <ResultsMap
              results={mapResults}
              selectedTitle={selectedTitle}
              onSelect={(title) => {
                const index = resultsByIndex.findIndex((r) => r.title === title);
                if (index >= 0) {
                  mapScrollRef.current?.scrollToOffset({
                    offset: index * CARD_SNAP,
                    animated: true,
                  });
                }
                setSelectedTitle(title);
              }}
            />
          )}

          <View style={[styles.mapTop, { paddingTop: insets.top + 12 }]}>
            <View style={styles.summaryBox}>
              <TouchableOpacity
                style={styles.summaryBack}
                onPress={() =>
                  router.canGoBack() ? router.back() : router.replace("/(tabs)/guest")
                }
              >
                <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <SummaryLine />
            </View>

            <ResultsActionBar
              actions={[
              {
                label: t(`search.sort.${sortBy}`),
                onPress: () => {
                  setSortOpen((v) => !v);
                  setFilterOpen(false);
                },
              },
              {
                label: t("search.filter"),
                onPress: () => {
                  setFilterOpen((v) => !v);
                  setSortOpen(false);
                },
                badge: isFilterActive,
              },
              {
                label: t("search.list"),
                onPress: () => {
                  closeMenus();
                  setViewMode("list");
                },
              },
              ]}
            />
            <SortFilterMenus />
          </View>

          <View style={styles.mapBottom}>
            <FlatList
              ref={mapScrollRef}
              data={filteredResults}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_SNAP}
              decelerationRate="fast"
              snapToAlignment="start"
              contentContainerStyle={styles.mapCards}
              initialNumToRender={6}
              maxToRenderPerBatch={8}
              windowSize={5}
              onMomentumScrollEnd={(e) => {
                const x = e.nativeEvent.contentOffset.x;
                const index = Math.round(x / CARD_SNAP);
                const item = resultsByIndex[index];
                if (item) setSelectedTitle(item.title);
              }}
              renderItem={({ item }) => (
                <ServiceCard
                  horizontal
                  containerStyle={styles.mapCard}
                  imageStyle={styles.mapCardImage}
                  imageSource={
                    item.image_url ? { uri: item.image_url } : placeholderImage
                  }
                  title={item.title}
                  price={toPriceLabel(item.price_eur)}
                  location={item.location}
                  meta={`${t(toTypeKey(item.category))} - ${toDistanceLabel(
                    item.distance_meters
                  )}`}
                  rating={item.rating}
                  isFavorite={favoriteIds.has(item.id)}
                  onToggleFavorite={async () => {
                    if (!user) return;
                    const next = new Set(favoriteIds);
                    if (next.has(item.id)) {
                      const { error } = await removeFavorite(user.id, item.id);
                      if (error) {
                        console.warn("remove favorite failed", error.message);
                        return;
                      }
                      next.delete(item.id);
                    } else {
                      const { error } = await addFavorite(user.id, item.id);
                      if (error) {
                        console.warn("add favorite failed", error.message);
                        return;
                      }
                      next.add(item.id);
                    }
                    setFavoriteIds(next);
                  }}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/guest/ServiceDetails",
                      params: {
                        serviceId: item.id,
                        destination,
                        timeslot,
                        people,
                        microservice: item.title,
                      },
                    })
                  }
                />
              )}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBackground },
  listWrap: { flex: 1 },
  listHeader: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    backgroundColor: colors.background,
  },
  container: {
    padding: 16,
    paddingBottom: 24,
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
  card: {
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  cardImage: { height: 90 },
  mapContainer: { flex: 1 },
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
  mapCards: { paddingRight: 16 },
  mapCard: { width: 260, marginRight: 12 },
  mapCardImage: { height: 80 },
  menuWrap: { gap: 8, marginBottom: 8 },
  menuBox: {
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSoft,
  },
  menuText: { color: colors.textPrimary, fontWeight: "600" },
  sliderBox: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSoft,
  },
  applyWrap: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSoft,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  applyButton: {
    backgroundColor: colors.textPrimary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  clearButton: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  applyButtonText: {
    color: colors.background,
    fontWeight: "700",
  },
  clearButtonText: {
    color: colors.textPrimary,
  },
  optionRow: {
    gap: 8,
    paddingRight: 8,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  optionChipSelected: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  optionChipText: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 12,
  },
  optionChipTextSelected: {
    color: colors.background,
  },
  sliderLabel: {
    fontWeight: "600",
    marginBottom: 6,
    color: colors.textPrimary,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 24,
    fontWeight: "600",
  },
  emptyMap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },
});

