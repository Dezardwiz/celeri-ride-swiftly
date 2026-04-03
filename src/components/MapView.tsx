import { useEffect, useRef } from "react";
import L from "leaflet";
import { MONTES_CLAROS } from "@/lib/geo";
import { fetchRoute } from "@/lib/routing";
import "leaflet/dist/leaflet.css";

interface MapViewProps {
  showRoute?: boolean;
  searching?: boolean;
  driverLocation?: { lat: number; lng: number };
  pickupLocation?: { lat: number; lng: number };
  dropoffLocation?: { lat: number; lng: number };
}

const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

const makeIcon = (html: string, size: number) =>
  L.divIcon({ className: "", html, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });

const pickupIcon = makeIcon(
  `<div style="width:16px;height:16px;background:#2F6BFF;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
  16
);
const dropoffIcon = makeIcon(
  `<div style="width:16px;height:16px;background:#FFFFFF;border-radius:50%;border:2px solid #2F6BFF;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
  16
);
const driverIcon = makeIcon(
  `<div style="width:32px;height:32px;background:#0B0F14;border:2px solid #2F6BFF;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(47,107,255,0.4);">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2F6BFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
  </div>`,
  32
);

const MapView = ({
  showRoute = false,
  searching = false,
  driverLocation,
  pickupLocation = MONTES_CLAROS.center,
  dropoffLocation = { lat: MONTES_CLAROS.center.lat + 0.015, lng: MONTES_CLAROS.center.lng + 0.01 },
}: MapViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropoffMarkerRef = useRef<L.Marker | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const pulseCirclesRef = useRef<L.Circle[]>([]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const { bounds } = MONTES_CLAROS;
    const maxBounds = L.latLngBounds([bounds.south, bounds.west], [bounds.north, bounds.east]);

    const map = L.map(containerRef.current, {
      center: [pickupLocation.lat, pickupLocation.lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
      maxBounds: maxBounds.pad(0.1),
      maxBoundsViscosity: 1.0,
      minZoom: 12,
    });

    L.tileLayer(TILE_URL).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update pickup marker & center
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setLatLng([pickupLocation.lat, pickupLocation.lng]);
    } else {
      pickupMarkerRef.current = L.marker([pickupLocation.lat, pickupLocation.lng], { icon: pickupIcon }).addTo(map);
    }

    if (!showRoute) {
      map.setView([pickupLocation.lat, pickupLocation.lng], 15);
    }
  }, [pickupLocation.lat, pickupLocation.lng, showRoute]);

  // Update route & dropoff with real road directions
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clean previous
    if (routeLineRef.current) { map.removeLayer(routeLineRef.current); routeLineRef.current = null; }
    if (dropoffMarkerRef.current) { map.removeLayer(dropoffMarkerRef.current); dropoffMarkerRef.current = null; }

    if (showRoute) {
      dropoffMarkerRef.current = L.marker([dropoffLocation.lat, dropoffLocation.lng], { icon: dropoffIcon }).addTo(map);

      // Fetch real route
      fetchRoute(pickupLocation, dropoffLocation).then((result) => {
        if (!mapRef.current) return;
        if (result && result.coordinates.length > 0) {
          routeLineRef.current = L.polyline(result.coordinates, {
            color: "#2F6BFF", weight: 4, opacity: 0.8,
          }).addTo(map);
          map.fitBounds(routeLineRef.current.getBounds(), { padding: [60, 60], maxZoom: 15 });
        } else {
          // Fallback: straight line
          routeLineRef.current = L.polyline(
            [[pickupLocation.lat, pickupLocation.lng], [dropoffLocation.lat, dropoffLocation.lng]],
            { color: "#2F6BFF", weight: 4, opacity: 0.8, dashArray: "8 4" }
          ).addTo(map);
          map.fitBounds(L.latLngBounds(
            [pickupLocation.lat, pickupLocation.lng],
            [dropoffLocation.lat, dropoffLocation.lng]
          ), { padding: [60, 60], maxZoom: 15 });
        }
      });
    }
  }, [showRoute, pickupLocation.lat, pickupLocation.lng, dropoffLocation.lat, dropoffLocation.lng]);

  // Driver marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (driverLocation) {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLatLng([driverLocation.lat, driverLocation.lng]);
      } else {
        driverMarkerRef.current = L.marker([driverLocation.lat, driverLocation.lng], { icon: driverIcon }).addTo(map);
      }
    } else if (driverMarkerRef.current) {
      map.removeLayer(driverMarkerRef.current);
      driverMarkerRef.current = null;
    }
  }, [driverLocation?.lat, driverLocation?.lng]);

  // Searching pulse
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    pulseCirclesRef.current.forEach((c) => map.removeLayer(c));
    pulseCirclesRef.current = [];

    if (searching) {
      const c1 = L.circle([pickupLocation.lat, pickupLocation.lng], {
        radius: 300, color: "#2F6BFF", fillColor: "#2F6BFF", fillOpacity: 0.15, weight: 1,
      }).addTo(map);
      const c2 = L.circle([pickupLocation.lat, pickupLocation.lng], {
        radius: 150, color: "#2F6BFF", fillColor: "#2F6BFF", fillOpacity: 0.25, weight: 1,
      }).addTo(map);
      pulseCirclesRef.current = [c1, c2];
    }
  }, [searching, pickupLocation.lat, pickupLocation.lng]);

  return <div ref={containerRef} className="absolute inset-0 z-0" />;
};

export default MapView;
