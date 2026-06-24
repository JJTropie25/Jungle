import { Stack, useNavigation } from "expo-router";
import { useTheme } from "../../../lib/theme-context";

export default function GuestLayout() {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const visibleTabBar = {
    backgroundColor: colors.screenBackground,
    borderTopColor: colors.divider,
    height: 64,
    paddingBottom: 8,
  };

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: colors.screenBackground },
      }}
      screenListeners={({ route }) => ({
        focus: () => {
          navigation.setOptions({
            tabBarStyle:
              route.name === "index"
                ? visibleTabBar
                : ({ display: "none" } as const),
          });
        },
      })}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="SearchResults" />
      <Stack.Screen name="ServiceDetails" />
      <Stack.Screen name="Payment" />
      <Stack.Screen name="BookingConfirmation" />
    </Stack>
  );
}
