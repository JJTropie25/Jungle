import { View, Text, StyleSheet } from "react-native";

export default function ServiceCard({ title }: { title: string }) {
  return (
    <View style={styles.card}>
      <View style={styles.imagePlaceholder} />
      <Text>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    marginRight: 12,
  },
  imagePlaceholder: {
    height: 100,
    backgroundColor: "#ddd",
    borderRadius: 12,
    marginBottom: 8,
  },
});
