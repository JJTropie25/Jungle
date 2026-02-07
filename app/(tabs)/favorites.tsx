import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import ServiceCard from "../../components/ServiceCard";

export default function Favorites() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const placeholderImage = require("../../assets/images/react-logo.png");
  const favorites = [
    {
      title: "Casa di Marcello",
      type: "Riposo",
      price: "EUR 18",
      location: "Roma, RM",
      distance: "350m",
      rating: 4.6,
    },
    {
      title: "Doccia Stazione",
      type: "Doccia",
      price: "EUR 6",
      location: "Milano, MI",
      distance: "500m",
      rating: 4.3,
    },
    {
      title: "Deposito Centro",
      type: "Deposito",
      price: "EUR 4",
      location: "Firenze, FI",
      distance: "700m",
      rating: 4.1,
    },
  ];

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 16 },
        ]}
      >
        <Text style={styles.title}>I tuoi preferiti</Text>

        {favorites.map((item) => (
          <ServiceCard
            key={item.title}
            fullWidth
            horizontal
            containerStyle={styles.card}
            imageStyle={styles.cardImage}
            imageSource={placeholderImage}
            title={item.title}
            price={item.price}
            location={item.location}
            meta={`${item.type} · ${item.distance} · Rating ${item.rating}`}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/guest/ServiceDetails",
                params: {
                  destination: item.location,
                  timeslot: "Anytime",
                  people: "1",
                  microservice: item.title,
                },
              })
            }
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 16, paddingBottom: 24 },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111827",
  },
  card: {
    marginBottom: 12,
  },
  cardImage: {
    height: 90,
  },
});
