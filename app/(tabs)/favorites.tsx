import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import ServiceCard from "../../components/ServiceCard";
import { useI18n } from "../../lib/i18n";
import { colors } from "../../lib/theme";
import { useAuthState } from "../../lib/auth";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { addFavorite, fetchFavoriteIds, removeFavorite } from "../../lib/favorites";
import { toPriceLabel, toTypeKey } from "../../lib/services";

export default function Favorites() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const placeholderImage = require("../../assets/images/react-logo.png");
  const { user } = useAuthState();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!supabase || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      fetchFavoriteIds(user.id),
      supabase
        .from("favorites")
        .select(
          "service:services(id, title, category, price_eur, location, distance_meters, rating, image_url)"
        )
        .eq("guest_id", user.id),
    ]).then(([ids, res]) => {
      if (!isMounted) return;
      setFavoriteIds(ids);
      setItems(res.data?.map((row: any) => row.service) ?? []);
      setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [user]);

  const emptyText = useMemo(() => {
    if (!user) return t("favorites.signIn");
    if (loading) return t("favorites.loading");
    return t("favorites.empty");
  }, [loading, t, user]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 16 },
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
              meta={`${t(toTypeKey(item.category))} ? ${t("label.rating")} ${item.rating ?? "-"}`}
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
  screen: { flex: 1, backgroundColor: colors.background },
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
