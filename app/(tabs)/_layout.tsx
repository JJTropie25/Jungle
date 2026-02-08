import { Tabs, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Pressable } from "react-native";
import { useI18n } from "../../lib/i18n";

export default function TabsLayout() {
  const { t } = useI18n();
  const router = useRouter();
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="guest"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-variant" size={size} color={color} />
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
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="star" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: t("tabs.bookings"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="briefcase-check" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ size }) => (
            <Image
              source={require("../../assets/images/icon.png")}
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
              }}
            />
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
