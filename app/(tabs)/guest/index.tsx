import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
} from "react-native";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useFocusEffect } from "@react-navigation/native";
import ServiceCard from "../../../components/ServiceCard";
import CategoryButton from "../../../components/CategoryButton";
import UIDateTimeField from "../../../components/UIDateTimeField";
import UIWheelSelectField from "../../../components/UIWheelSelectField";
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
  const placeholderImage = require("../../../assets/images/react-logo.png");
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const categories = [
    { label: t("category.rest"), icon: "bed-king" },
    { label: t("category.shower"), icon: "shower" },
    { label: t("category.storage"), icon: "locker" },
  ];
  const logoModule = require("../../../assets/images/Jungle_Logo_Green.svg") as any;
  const Logo = (logoModule?.default ?? logoModule) as any;
  const canRenderSvg = typeof Logo === "function" || typeof Logo === "object";

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
    const ordered = recentIds
      .map((id) => byId.get(id))
      .filter((item): item is Service => Boolean(item));
    if (ordered.length > 0) return ordered.slice(0, 10);
    const shuffled = [...services].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 10);
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
  const locationSuggestions = useMemo(() => {
    const needle = destination.trim().toLowerCase();
    if (!needle) return [];
    const unique = new Map<string, string>();
    for (const service of services) {
      if (service.location.toLowerCase().includes(needle)) {
        unique.set(service.location, service.location);
      }
    }
    return Array.from(unique.values()).slice(0, 6);
  }, [destination, services]);
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
        destination: destination || "Default Destination",
        timeslot: date && time ? `${date} ${time}` : "Anytime",
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
      <View
        style={[
          styles.fixedNotch,
          { top: insets.top },
        ]}
      >
        {canRenderSvg ? (
          <Logo width={148} height={148} />
        ) : (
          <Image
            source={require("../../../assets/images/android-icon-foreground.png")}
            style={styles.brandFallbackLogo}
          />
        )}
      </View>
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
            <View style={styles.inputWithIcon}>
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
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  closeDropdowns();
                  setShowSuggestions(true);
                }}
              />
            </View>
            {showSuggestions && locationSuggestions.length > 0 && (
              <View style={styles.dropdown}>
                {locationSuggestions.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setDestination(item);
                      setShowSuggestions(false);
                    }}
                  >
                    <Text>{item}</Text>
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
                  !isSearchEnabled && styles.searchButtonDisabled,
                ]}
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
                disabled={!isSearchEnabled}
              >
                <Text style={styles.searchButtonText}>{t("home.search")}</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBackground },
  container: { padding: 16, paddingBottom: 24 },
  fixedNotch: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: "#2E6A52",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingLeft: 20,
    zIndex: 50,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  brandBar: {
    height: 54,
    borderRadius: 16,
    backgroundColor: "#0B3D2E",
    marginBottom: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  brandFallbackLogo: {
    width: 148,
    height: 148,
    marginLeft: 12,
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
    marginTop: 6,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surfaceSoft,
    overflow: "hidden",
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
    backgroundColor: colors.textPrimary,
    borderRadius: 8,
    alignItems: "center",
  },
  searchButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  searchButtonText: {
    color: colors.background,
    fontWeight: "600",
  },
  horizontalList: {
    overflow: "visible",
  },
  horizontalListContent: {
    paddingVertical: 8,
    paddingHorizontal: 2,
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

