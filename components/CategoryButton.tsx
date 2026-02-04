import { Pressable, Text, StyleSheet } from "react-native";

export default function CategoryButton({ label }: { label: string }) {
  return (
    <Pressable style={styles.button}>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#eee",
    borderRadius: 12,
  },
  text: {
    fontWeight: "500",
  },
});
