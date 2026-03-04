import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useFocusEffect } from "@react-navigation/native";
import ServiceCard from "../../../components/ServiceCard";
import CategoryButton from "../../../components/CategoryButton";
import UIDateTimeField from "../../../components/UIDateTimeField";
import UIWheelSelectField from "../../../components/UIWheelSelectField";
import TabTopNotch from "../../../components/TabTopNotch";
import { useI18n } from "../../../lib/i18n";
import { colors } from "../../../lib/theme";
import {
  fetchServices,
  toPriceLabel,
  toTypeKey,
  Service,
} from "../../../lib/services";
import { useAuthState } from "../../../lib/auth";
import { addFavorite, fetchFavoriteIds, removeFavorite } from "../../../lib/favorites";
import { getRecentlyViewedIds } from "../../../lib/recentlyViewed";
import { acceptPolicy, hasAcceptedPolicy } from "../../../lib/policy";
import { PlaceSuggestion, searchPlaceSuggestions } from "../../../lib/geocoding";

export default function GuestHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { user } = useAuthState();

  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [people, setPeople] = useState("");
  const [microservice, setMicroservice] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [destinationCoords, setDestinationCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [searchingDestination, setSearchingDestination] = useState(false);
  const placeholderImage = require("../../../assets/images/react-logo.png");
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showPolicyBanner, setShowPolicyBanner] = useState(false);
  const suggestReqSeq = useRef(0);
  const categories = [
    { label: t("category.rest"), icon: "bed-king" },
    { label: t("category.shower"), icon: "shower" },
    { label: t("category.storage"), icon: "locker" },
  ];
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

  useEffect(() => {
    let mounted = true;
    if (!user?.id) {
      setShowPolicyBanner(false);
      return () => {
        mounted = false;
      };
    }
    hasAcceptedPolicy(user.id).then((accepted) => {
      if (!mounted) return;
      setShowPolicyBanner(!accepted);
    });
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  useFocusEffect(
    useMemo(
      () => () => {
        let mounted = true;
        getRecentlyViewedIds(user?.id).then((ids) => {
          if (!mounted) return;
          setRecentIds(ids);
        });
        return () => {
          mounted = false;
        };
      },
      [user?.id]
    )
  );

  useEffect(() => {
    let isMounted = true;
    const loadLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (!isMounted) return;
      setUserCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    };
    loadLocation().catch(() => null);
    return () => {
      isMounted = false;
    };
  }, []);

  const recentlyViewed = useMemo(() => {
    if (services.length === 0) return [];
    const byId = new Map(services.map((s) => [s.id, s]));
    const viewedFirst = recentIds
      .map((id) => byId.get(id))
      .filter((item): item is Service => Boolean(item));

    const remaining = services.filter((item) => !recentIds.includes(item.id));
    const shuffledRemaining = [...remaining].sort(() => Math.random() - 0.5);

    return [...viewedFirst, ...shuffledRemaining].slice(0, 10);
  }, [recentIds, services]);

  const aroundYou = useMemo(() => {
    if (services.length === 0) return [];
    if (!userCoords) {
      const shuffled = [...services].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 10);
    }
    const withCoords = services.filter(
      (s) => typeof s.latitude === "number" && typeof s.longitude === "number"
    );
    if (withCoords.length === 0) {
      const shuffled = [...services].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 10);
    }
    return [...withCoords]
      .sort(
        (a, b) =>
          haversineMeters(
            userCoords.latitude,
            userCoords.longitude,
            a.latitude as number,
            a.longitude as number
          ) -
          haversineMeters(
            userCoords.latitude,
            userCoords.longitude,
            b.latitude as number,
            b.longitude as number
          )
      )
      .slice(0, 10);
  }, [services, userCoords]);
  useEffect(() => {
    const query = destination.trim();
    if (!showSuggestions || query.length < 3) {
      setLocationSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    const controller = new AbortController();
    const reqId = ++suggestReqSeq.current;
    const timer = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const results = await searchPlaceSuggestions(query, 6);
        if (controller.signal.aborted) return;
        if (reqId === suggestReqSeq.current) {
          setLocationSuggestions(results);
        }
      } catch (error: any) {
        if (error?.name !== "AbortError" && reqId === suggestReqSeq.current) {
          setLocationSuggestions([]);
        }
      } finally {
        if (reqId === suggestReqSeq.current) {
          setLoadingSuggestions(false);
        }
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [destination, showSuggestions]);
  const isSearchEnabled =
    Boolean(selectedCategory ?? microservice) &&
    destination.trim().length > 0 &&
    date.length > 0 &&
    time.length > 0 &&
    people.length > 0;

  // funzione per navigare a ServiceDetails con dati della card
  const goToServiceDetails = (item: Service) => {
    router.push({
      pathname: "/(tabs)/guest/ServiceDetails",
      params: {
        serviceId: item.id,
        destination: item.location,
        timeslot: date && time ? `${date} ${time}` : "",
        people: people || "1",
        microservice: item.title,
      },
    });
  };
  const closeDropdowns = () => {
    setShowSuggestions(false);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <TabTopNotch />
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 42 },
        ]}
      >
        <Text style={styles.sectionTitle}>Look for micro-services!</Text>
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
                  color={colors.textPrimary}
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
            <View
              style={[
                styles.inputWithIcon,
                showSuggestions && locationSuggestions.length > 0 && styles.inputWithIconNoGap,
              ]}
            >
              <MaterialCommunityIcons
                name="map-marker"
                size={18}
                color={colors.textSecondary}
              />
              <TextInput
                style={styles.inputField}
                placeholder={t("home.destination")}
                value={destination}
                onChangeText={(text) => {
                  setDestination(text);
                  setDestinationCoords(null);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  closeDropdowns();
                  setShowSuggestions(true);
                }}
              />
            </View>
            {showSuggestions && loadingSuggestions ? (
              <Text style={styles.dropdownLoading}>Searching...</Text>
            ) : null}
            {showSuggestions && locationSuggestions.length > 0 && (
              <View style={styles.dropdown}>
                {locationSuggestions.map((item) => (
                  <TouchableOpacity
                    key={`${item.label}:${item.latitude}:${item.longitude}`}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setDestination(item.label);
                      setDestinationCoords({
                        latitude: item.latitude,
                        longitude: item.longitude,
                      });
                      setShowSuggestions(false);
                    }}
                  >
                    <Text>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
              <View style={[styles.row, styles.fieldGap]}>
                <View style={styles.half}>
                  <UIDateTimeField
                    mode="date"
                    placeholder={t("home.date")}
                    value={date}
                    onChange={setDate}
                  />
                </View>
                <View style={styles.half}>
                  <UIDateTimeField
                    mode="time"
                    placeholder={t("home.time")}
                    value={time}
                    onChange={setTime}
                  />
                </View>
              </View>
              <View style={styles.fieldGap}>
                <UIWheelSelectField
                  placeholder={t("home.people")}
                  value={people}
                  options={["1", "2", "3", "4+"]}
                  onChange={setPeople}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.searchButton,
                  (!isSearchEnabled || searchingDestination) && styles.searchButtonDisabled,
                ]}
                onPress={async () => {
                  closeDropdowns();
                  let coords = destinationCoords;
                  if (!coords && destination.trim().length >= 3) {
                    setSearchingDestination(true);
                    const suggestions = await searchPlaceSuggestions(destination, 1);
                    setSearchingDestination(false);
                    if (suggestions.length > 0) {
                      coords = {
                        latitude: suggestions[0].latitude,
                        longitude: suggestions[0].longitude,
                      };
                    }
                  }
                  router.push({
                    pathname: "/(tabs)/guest/SearchResults",
                    params: {
                      destination,
                      destinationLat: coords ? String(coords.latitude) : "",
                      destinationLon: coords ? String(coords.longitude) : "",
                      timeslot: date && time ? `${date} ${time}` : "",
                      people,
                      microservice: selectedCategory ?? microservice,
                    },
                  });
                }}
                disabled={!isSearchEnabled || searchingDestination}
              >
                <Text style={styles.searchButtonText}>
                  {searchingDestination ? "Searching..." : t("home.search")}
                </Text>
              </TouchableOpacity>
          </View>
        </View>

        {/* Recently viewed */}
        <Text style={styles.sectionTitle}>{t("home.recentlyViewed")}</Text>
        <FlatList
          data={loadingServices ? [] : recentlyViewed}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          removeClippedSubviews
          style={styles.horizontalList}
          contentContainerStyle={styles.horizontalListContent}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={5}
          renderItem={({ item }) => (
            <ServiceCard
              onPress={() => goToServiceDetails(item)}
              title={item.title}
              price={toPriceLabel(item.price_eur)}
              location={item.location}
              imageSource={
                item.image_url ? { uri: item.image_url } : placeholderImage
              }
              meta={t(toTypeKey(item.category))}
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
            />
          )}
        />

        {/* Around you */}
        <Text style={styles.sectionTitle}>{t("home.aroundYou")}</Text>
        <FlatList
          data={loadingServices ? [] : aroundYou}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          removeClippedSubviews
          style={styles.horizontalList}
          contentContainerStyle={styles.horizontalListContent}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={5}
          renderItem={({ item }) => (
            <ServiceCard
              onPress={() => goToServiceDetails(item)}
              title={item.title}
              price={toPriceLabel(item.price_eur)}
              location={item.location}
              imageSource={
                item.image_url ? { uri: item.image_url } : placeholderImage
              }
              meta={t(toTypeKey(item.category))}
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
            />
          )}
        />
      </ScrollView>
      {showPolicyBanner ? (
        <View style={styles.policyOverlay}>
          <View style={styles.policyCard}>
            <Text style={styles.policyTitle}>{t("policy.title")}</Text>
            <Text style={styles.policyText}>
              {t("policy.line1")}
            </Text>
            <Text style={styles.policyText}>
              {t("policy.line2")}
            </Text>
            <Text style={styles.policyText}>
              {t("policy.line3")}
            </Text>
            <TouchableOpacity
              style={styles.policyAcceptButton}
              onPress={async () => {
                await acceptPolicy(user?.id);
                setShowPolicyBanner(false);
              }}
            >
              <Text style={styles.policyAcceptText}>{t("policy.accept")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBackground },
  container: { padding: 16, paddingBottom: 24 },
  brandBar: {
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.textPrimary,
    marginBottom: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  categories: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  searchContainer: {
    marginBottom: 4,
  },
  searchExpanded: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.border,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  categoryBadgeText: {
    fontWeight: "600",
    color: colors.textPrimary,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 12,
    color: colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: colors.background,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: colors.background,
  },
  inputWithIconNoGap: {
    marginBottom: 0,
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
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.background,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fieldGap: {
    marginBottom: 10,
  },
  selectLabel: {
    color: colors.textPrimary,
  },
  dropdown: {
    marginTop: 0,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surfaceSoft,
    overflow: "hidden",
  },
  dropdownLoading: {
    marginTop: 6,
    marginBottom: 2,
    color: colors.textSecondary,
    fontSize: 12,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSoft,
  },
  searchButton: {
    marginTop: 8,
    padding: 14,
    backgroundColor: colors.warmAccent,
    borderRadius: 8,
    alignItems: "center",
  },
  searchButtonDisabled: {
    backgroundColor: colors.warmAccentSoft,
  },
  searchButtonText: {
    color: colors.background,
    fontWeight: "700",
  },
  horizontalList: {
    overflow: "visible",
  },
  horizontalListContent: {
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  policyOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,78,78,0.25)",
  },
  policyCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    width: "100%",
    maxWidth: 420,
    padding: 14,
    gap: 8,
  },
  policyTitle: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 16,
  },
  policyText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  policyAcceptButton: {
    marginTop: 6,
    backgroundColor: colors.warmAccent,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  policyAcceptText: {
    color: colors.background,
    fontWeight: "700",
  },
});

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

