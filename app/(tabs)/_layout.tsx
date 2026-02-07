import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="guest"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-variant" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Preferiti",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="star" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Prenotazioni",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="briefcase-check" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profilo",
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
    </Tabs>
  );
}
