import { Stack } from "expo-router";

export default function GuestLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen name="index" />
      {/* screens fuori dalle tabs */}
      <Stack.Screen name="SearchResults" />
      <Stack.Screen name="ServiceDetails" />
      <Stack.Screen name="Payment" />
      <Stack.Screen name="BookingConfirmation" />
      <Stack.Screen name="Directions" />
      <Stack.Screen name="ManageBooking" />
    </Stack>
  );
}
