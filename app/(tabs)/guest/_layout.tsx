import { Stack } from "expo-router";

export default function GuestLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>

      {/* screens fuori dalle tabs */}
      <Stack.Screen name="SearchResults" />
      <Stack.Screen name="ServiceDetails" />
      <Stack.Screen name="BookingConfirmation" />
    </Stack>
  );
}
