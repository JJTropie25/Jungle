import "react-native-url-polyfill/auto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

const isValidUrl =
  supabaseUrl.startsWith("https://") || supabaseUrl.startsWith("http://");

const canUseDOM =
  typeof window !== "undefined" && typeof document !== "undefined";
const hasLocalStorage =
  canUseDOM && typeof window.localStorage !== "undefined";
const isReactNative = !canUseDOM;

const memoryStorage = (() => {
  const store = new Map<string, string>();
  return {
    getItem: async (key: string) => store.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: async (key: string) => {
      store.delete(key);
    },
  };
})();

const webStorage = {
  getItem: async (key: string) =>
    hasLocalStorage ? window.localStorage.getItem(key) : null,
  setItem: async (key: string, value: string) => {
    if (hasLocalStorage) window.localStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (hasLocalStorage) window.localStorage.removeItem(key);
  },
};

const nativeStorage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

if (!supabaseUrl || !supabaseAnonKey || !isValidUrl) {
  console.warn(
    "Supabase env vars missing or invalid. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env."
  );
}

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey && isValidUrl
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          storage: hasLocalStorage
            ? webStorage
            : isReactNative
            ? nativeStorage
            : memoryStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: hasLocalStorage,
        },
      })
    : null;
