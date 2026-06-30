import { Stack, usePathname } from "expo-router";
import { useTheme } from "../../../lib/theme-context";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo } from "react";

export default function ProfileLayout() {
  const { colors } = useTheme();
  const pathname = usePathname();
  const navigation = useNavigation();

  const defaultTabBarStyle = useMemo(() => ({
    backgroundColor: colors.screenBackground,
    borderTopColor: colors.divider,
    height: 64,
    paddingBottom: 8,
  }), [colors]);

  useEffect(() => {
    const onSubScreen = /\/(Edit|Language|Help|TermsAndConditions)$/.test(pathname);
    navigation.setOptions({
      tabBarStyle: onSubScreen ? { display: "none" } : defaultTabBarStyle,
    });
  }, [pathname, navigation, defaultTabBarStyle]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: colors.screenBackground },
      }}
    />
  );
}
