import { Pressable, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../lib/theme";

type CategoryButtonProps = {
  label: string;
  icon: string;
  onPress?: () => void;
  selected?: boolean;
};

export default function CategoryButton({
  label,
  icon,
  onPress,
  selected,
}: CategoryButtonProps) {
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

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surfaceSoft,
    borderRadius: 8,
    width: "30%",
    alignItems: "center",
    gap: 6,
  },
  buttonSelected: {
    backgroundColor: colors.textPrimary,
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  textSelected: {
    color: colors.background,
  },
});
