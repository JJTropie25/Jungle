import { Redirect } from "expo-router";
import { View } from "react-native";
import { useAuthState } from "../lib/auth";

export default function Index() {
  const { session, loading } = useAuthState();
  if (loading) {
    return <View />;
  }
  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }
  return <Redirect href="/(tabs)/guest" />;
}
