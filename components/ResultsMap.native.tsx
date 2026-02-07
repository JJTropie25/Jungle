import { StyleSheet } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useEffect, useMemo, useRef } from "react";

type ResultItem = {
  title: string;
  price: string;
  location: string;
  latitude: number;
  longitude: number;
};

type ResultsMapProps = {
  results: ResultItem[];
  selectedTitle?: string | null;
  onSelect?: (title: string) => void;
};

export default function ResultsMap({
  results,
  selectedTitle,
  onSelect,
}: ResultsMapProps) {
  const mapRef = useRef<MapView>(null);
  const initialRegion: Region = useMemo(
    () => ({
      latitude: results[0].latitude,
      longitude: results[0].longitude,
      latitudeDelta: 2.8,
      longitudeDelta: 2.8,
    }),
    [results],
  );

  useEffect(() => {
    if (!selectedTitle) return;
    const selected = results.find((r) => r.title === selectedTitle);
    if (!selected) return;
    mapRef.current?.animateToRegion(
      {
        latitude: selected.latitude,
        longitude: selected.longitude,
        latitudeDelta: 0.6,
        longitudeDelta: 0.6,
      },
      350,
    );
  }, [results, selectedTitle]);

  return (
    <MapView ref={mapRef} style={styles.map} initialRegion={initialRegion}>
      {results.map((item) => (
        <Marker
          key={item.title}
          coordinate={{ latitude: item.latitude, longitude: item.longitude }}
          title={item.title}
          description={`${item.price} • ${item.location}`}
          onPress={() => onSelect?.(item.title)}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
