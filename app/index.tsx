import { Redirect } from "expo-router";
import { useAuthState } from "../lib/auth";
import { useOnboardingState } from "../lib/onboarding";
import SplashScreen from "../components/SplashScreen";

export default function Index() {
  const { session, loading } = useAuthState();
  const onboarding = useOnboardingState();

  if (loading || onboarding.loading) {
    return <SplashScreen />;
  }
  if (!onboarding.completed) {
    return <Redirect href="/onboarding-intro" />;
  }
  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }
  return <Redirect href="/(tabs)/guest" />;
}
