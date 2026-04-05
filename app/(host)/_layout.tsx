import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View } from "react-native";
import { useI18n } from "../../lib/i18n";
import { colors } from "../../lib/theme";

export default function HostTabsLayout() {
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        detachInactiveScreens: true,
        sceneStyle: { backgroundColor: "#0B3F3F" },
        tabBarStyle: {
          backgroundColor: "#4F9B9B",
          borderTopColor: "rgba(15,78,78,0.4)",
        },
        tabBarActiveTintColor: colors.surface,
        tabBarInactiveTintColor: colors.surface,
        tabBarLabelStyle: { fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="listings"
        options={{
          title: t("host.tabs.listings"),
          tabBarIcon: ({ size, focused }) => (
            focused ? (
              <View>
                <MaterialCommunityIcons
                  name="view-grid"
                  size={Math.max(22, size)}
                  color={colors.surfaceSoft}
                />
                <MaterialCommunityIcons
                  name="view-grid-outline"
                  size={Math.max(22, size)}
                  color={colors.surface}
                  style={{ position: "absolute", top: 0, left: 0 }}
                />
              </View>
            ) : (
              <MaterialCommunityIcons
                name="view-grid-outline"
                size={Math.max(22, size)}
                color={colors.surface}
              />
            )
          ),
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          title: t("host.tabs.reservations"),
          tabBarIcon: ({ size, focused }) => (
            focused ? (
              <View>
                <MaterialCommunityIcons
                  name="calendar-check"
                  size={Math.max(22, size)}
                  color={colors.surfaceSoft}
                />
                <MaterialCommunityIcons
                  name="calendar-check-outline"
                  size={Math.max(22, size)}
                  color={colors.surface}
                  style={{ position: "absolute", top: 0, left: 0 }}
                />
              </View>
            ) : (
              <MaterialCommunityIcons
                name="calendar-check-outline"
                size={Math.max(22, size)}
                color={colors.surface}
              />
            )
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ size, focused }) => (
            focused ? (
              <View>
                <MaterialCommunityIcons
                  name="account-circle"
                  size={Math.max(22, size)}
                  color={colors.surfaceSoft}
                />
                <MaterialCommunityIcons
                  name="account-circle-outline"
                  size={Math.max(22, size)}
                  color={colors.surface}
                  style={{ position: "absolute", top: 0, left: 0 }}
                />
              </View>
            ) : (
              <MaterialCommunityIcons
                name="account-circle-outline"
                size={Math.max(22, size)}
                color={colors.surface}
              />
            )
          ),
        }}
      />
      <Tabs.Screen
        name="edit-listing"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="new-listing"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="reservation/[bookingId]"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="check-in-confirmed"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="scan-qr"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}
