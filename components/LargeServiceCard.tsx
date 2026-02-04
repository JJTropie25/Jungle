import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

type Props = {
  title: string;
  subtitle: string;
  price: string;
};

export default function LargeServiceCard({
  title,
  subtitle,
  price,
}: Props) {
  return (
    <TouchableOpacity style={styles.card}>
      <View style={styles.imagePlaceholder} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <Text style={styles.price}>{price}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  imagePlaceholder: {
    height: 120,
    backgroundColor: "#ddd",
    borderRadius: 8,
    marginBottom: 12,
  },
  title: { fontWeight: "600", fontSize: 16 },
  subtitle: { color: "#666", marginVertical: 4 },
  price: { fontWeight: "600" },
});
