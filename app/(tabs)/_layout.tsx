import { Tabs, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { useI18n } from "../../lib/i18n";
import { colors } from "../../lib/theme";

export default function TabsLayout() {
  const { t } = useI18n();
  const router = useRouter();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: "transparent" },
        tabBarStyle: {
          backgroundColor: "rgba(255,255,255,0.94)",
          borderTopColor: "rgba(111,182,154,0.55)",
        },
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: "#245845",
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
                  color="#245845"
                  style={{ position: "absolute", top: 0, left: 0 }}
                />
              </View>
            ) : (
              <MaterialCommunityIcons
                name="home-outline"
                size={Math.max(22, size)}
                color="#245845"
              />
            )
          ),
          tabBarButton: (props) => (
            <Pressable
              {...props}
              onPress={() => router.replace("/(tabs)/guest")}
            />
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
                  color="#245845"
                  style={{ position: "absolute", top: 0, left: 0 }}
                />
              </View>
            ) : (
              <MaterialCommunityIcons
                name="star-outline"
                size={Math.max(22, size)}
                color="#245845"
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
                  color="#245845"
                  style={{ position: "absolute", top: 0, left: 0 }}
                />
              </View>
            ) : (
              <MaterialCommunityIcons
                name="briefcase-outline"
                size={Math.max(22, size)}
                color="#245845"
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
                  color="#245845"
                  style={{ position: "absolute", top: 0, left: 0 }}
                />
              </View>
            ) : (
              <MaterialCommunityIcons
                name="account-circle-outline"
                size={Math.max(22, size)}
                color="#245845"
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
