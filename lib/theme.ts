export const lightColors = {
  background: "#FFFFFF",
  screenBackground: "#FFFFFF",
  listBackground: "#FFFFFF",
  cardBackground: "#FFFFFF",
  surface: "#E2F2F2",
  surfaceSoft: "#A5D3D3",
  border: "#4F9B9B",
  textPrimary: "#0F4E4E",
  textSecondary: "#166A6A",
  textMuted: "#2B7F7F",
  accent: "#2B7F7F",
  warmAccent: "#E88C4A",
  warmAccentDark: "#D97832",
  warmAccentSoft: "#F2A86F",
  warmSurface: "#FBE3D1",
  disabled: "#A5D3D3",
  divider: "#E0E0E0",
};

export const darkColors = {
  background: "#1A5A5A",
  screenBackground: "#0B3F3F",
  listBackground: "#0B3F3F",
  cardBackground: "#1A5A5A",
  surface: "#246060",
  surfaceSoft: "#1E5555",
  border: "rgba(255,255,255,0.18)",
  textPrimary: "#E2F2F2",
  textSecondary: "#9DCECE",
  textMuted: "#6FAABB",
  accent: "#4BB5B5",
  warmAccent: "#E88C4A",
  warmAccentDark: "#D97832",
  warmAccentSoft: "#F2A86F",
  warmSurface: "#4A2A12",
  disabled: "#2A6060",
  divider: "rgba(255,255,255,0.12)",
};

export type ThemeColors = typeof lightColors;

// Backward-compat alias used by files not yet migrated to useTheme()
export const colors = lightColors;