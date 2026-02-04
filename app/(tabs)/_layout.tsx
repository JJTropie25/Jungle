import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="guest" options={{ title: "Home" }} />
      <Tabs.Screen name="favorites" options={{ title: "Preferiti" }} />
      <Tabs.Screen name="bookings" options={{ title: "Prenotazioni" }} />
      <Tabs.Screen name="profile" options={{ title: "Profilo" }} />
    </Tabs>
  );
}
