import { StyleSheet, View } from "react-native";
import MapView from "react-native-maps";

type Props = {
  latitude: number;
  longitude: number;
  onPick: (coords: { latitude: number; longitude: number }) => void;
};

export default function LocationPickerMap({ latitude, longitude, onPick }: Props) {
  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        mapType="standard"
        showsBuildings={false}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.12,
          longitudeDelta: 0.12,
        }}
        onRegionChange={(region) =>
          onPick({ latitude: region.latitude, longitude: region.longitude })
        }
        onRegionChangeComplete={(region) =>
          onPick({ latitude: region.latitude, longitude: region.longitude })
        }
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.crosshairWrap]}>
        <View style={styles.crosshair}>
          <View style={styles.crossV} />
          <View style={styles.crossH} />
          <View style={styles.crossDot} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  crosshairWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  crosshair: { width: 40, height: 40 },
  crossV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 19,
    width: 2,
    backgroundColor: "rgba(20,20,20,0.82)",
    borderRadius: 1,
  },
  crossH: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 19,
    height: 2,
    backgroundColor: "rgba(20,20,20,0.82)",
    borderRadius: 1,
  },
  crossDot: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(20,20,20,0.92)",
  },
});
