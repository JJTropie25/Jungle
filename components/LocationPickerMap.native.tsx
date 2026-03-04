import { useEffect, useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";

type Props = {
  latitude: number;
  longitude: number;
  onPick: (coords: { latitude: number; longitude: number }) => void;
};

export default function LocationPickerMap({ latitude, longitude, onPick }: Props) {
  const [selected, setSelected] = useState({ latitude, longitude });

  useEffect(() => {
    setSelected({ latitude, longitude });
  }, [latitude, longitude]);

  const initialRegion: Region = useMemo(
    () => ({
      latitude,
      longitude,
      latitudeDelta: 0.12,
      longitudeDelta: 0.12,
    }),
    [latitude, longitude]
  );

  return (
    <MapView
      style={styles.map}
      initialRegion={initialRegion}
      onPress={(event) => {
        const next = event.nativeEvent.coordinate;
        setSelected(next);
        onPick(next);
      }}
    >
      <Marker coordinate={selected} />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

