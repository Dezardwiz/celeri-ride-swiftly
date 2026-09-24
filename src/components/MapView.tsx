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

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

const makeIcon = (html: string, size: number) =>
  L.divIcon({ className: "", html, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });

const GOLD = "#F5B301";
const ROUTE_MAIN = GOLD;
const ROUTE_CASING = "#000000";

const pickupIcon = makeIcon(
  `<div style="width:18px;height:18px;background:${GOLD};border-radius:50%;border:3px solid #0a0a0a;box-shadow:0 2px 10px rgba(245,179,1,0.65), 0 0 0 8px rgba(245,179,1,0.16);"></div>`,
  18
);
const dropoffIcon = makeIcon(
  `<div style="width:16px;height:16px;background:#ffffff;border-radius:4px;border:3px solid ${GOLD};box-shadow:0 2px 8px rgba(0,0,0,0.5);"></div>`,
  16
);
const driverIconHtml = (heading: number) =>
  `<div style="width:36px;height:44px;display:flex;align-items:flex-start;justify-content:center;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.55));transform:rotate(${heading}deg);transition:transform 600ms cubic-bezier(0.16,1,0.3,1);">
    <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 0C8.06 0 0 8.06 0 18c0 12 18 26 18 26s18-14 18-26C36 8.06 27.94 0 18 0z" fill="${GOLD}"/>
      <circle cx="18" cy="18" r="13" fill="#0a0a0a"/>
      <path d="M12 19c0-3.31 2.69-6 6-6s6 2.69 6 6v3h-1.5v-3c0-2.49-2.01-4.5-4.5-4.5S13.5 16.51 13.5 19v3H12v-3z" fill="${GOLD}"/>
      <path d="M11 22h14v1.5H11z" fill="${GOLD}"/>
    </svg>
  </div>`;

const driverIcon = (heading = 0) => makeIcon(driverIconHtml(heading), 44);

/** Bearing in degrees from point a to point b. */
const bearing = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

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
  const routeCasingRef = useRef<L.Polyline | null>(null);
  const pulseCirclesRef = useRef<L.Circle[]>([]);
  const driverAnimRef = useRef<number | null>(null);
  const driverPosRef = useRef<{ lat: number; lng: number } | null>(null);

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
      map.flyTo([pickupLocation.lat, pickupLocation.lng], 15, { duration: 0.8, easeLinearity: 0.25 });
    }
  }, [pickupLocation.lat, pickupLocation.lng, showRoute]);

  // Update route & dropoff with real road directions
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clean previous
    if (routeLineRef.current) { map.removeLayer(routeLineRef.current); routeLineRef.current = null; }
    if (routeCasingRef.current) { map.removeLayer(routeCasingRef.current); routeCasingRef.current = null; }
    if (dropoffMarkerRef.current) { map.removeLayer(dropoffMarkerRef.current); dropoffMarkerRef.current = null; }

    if (showRoute) {
      dropoffMarkerRef.current = L.marker([dropoffLocation.lat, dropoffLocation.lng], { icon: dropoffIcon }).addTo(map);

      // Fetch real route
      fetchRoute(pickupLocation, dropoffLocation).then((result) => {
        if (!mapRef.current) return;
        if (result && result.coordinates.length > 0) {
          routeCasingRef.current = L.polyline(result.coordinates, {
            color: ROUTE_CASING, weight: 9, opacity: 0.55, lineCap: "round", lineJoin: "round",
          }).addTo(map);
          routeLineRef.current = L.polyline(result.coordinates, {
            color: ROUTE_MAIN, weight: 5, opacity: 0.95, lineCap: "round", lineJoin: "round",
            className: "animate-draw-route",
          }).addTo(map);
          map.flyToBounds(routeLineRef.current.getBounds(), {
            paddingTopLeft: [48, 100], paddingBottomRight: [48, 320], maxZoom: 16, duration: 0.9,
          });
        } else {
          // Fallback: straight line
          routeLineRef.current = L.polyline(
            [[pickupLocation.lat, pickupLocation.lng], [dropoffLocation.lat, dropoffLocation.lng]],
            { color: ROUTE_MAIN, weight: 4, opacity: 0.85, dashArray: "8 6", lineCap: "round" }
          ).addTo(map);
          map.flyToBounds(L.latLngBounds(
            [pickupLocation.lat, pickupLocation.lng],
            [dropoffLocation.lat, dropoffLocation.lng]
          ), { paddingTopLeft: [48, 100], paddingBottomRight: [48, 320], maxZoom: 16, duration: 0.9 });
        }
      });
    }
  }, [showRoute, pickupLocation.lat, pickupLocation.lng, dropoffLocation.lat, dropoffLocation.lng]);

  // Driver marker — smooth interpolated movement + heading rotation
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!driverLocation) {
      if (driverAnimRef.current) cancelAnimationFrame(driverAnimRef.current);
      if (driverMarkerRef.current) {
        map.removeLayer(driverMarkerRef.current);
        driverMarkerRef.current = null;
        driverPosRef.current = null;
      }
      return;
    }

    const target = { lat: driverLocation.lat, lng: driverLocation.lng };

    if (!driverMarkerRef.current) {
      driverMarkerRef.current = L.marker([target.lat, target.lng], { icon: driverIcon(0) }).addTo(map);
      driverPosRef.current = target;
      return;
    }

    const from = driverPosRef.current ?? target;
    const heading = bearing(from, target);
    const el = driverMarkerRef.current.getElement()?.firstElementChild as HTMLElement | null;
    if (el && (Math.abs(target.lat - from.lat) > 1e-6 || Math.abs(target.lng - from.lng) > 1e-6)) {
      el.style.transform = `rotate(${heading}deg)`;
    }

    const start = performance.now();
    const DURATION = 900;
    if (driverAnimRef.current) cancelAnimationFrame(driverAnimRef.current);

    const step = (now: number) => {
      const t = Math.min((now - start) / DURATION, 1);
      const e = 1 - Math.pow(1 - t, 3);
      const lat = from.lat + (target.lat - from.lat) * e;
      const lng = from.lng + (target.lng - from.lng) * e;
      driverMarkerRef.current?.setLatLng([lat, lng]);
      driverPosRef.current = { lat, lng };
      if (t < 1) driverAnimRef.current = requestAnimationFrame(step);
    };
    driverAnimRef.current = requestAnimationFrame(step);

    return () => {
      if (driverAnimRef.current) cancelAnimationFrame(driverAnimRef.current);
    };
  }, [driverLocation?.lat, driverLocation?.lng]);

  // Searching pulse
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    pulseCirclesRef.current.forEach((c) => map.removeLayer(c));
    pulseCirclesRef.current = [];

    if (searching) {
      const c1 = L.circle([pickupLocation.lat, pickupLocation.lng], {
        radius: 320, color: GOLD, fillColor: GOLD, fillOpacity: 0.1, weight: 1, opacity: 0.35,
      }).addTo(map);
      const c2 = L.circle([pickupLocation.lat, pickupLocation.lng], {
        radius: 160, color: GOLD, fillColor: GOLD, fillOpacity: 0.18, weight: 1, opacity: 0.5,
      }).addTo(map);
      pulseCirclesRef.current = [c1, c2];
    }
  }, [searching, pickupLocation.lat, pickupLocation.lng]);

  return <div ref={containerRef} className="absolute inset-0 z-0" />;
};

export default MapView;
