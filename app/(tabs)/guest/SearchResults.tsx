import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function SearchResults() {
  const router = useRouter();

  const { destination, timeslot, people, microservice } =
    useLocalSearchParams<{
      destination?: string;
      timeslot?: string;
      people?: string;
      microservice?: string;
    }>();

  const results = [
    {
      title: "Doccia Centrale",
      type: "Doccia",
      rating: 4.5,
      distance: "300m",
      price: "€5",
      image: "https://via.placeholder.com/80",
    },
    {
      title: "Deposito Stazione",
      type: "Deposito",
      rating: 4.2,
      distance: "450m",
      price: "€8",
      image: "https://via.placeholder.com/80",
    },
    {
      title: "Riposo Centro",
      type: "Riposo",
      rating: 4.8,
      distance: "200m",
      price: "€10",
      image: "https://via.placeholder.com/80",
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* SUMMARY BOX ORIZZONTALE */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryText}>
          {destination ?? "-"} | {timeslot ?? "-"} | {people ?? "-"} |{" "}
          {microservice ?? "-"}
        </Text>
      </View>

      {/* ACTIONS */}
      <View style={styles.actions}>
        {["Sort", "Filter", "Map"].map((a) => (
          <View key={a} style={styles.actionButton}>
            <Text>{a}</Text>
          </View>
        ))}
      </View>

      {/* RESULTS */}
      {results.map((item) => (
        <Pressable
          key={item.title}
          style={styles.card}
          onPress={() =>
            router.push({
              pathname: "/guest/ServiceDetails",
              params: {
                destination,
                timeslot,
                people,
                microservice: item.title,
              },
            })
          }
        >
          <Image source={{ uri: item.image }} style={styles.cardImage} />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text>{item.type}</Text>
            <Text>⭐ {item.rating} • {item.distance}</Text>
            <Text>{item.price}</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  summaryBox: {
    backgroundColor: "#f2f2f2",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: "center",
  },
  summaryText: {
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  actionButton: {
    width: "30%",
    padding: 10,
    backgroundColor: "#eee",
    borderRadius: 8,
    alignItems: "center",
  },
  card: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 12,
    height: 120,
    overflow: "hidden",
  },
  cardImage: {
    width: "30%",
    height: "100%",
    borderRadius: 10,
  },
  cardContent: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: "space-between",
  },
  cardTitle: {
    fontWeight: "700",
    fontSize: 16,
  },
});
