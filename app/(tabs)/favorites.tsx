import { Text, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import ServiceCard from "../../components/ServiceCard";
import TabTopNotch from "../../components/TabTopNotch";
import { useI18n } from "../../lib/i18n";
import { colors } from "../../lib/theme";
import { useAuthState } from "../../lib/auth";
import { useCallback, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  addFavorite,
  fetchFavoriteIds,
  fetchFavoriteServices,
  removeFavorite,
} from "../../lib/favorites";
import { toPriceLabel, toTypeKey } from "../../lib/services";
import { useFocusEffect } from "@react-navigation/native";

export default function Favorites() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const placeholderImage = require("../../assets/images/react-logo.png");
  const { user } = useAuthState();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async (isMounted: () => boolean) => {
    if (!supabase || !user) {
      if (!isMounted()) return;
      setFavoriteIds(new Set());
      setItems([]);
      setLoading(false);
      return;
    }

    if (!isMounted()) return;
    setLoading(true);
    const [ids, services] = await Promise.all([
      fetchFavoriteIds(user.id),
      fetchFavoriteServices(user.id),
    ]);
    if (!isMounted()) return;
    setFavoriteIds(ids);
    setItems(services);
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const isMounted = () => mounted;
      loadFavorites(isMounted);
      return () => {
        mounted = false;
      };
    }, [loadFavorites])
  );

  const emptyText = useMemo(() => {
    if (!user) return t("favorites.signIn");
    if (loading) return t("favorites.loading");
    return t("favorites.empty");
  }, [loading, t, user]);

  return (
    <SafeAreaView style={styles.screen}>
      <TabTopNotch />
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 58 },
        ]}
      >
        <Text style={styles.title}>{t("favorites.title")}</Text>

        {items.length === 0 ? (
          <Text style={styles.emptyText}>{emptyText}</Text>
        ) : (
          items.map((item) => (
            <ServiceCard
              key={item.id}
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
              meta={t(toTypeKey(item.category))}
              rating={item.rating}
              isFavorite={favoriteIds.has(item.id)}
              onToggleFavorite={async () => {
                if (!user) return;
                const next = new Set(favoriteIds);
                if (next.has(item.id)) {
                  const { error } = await removeFavorite(user.id, item.id);
                  if (error) return;
                  next.delete(item.id);
                } else {
                  const { error } = await addFavorite(user.id, item.id);
                  if (error) return;
                  next.add(item.id);
                }
                setFavoriteIds(next);
                setItems((prev) => prev.filter((s) => next.has(s.id)));
              }}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/guest/ServiceDetails",
                  params: {
                    serviceId: item.id,
                    destination: item.location,
                    timeslot: "Anytime",
                    people: "1",
                    microservice: item.title,
                  },
                })
              }
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBackground },
  container: { padding: 16, paddingBottom: 24 },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    color: colors.textPrimary,
  },
  card: {
    marginBottom: 12,
  },
  cardImage: {
    height: 90,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 24,
    fontWeight: "600",
  },
});
