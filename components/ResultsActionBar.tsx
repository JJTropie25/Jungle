import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function ResultsActionBar() {
  return (
    <View style={styles.container}>
      {["Sort", "Filter", "Map"].map((item) => (
        <TouchableOpacity key={item} style={styles.button}>
          <Text>{item}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 12,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    backgroundColor: "#eee",
    borderRadius: 8,
    alignItems: "center",
  },
});
