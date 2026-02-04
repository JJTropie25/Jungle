import { View, Text, StyleSheet } from "react-native";

export default function SearchSummaryBar() {
  return (
    <View style={styles.container}>
      {["Paris", "2 Feb", "1 Person", "Doccia"].map((item) => (
        <View key={item} style={styles.pill}>
          <Text style={styles.text}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 12,
  },
  pill: {
    backgroundColor: "#eee",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  text: { fontSize: 12 },
});
