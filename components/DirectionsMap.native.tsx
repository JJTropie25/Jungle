import MapView, { Marker, Polyline } from "react-native-maps";
import { colors } from "../lib/theme";

type LatLng = { latitude: number; longitude: number };

type Props = {
  mapRef: React.RefObject<MapView | null>;
  destinationCoords: LatLng;
  origin: LatLng | null;
  route: LatLng[];
  microservice?: string;
  destination?: string;
  title?: string;
  body?: string;
  back?: string;
  onBack?: () => void;
};

export default function DirectionsMapNative({
  mapRef,
  destinationCoords,
  origin,
  route,
  microservice,
  destination,
}: Props) {
  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      initialRegion={{
        latitude: destinationCoords.latitude,
        longitude: destinationCoords.longitude,
        latitudeDelta: 0.4,
        longitudeDelta: 0.4,
      }}
    >
      {origin ? (
        <Marker coordinate={origin} title="You" pinColor={colors.warmAccentDark} />
      ) : null}
      <Marker
        coordinate={destinationCoords}
        title={microservice ?? "Service"}
        description={destination ?? ""}
      />
      {route.length > 1 ? (
        <Polyline coordinates={route} strokeWidth={4} strokeColor={colors.accent} />
      ) : null}
    </MapView>
  );
}
