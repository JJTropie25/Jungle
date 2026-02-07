import { Pressable, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

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
        color={selected ? "#fff" : "#111827"}
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
    backgroundColor: "#eee",
    borderRadius: 8,
    width: "30%",
    alignItems: "center",
    gap: 6,
  },
  buttonSelected: {
    backgroundColor: "#111827",
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  textSelected: {
    color: "#fff",
  },
});
