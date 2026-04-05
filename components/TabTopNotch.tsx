import { AppState, Image, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useAuthState } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { colors } from "../lib/theme";
import { useFocusEffect } from "@react-navigation/native";

type TabTopNotchProps = {
  hideBell?: boolean;
};

export default function TabTopNotch({ hideBell }: TabTopNotchProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthState();
  const [unreadCount, setUnreadCount] = useState(0);
  const logo = require("../assets/images/Lagoon_notch.png");

  const loadCount = useCallback(async () => {
    if (!supabase || !user?.id) {
      setUnreadCount(0);
      return;
    }
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null);
    setUnreadCount(count ?? 0);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadCount().catch(() => null);
    }, [loadCount])
  );

  useEffect(() => {
    if (!supabase || !user?.id) return;
    loadCount().catch(() => null);

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => loadCount().catch(() => null)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, loadCount]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        loadCount().catch(() => null);
      }
    });
    return () => sub.remove();
  }, [loadCount]);

  return (
    <View style={[styles.fixedNotch, { top: insets.top }]}>
      <Image source={logo} resizeMode="cover" style={styles.notchLogo} />
      {!hideBell ? (
        <Pressable
          style={styles.bellButton}
          onPress={() => router.push("/notifications")}
        >
          <MaterialCommunityIcons name="bell-outline" size={22} color={colors.surface} />
          {unreadCount > 0 ? <View style={styles.badgeDot} /> : null}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fixedNotch: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: "#4F9B9B",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingLeft: 14,
    zIndex: 50,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  notchLogo: {
    width: 110,
    height: 30,
    marginTop: -1,
    marginLeft: -4,
  },
  bellButton: {
    position: "absolute",
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeDot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.warmAccent,
  },
});
