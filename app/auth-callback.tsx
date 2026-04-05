import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View, Platform } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { useI18n } from "../lib/i18n";
import { colors } from "../lib/theme";
import * as Linking from "expo-linking";

export default function AuthCallback() {
  const router = useRouter();
  const { t } = useI18n();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setMessage("Supabase is not configured.");
      return;
    }

    const exchange = async () => {
      const { data: existing } = await supabase.auth.getSession();
      if (existing.session) {
        router.replace("/(tabs)/guest");
        return;
      }

      const handleUrl = async (urlString: string) => {
        const errorDescription = (() => {
          const parsed = Linking.parse(urlString);
          const err =
            parsed.queryParams?.error_description || parsed.queryParams?.error;
          return typeof err === "string" ? err : null;
        })();

        if (errorDescription) {
          setMessage(errorDescription);
          return;
        }

        const parsed = Linking.parse(urlString);
        const codeParam = parsed.queryParams?.code;
        const code = typeof codeParam === "string" ? codeParam : null;

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
              router.replace("/(tabs)/guest");
              return;
            }
            setMessage(error.message);
            return;
          }
          router.replace("/(tabs)/guest");
          return;
        }

        const hash = urlString.split("#")[1] ?? "";
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            setMessage(error.message);
            return;
          }
          router.replace("/(tabs)/guest");
          return;
        }

        setMessage("Missing OAuth data.");
      };

      if (Platform.OS === "web" && typeof window !== "undefined") {
        await handleUrl(window.location.href);
        return;
      }

      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        await handleUrl(initialUrl);
        return;
      }

      let resolved = false;
      const tryWaitForSession = async () => {
        for (let i = 0; i < 6; i += 1) {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            resolved = true;
            router.replace("/(tabs)/guest");
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      };

      const subscription = Linking.addEventListener("url", (event) => {
        if (resolved) return;
        resolved = true;
        handleUrl(event.url).catch(() => null);
      });

      await tryWaitForSession();
      if (!resolved) {
        setMessage("Missing OAuth data.");
      }
      subscription.remove();
    };

    exchange().catch(() => {
      setMessage(t("auth.signInTitle"));
    });
  }, [router, t]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.surface} size="large" />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenBackground,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  message: {
    color: colors.surface,
    fontWeight: "600",
  },
});
