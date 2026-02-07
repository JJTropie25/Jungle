import { View, Text, StyleSheet, Image, Pressable } from "react-native";

export default function Profile() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.avatar}
        />
        <Text style={styles.username}>@username</Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Change personal info</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 48,
    paddingHorizontal: 24,
    backgroundColor: "#fff",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  username: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
  },
});
