import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ServiceCard from "../../../components/ServiceCard";
import CategoryButton from "../../../components/CategoryButton";
import UIDateTimeField from "../../../components/UIDateTimeField";
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
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const placeholderImage = require("../../../assets/images/react-logo.png");
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
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

  const recentlyViewed = useMemo(
    () => services.filter((s) => s.section === "recently"),
    [services],
  );
  const aroundYou = useMemo(
    () => services.filter((s) => s.section === "around"),
    [services],
  );
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
    setPeopleOpen(false);
    setShowSuggestions(false);
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
                <TouchableOpacity
                  style={styles.selectField}
                  onPress={() => {
                    closeDropdowns();
                    setPeopleOpen((v) => !v);
                  }}
                >
                  <Text style={styles.selectLabel}>{people || t("home.people")}</Text>
                  <MaterialCommunityIcons
                    name="account-group-outline"
                    size={18}
                    color={colors.textSecondary}
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(loadingServices ? [] : recentlyViewed).map((item) => (
            <ServiceCard
              key={item.id}
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
                  await removeFavorite(user.id, item.id);
                  next.delete(item.id);
                } else {
                  await addFavorite(user.id, item.id);
                  next.add(item.id);
                }
                setFavoriteIds(next);
              }}
            />
          ))}
        </ScrollView>

        {/* Around you */}
        <Text style={styles.sectionTitle}>{t("home.aroundYou")}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(loadingServices ? [] : aroundYou).map((item) => (
            <ServiceCard
              key={item.id}
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
                  await removeFavorite(user.id, item.id);
                  next.delete(item.id);
                } else {
                  await addFavorite(user.id, item.id);
                  next.add(item.id);
                }
                setFavoriteIds(next);
              }}
            />
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
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
  },
  categoryBadgeText: {
    fontWeight: "600",
    color: colors.textPrimary,
  },
  sectionTitle: { fontWeight: "600", marginVertical: 10 },
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
});
