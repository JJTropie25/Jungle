import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View } from "react-native";
import { useI18n } from "../../lib/i18n";
import { colors } from "../../lib/theme";

export default function TabsLayout() {
  const { t, language } = useI18n();
  return (
    <Tabs
      key={language}
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
        tabBarLabelStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="guest"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ size, focused }) => (
            focused ? (
              <View>
                <MaterialCommunityIcons
                  name="home-variant"
                  size={Math.max(22, size)}
                  color={colors.surfaceSoft}
                />
                <MaterialCommunityIcons
                  name="home-outline"
                  size={Math.max(22, size)}
                  color={colors.surface}
                  style={{ position: "absolute", top: 0, left: 0 }}
                />
              </View>
            ) : (
              <MaterialCommunityIcons
                name="home-outline"
                size={Math.max(22, size)}
                color={colors.surface}
              />
            )
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: t("tabs.favourites"),
          tabBarIcon: ({ size, focused }) => (
            focused ? (
              <View>
                <MaterialCommunityIcons
                  name="star"
                  size={Math.max(22, size)}
                  color={colors.surfaceSoft}
                />
                <MaterialCommunityIcons
                  name="star-outline"
                  size={Math.max(22, size)}
                  color={colors.surface}
                  style={{ position: "absolute", top: 0, left: 0 }}
                />
              </View>
            ) : (
              <MaterialCommunityIcons
                name="star-outline"
                size={Math.max(22, size)}
                color={colors.surface}
              />
            )
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: t("tabs.bookings"),
          tabBarIcon: ({ size, focused }) => (
            focused ? (
              <View>
                <MaterialCommunityIcons
                  name="briefcase"
                  size={Math.max(22, size)}
                  color={colors.surfaceSoft}
                />
                <MaterialCommunityIcons
                  name="briefcase-outline"
                  size={Math.max(22, size)}
                  color={colors.surface}
                  style={{ position: "absolute", top: 0, left: 0 }}
                />
              </View>
            ) : (
              <MaterialCommunityIcons
                name="briefcase-outline"
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
        name="profile/Edit"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile/Language"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
