import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

type Props = {
  latitude: number;
  longitude: number;
  onPick: (coords: { latitude: number; longitude: number }) => void;
};

export default function LocationPickerMap({ latitude, longitude, onPick }: Props) {
  const [ready, setReady] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).L) {
      setReady(true);
      return;
    }

    const existingScript = document.getElementById("leaflet-js");
    const existingCss = document.getElementById("leaflet-css");

    if (!existingCss) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => setReady(true);
      document.body.appendChild(script);
    } else {
      existingScript.addEventListener("load", () => setReady(true));
    }
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([latitude, longitude], 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const markerIcon = new L.Icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [0, -28],
      shadowSize: [41, 41],
    });

    const marker = L.marker([latitude, longitude], { icon: markerIcon }).addTo(map);
    markerRef.current = marker;

    map.on("click", (event: any) => {
      const { lat, lng } = event.latlng;
      marker.setLatLng([lat, lng]);
      onPick({ latitude: lat, longitude: lng });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [latitude, longitude, onPick, ready]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([latitude, longitude]);
    mapRef.current.setView([latitude, longitude], mapRef.current.getZoom());
  }, [latitude, longitude]);

  return <View ref={containerRef as any} style={styles.map} />;
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

