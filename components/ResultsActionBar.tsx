import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

type Action = {
  label: string;
  onPress?: () => void;
  badge?: boolean;
};

export default function ResultsActionBar({ actions }: { actions: Action[] }) {
  return (
    <View style={styles.container}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.label}
          style={styles.button}
          onPress={action.onPress}
        >
          <Text>{action.label}</Text>
          {action.badge ? <View style={styles.badge} /> : null}
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
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#111827",
  },
});
