import { useCallback, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import TabTopNotch from "../../components/TabTopNotch";
import ServiceCard from "../../components/ServiceCard";
import { useI18n } from "../../lib/i18n";
import { useAuthState } from "../../lib/auth";
import { colors } from "../../lib/theme";
import { deleteHostListing, fetchHostListings, resolveHostForUser } from "../../lib/host";
import { toPriceLabel, type Service } from "../../lib/services";
import { useAppDialog } from "../../components/AppDialogProvider";

export default function HostListings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const dialog = useAppDialog();
  const { user } = useAuthState();
  const placeholderImage = require("../../assets/images/react-logo.png");

  const [listings, setListings] = useState<Service[]>([]);
  const [hostLabel, setHostLabel] = useState<string | null>(null);
  const [hasHost, setHasHost] = useState(true);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { host } = await resolveHostForUser(user?.id);
    setHasHost(Boolean(host));
    if (!host) {
      setListings([]);
      setHostLabel(null);
      setLoading(false);
      return;
    }
    setHostLabel(host.display_name ?? null);
    const data = await fetchHostListings(host.id);
    setListings(data);
    setLoading(false);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const emptyText = useMemo(() => {
    if (loading) return t("host.loading");
    if (!hasHost) return t("host.notAvailable");
    return t("host.listings.empty");
  }, [hasHost, loading, t]);

  return (
    <SafeAreaView style={styles.screen}>
      <TabTopNotch />
      <View style={[styles.container, { paddingTop: insets.top + 58 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t("host.listings.title")}</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              if (!hasHost) {
                dialog.alert(t("host.listings.title"), t("host.notAvailable"));
                return;
              }
              router.push("/(host)/new-listing");
            }}
          >
            <MaterialCommunityIcons name="plus" size={22} color={colors.background} />
          </TouchableOpacity>
        </View>

        {hostLabel ? <Text style={styles.hostSubtitle}>{hostLabel}</Text> : null}
        {listings.length === 0 ? (
          <Text style={styles.emptyText}>{emptyText}</Text>
        ) : (
          <FlatList
            data={listings}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.listingCardWrap}>
                <View style={styles.listingCard}>
                  <ServiceCard
                    fullWidth
                    horizontal
                    imageStyle={styles.cardImage}
                    imageSource={item.image_url ? { uri: item.image_url } : placeholderImage}
                    title={item.title}
                    price={toPriceLabel(item.price_eur)}
                    location={item.location}
                    meta={t(`category.${item.category}`)}
                    rating={item.rating}
                  />
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() =>
                        router.push({
                          pathname: "/(host)/edit-listing",
                          params: { serviceId: item.id },
                        })
                      }
                    >
                      <Text style={styles.editButtonText}>{t("host.action.edit")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={async () => {
                        const confirmed = await dialog.confirm({
                          title: t("host.action.delete"),
                          message: t("host.listings.deleteConfirm"),
                          confirmText: t("host.action.delete"),
                          cancelText: t("host.action.cancel"),
                        });
                        if (!confirmed) return;
                        const errorMessage = await deleteHostListing(item.id);
                        if (errorMessage) {
                          await dialog.alert(t("host.action.delete"), errorMessage);
                          return;
                        }
                        await loadData();
                      }}
                    >
                      <Text style={styles.deleteButtonText}>{t("host.action.delete")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBackground },
  container: { flex: 1, paddingHorizontal: 16 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.warmAccent,
    alignItems: "center",
    justifyContent: "center",
  },
  hostSubtitle: {
    marginTop: 4,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  emptyText: {
    marginTop: 36,
    textAlign: "center",
    color: colors.textSecondary,
    fontWeight: "600",
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  listingCardWrap: {
    marginBottom: 14,
  },
  listingCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
    overflow: "hidden",
    padding: 10,
  },
  cardImage: {
    height: 96,
  },
  actionRow: {
    marginTop: 8,
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  editButton: {
    backgroundColor: colors.warmSurface,
    borderWidth: 1,
    borderColor: colors.warmAccentSoft,
  },
  deleteButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: "#A53B3B",
  },
  editButtonText: {
    color: colors.warmAccentDark,
    fontWeight: "700",
  },
  deleteButtonText: {
    color: "#A53B3B",
    fontWeight: "700",
  },
});
