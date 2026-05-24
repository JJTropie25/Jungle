import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../lib/theme";

type Props = {
  mapRef?: unknown;
  destinationCoords?: unknown;
  origin?: unknown;
  route?: unknown;
  microservice?: string;
  destination?: string;
  title: string;
  body: string;
  back: string;
  onBack: () => void;
};

export default function DirectionsMapWeb({ title, body, back, onBack }: Props) {
  return (
    <View style={styles.webFallback}>
      <Text style={styles.webTitle}>{title}</Text>
      <Text style={styles.webText}>{body}</Text>
      <TouchableOpacity style={styles.webButton} onPress={onBack}>
        <Text style={styles.webButtonText}>{back}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  webFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  webTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.surface,
  },
  webText: {
    color: colors.surface,
    textAlign: "center",
  },
  webButton: {
    marginTop: 8,
    backgroundColor: colors.textPrimary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  webButtonText: {
    color: colors.background,
    fontWeight: "700",
  },
});
