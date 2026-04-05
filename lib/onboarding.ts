import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const ONBOARDING_KEY = "lagoon_onboarding_v1";

export async function hasCompletedOnboarding() {
  const value = await AsyncStorage.getItem(ONBOARDING_KEY);
  return value === "true";
}

export async function setCompletedOnboarding() {
  await AsyncStorage.setItem(ONBOARDING_KEY, "true");
}

export function useOnboardingState() {
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let mounted = true;
    hasCompletedOnboarding()
      .then((value) => {
        if (!mounted) return;
        setCompleted(value);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { loading, completed, setCompleted };
}
