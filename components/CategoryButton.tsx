import { useMemo } from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../lib/theme-context";
import { type ThemeColors } from "../lib/theme";

type CategoryButtonProps = {
  label: string;
  icon: string;
  onPress?: () => void;
  selected?: boolean;
};

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    button: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: c.surfaceSoft,
      borderRadius: 8,
      width: "30%",
      alignItems: "center",
      gap: 6,
    },
    buttonSelected: {
      backgroundColor: c.textPrimary,
    },
    text: {
      fontSize: 14,
      fontWeight: "600",
      color: c.textPrimary,
    },
    textSelected: {
      color: c.background,
    },
  });
}

export default function CategoryButton({
  label,
  icon,
  onPress,
  selected,
}: CategoryButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable
      style={[styles.button, selected && styles.buttonSelected]}
      onPress={onPress}
    >
      <MaterialCommunityIcons
        name={icon as any}
        size={20}
        color={selected ? colors.background : colors.textPrimary}
      />
      <Text style={[styles.text, selected && styles.textSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}