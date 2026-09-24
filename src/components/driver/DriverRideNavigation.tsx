import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import L from "leaflet";
import { MONTES_CLAROS } from "@/lib/geo";
import { fetchRoute } from "@/lib/routing";
import { Navigation, X, ChevronRight, CheckCircle2, MapPin, ExternalLink, MessageCircle } from "lucide-react";
import { openExternalNavigation } from "@/lib/externalNav";
import RideChatSheet from "@/components/RideChatSheet";
import { useRideChat } from "@/hooks/useRideChat";
import type { Tables } from "@/integrations/supabase/types";
import "leaflet/dist/leaflet.css";

type Ride = Tables<"rides">;

interface Props {
  ride: Ride;
  onAdvance: () => void;
  onComplete: () => void;
  onCancel: () => void;
}

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

const makeIcon = (html: string, size: number) =>
  L.divIcon({ className: "", html, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });

const pickupIcon = makeIcon(
  `<div style="width:18px;height:18px;background:#22c55e;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(34,197,94,0.5);"></div>`,
  18
);
const dropoffIcon = makeIcon(
  `<div style="width:18px;height:18px;background:#ef4444;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(239,68,68,0.5);"></div>`,
  18
);
const driverIcon = makeIcon(
  `<div style="width:36px;height:36px;background:#0B0F14;border:2px solid #2F6BFF;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(47,107,255,0.5);">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2F6BFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
  </div>`,
  36
);

const STATUS_LABELS: Record<string, { label: string; action: string; color: string }> = {
  ACCEPTED: { label: "Indo até o passageiro", action: "Cheguei no local", color: "bg-primary" },
  ARRIVING: { label: "A caminho do passageiro", action: "Cheguei no local", color: "bg-primary" },
  ARRIVED: { label: "Aguardando passageiro", action: "Iniciar corrida", color: "bg-emerald-500" },
  IN_PROGRESS: { label: "Corrida em andamento", action: "Finalizar corrida", color: "bg-emerald-500" },
};

const DriverRideNavigation = ({ ride, onAdvance, onComplete, onCancel }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const routeRef = useRef<L.Polyline | null>(null);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const { unreadCount } = useRideChat(ride.id, "driver");

  const pickup = { lat: ride.origin_lat ?? MONTES_CLAROS.center.lat, lng: ride.origin_lng ?? MONTES_CLAROS.center.lng };
  const dropoff = { lat: ride.destination_lat ?? MONTES_CLAROS.center.lat + 0.01, lng: ride.destination_lng ?? MONTES_CLAROS.center.lng + 0.01 };

  const isGoingToPickup = ["ACCEPTED", "ARRIVING"].includes(ride.status);
  const target = isGoingToPickup ? pickup : dropoff;
  const statusInfo = STATUS_LABELS[ride.status] ?? STATUS_LABELS.ACCEPTED;

  // Track driver position
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setDriverPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setDriverPos(MONTES_CLAROS.center),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const { bounds } = MONTES_CLAROS;
    const maxBounds = L.latLngBounds([bounds.south, bounds.west], [bounds.north, bounds.east]);

    const map = L.map(containerRef.current, {
      center: [pickup.lat, pickup.lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
      maxBounds: maxBounds.pad(0.1),
      maxBoundsViscosity: 1.0,
      minZoom: 12,
    });
    L.tileLayer(TILE_URL).addTo(map);

    // Add pickup & dropoff markers
    L.marker([pickup.lat, pickup.lng], { icon: pickupIcon }).addTo(map);
    L.marker([dropoff.lat, dropoff.lng], { icon: dropoffIcon }).addTo(map);

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Update driver marker & route with real road directions
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !driverPos) return;

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng([driverPos.lat, driverPos.lng]);
    } else {
      driverMarkerRef.current = L.marker([driverPos.lat, driverPos.lng], { icon: driverIcon }).addTo(map);
    }

    // Fetch real route from driver to target
    if (routeRef.current) map.removeLayer(routeRef.current);

    const routeColor = isGoingToPickup ? "#2F6BFF" : "#22c55e";

    fetchRoute(driverPos, target).then((result) => {
      if (!mapRef.current) return;
      if (result && result.coordinates.length > 0) {
        routeRef.current = L.polyline(result.coordinates, {
          color: routeColor, weight: 4, opacity: 0.8,
        }).addTo(map);
        map.fitBounds(routeRef.current.getBounds(), { padding: [80, 80], maxZoom: 16 });
      } else {
        // Fallback: straight line
        routeRef.current = L.polyline(
          [[driverPos.lat, driverPos.lng], [target.lat, target.lng]],
          { color: routeColor, weight: 4, opacity: 0.8, dashArray: "8 4" }
        ).addTo(map);
        const allPoints: L.LatLngExpression[] = [[driverPos.lat, driverPos.lng], [target.lat, target.lng]];
        map.fitBounds(L.latLngBounds(allPoints), { padding: [80, 80], maxZoom: 16 });
      }
    });
  }, [driverPos?.lat, driverPos?.lng, ride.status]);

  const handleAction = () => {
    if (ride.status === "IN_PROGRESS") {
      onComplete();
    } else {
      onAdvance();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex flex-col bg-background"
    >
      {/* Map */}
      <div ref={containerRef} className="flex-1 relative" />

      {/* Status header overlay */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4">
        <div className="rounded-xl bg-background/90 backdrop-blur-md border border-border p-3 flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full animate-pulse ${ride.status === "IN_PROGRESS" ? "bg-emerald-400" : "bg-primary"}`} />
          <div className="flex-1">
            <p className="font-display text-xs uppercase tracking-wider text-muted-foreground">
              {statusInfo.label}
            </p>
            <p className="text-sm text-foreground truncate">
              {isGoingToPickup ? ride.origin_address : ride.destination_address}
            </p>
          </div>
          <Navigation className="h-5 w-5 text-primary" />
        </div>
      </div>

      {/* Bottom panel */}
      <div className="border-t border-border bg-background p-4 space-y-3">
        {/* External navigation */}
        <div className="flex gap-2">
          <button
            onClick={() => openExternalNavigation(target.lat, target.lng, "waze")}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card py-2.5 text-xs font-display uppercase tracking-wider text-foreground"
          >
            <ExternalLink size={12} /> Waze
          </button>
          <button
            onClick={() => openExternalNavigation(target.lat, target.lng, "google")}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card py-2.5 text-xs font-display uppercase tracking-wider text-foreground"
          >
            <ExternalLink size={12} /> Google Maps
          </button>
        </div>

        {/* Ride info */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-muted-foreground" />
            <span className="text-muted-foreground">{ride.estimated_distance_km?.toFixed(1)} km</span>
          </div>
          <div className="text-muted-foreground">~{ride.estimated_duration_min} min</div>
          <div className="ml-auto font-display text-primary">
            R$ {(ride.estimated_price ?? 0).toFixed(2)}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {ride.status !== "IN_PROGRESS" && (
            <motion.button
              onClick={onCancel}
              className="flex items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-destructive"
              whileTap={{ scale: 0.95 }}
            >
              <X size={20} />
            </motion.button>
          )}
          <motion.button
            onClick={() => setChatOpen(true)}
            className="relative flex items-center justify-center rounded-xl border border-border bg-card p-3 text-foreground"
            whileTap={{ scale: 0.95 }}
            aria-label="Chat com passageiro"
          >
            <MessageCircle size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-display text-primary-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </motion.button>
          <motion.button
            onClick={handleAction}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 font-display text-sm uppercase tracking-wider text-white ${statusInfo.color}`}
            whileTap={{ scale: 0.97 }}
          >
            {ride.status === "IN_PROGRESS" ? (
              <CheckCircle2 size={18} />
            ) : (
              <ChevronRight size={18} />
            )}
            {statusInfo.action}
          </motion.button>
        </div>
      </div>

      <RideChatSheet
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        rideId={ride.id}
        role="driver"
        counterpartyName="Passageiro"
      />
    </motion.div>
  );
};

export default DriverRideNavigation;
