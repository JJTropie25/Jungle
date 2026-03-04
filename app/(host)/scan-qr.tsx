import { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera/build";
import { colors } from "../../lib/theme";
import { useAppDialog } from "../../components/AppDialogProvider";

export default function HostScanQr() {
  const router = useRouter();
  const dialog = useAppDialog();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanLocked, setScanLocked] = useState(false);
  const { bookingId, expectedToken } = useLocalSearchParams<{
    bookingId?: string;
    expectedToken?: string;
  }>();

  const canScan = useMemo(
    () => Boolean(expectedToken && expectedToken.trim().length > 0),
    [expectedToken]
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(host)/reservations"))}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Scan booking QR</Text>

        {!permission?.granted ? (
          <View style={styles.centerCard}>
            <Text style={styles.hint}>Camera permission is required.</Text>
            <TouchableOpacity style={styles.actionButton} onPress={requestPermission}>
              <Text style={styles.actionText}>Allow camera</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cameraWrap}>
            <CameraView
              style={styles.camera}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={async ({ data }) => {
                if (scanLocked) return;
                setScanLocked(true);
                if (!canScan) {
                  await dialog.alert("Scan QR", "Booking has no QR token.");
                  setScanLocked(false);
                  return;
                }
                if (data !== expectedToken) {
                  await dialog.alert("Scan QR", "Invalid QR token.");
                  setScanLocked(false);
                  return;
                }
                router.replace({
                  pathname: "/(host)/check-in-confirmed",
                  params: { bookingId },
                });
              }}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBackground },
  container: { flex: 1, paddingHorizontal: 16 },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  title: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 20,
    marginBottom: 10,
  },
  centerCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  hint: {
    color: colors.textSecondary,
    marginBottom: 10,
    fontWeight: "600",
  },
  actionButton: {
    backgroundColor: colors.textPrimary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  actionText: {
    color: colors.background,
    fontWeight: "700",
  },
  cameraWrap: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  camera: {
    flex: 1,
  },
});
