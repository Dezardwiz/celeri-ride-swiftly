import { useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapViewProps {
  showRoute?: boolean;
  searching?: boolean;
  driverLocation?: { lat: number; lng: number };
  pickupLocation?: { lat: number; lng: number };
  dropoffLocation?: { lat: number; lng: number };
}

// Custom icons
const createIcon = (color: string, size: number = 12) =>
  L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

const pickupIcon = createIcon("#2F6BFF", 16);
const dropoffIcon = createIcon("#FFFFFF", 16);
const driverIcon = L.divIcon({
  className: "",
  html: `<div style="width:32px;height:32px;background:#0B0F14;border:2px solid #2F6BFF;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(47,107,255,0.4);">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2F6BFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Dark map tile style
const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

// Manaus default center
const DEFAULT_CENTER: [number, number] = [-3.119, -60.022];

// Component to fit map bounds when route is shown
const FitBounds = ({ pickup, dropoff }: { pickup: [number, number]; dropoff: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([pickup, dropoff]);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
  }, [map, pickup, dropoff]);
  return null;
};

// Re-center map on pickup location
const RecenterMap = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15);
  }, [map, center]);
  return null;
};

// Animated searching pulse
const SearchingPulse = ({ position }: { position: [number, number] }) => {
  return (
    <>
      <Circle
        center={position}
        radius={300}
        pathOptions={{ color: "#2F6BFF", fillColor: "#2F6BFF", fillOpacity: 0.15, weight: 1 }}
      />
      <Circle
        center={position}
        radius={150}
        pathOptions={{ color: "#2F6BFF", fillColor: "#2F6BFF", fillOpacity: 0.25, weight: 1 }}
      />
    </>
  );
};

const MapView = ({
  showRoute = false,
  searching = false,
  driverLocation,
  pickupLocation = { lat: -3.119, lng: -60.022 },
  dropoffLocation = { lat: -3.095, lng: -60.005 },
}: MapViewProps) => {
  const pickup: [number, number] = [pickupLocation.lat, pickupLocation.lng];
  const dropoff: [number, number] = [dropoffLocation.lat, dropoffLocation.lng];

  const routePoints: [number, number][] = useMemo(() => {
    if (!showRoute) return [];
    // Simple interpolated route between pickup and dropoff
    const steps = 10;
    const points: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lat = pickup[0] + (dropoff[0] - pickup[0]) * t;
      const lng = pickup[1] + (dropoff[1] - pickup[1]) * t;
      // Add slight curve
      const curve = Math.sin(t * Math.PI) * 0.008;
      points.push([lat + curve, lng]);
    }
    return points;
  }, [showRoute, pickup[0], pickup[1], dropoff[0], dropoff[1]]);

  return (
    <div className="absolute inset-0 z-0">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={14}
        zoomControl={false}
        attributionControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        
        {/* Re-center on user location when not showing route */}
        {!showRoute && <RecenterMap center={pickup} />}
        {/* Pickup marker */}
        <Marker position={pickup} icon={pickupIcon} />

        {/* Route */}
        {showRoute && routePoints.length > 0 && (
          <>
            <Polyline
              positions={routePoints}
              pathOptions={{ color: "#2F6BFF", weight: 4, opacity: 0.8, dashArray: "8 4" }}
            />
            <Marker position={dropoff} icon={dropoffIcon} />
            <FitBounds pickup={pickup} dropoff={dropoff} />
          </>
        )}

        {/* Searching animation */}
        {searching && <SearchingPulse position={pickup} />}

        {/* Driver marker */}
        {driverLocation && (
          <Marker
            position={[driverLocation.lat, driverLocation.lng]}
            icon={driverIcon}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;
