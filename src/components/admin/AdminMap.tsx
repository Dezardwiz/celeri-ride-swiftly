import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import L from "leaflet";
import { MONTES_CLAROS } from "@/lib/geo";
import "leaflet/dist/leaflet.css";

interface DriverLocation {
  id: string;
  moto_model: string;
  plate: string;
  status: string;
  location_lat: number | null;
  location_lng: number | null;
}

interface ActiveRide {
  id: string;
  status: string;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_lat: number | null;
  destination_lng: number | null;
  origin_address: string;
  destination_address: string;
}

export const AdminMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [rides, setRides] = useState<ActiveRide[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [driversRes, ridesRes] = await Promise.all([
      supabase.from("drivers").select("id, moto_model, plate, status, location_lat, location_lng").eq("is_approved", true),
      supabase.from("rides").select("id, status, origin_lat, origin_lng, destination_lat, destination_lng, origin_address, destination_address").in("status", ["REQUESTED", "ACCEPTED", "ARRIVING", "ARRIVED", "IN_PROGRESS"]),
    ]);
    setDrivers(driversRes.data || []);
    setRides(ridesRes.data || []);
    setLoading(false);
  };

  const [filter, setFilter] = useState<"all" | "available" | "on_ride" | "rides">("all");
  const fitted = useRef(false);

  useEffect(() => {
    fetchData();
    let t: ReturnType<typeof setTimeout> | null = null;
    const refresh = () => { if (t) clearTimeout(t); t = setTimeout(fetchData, 500); };
    const ch = supabase
      .channel("admin-map")
      .on("postgres_changes", { event: "*", schema: "public", table: "drivers" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "rides" }, refresh)
      .subscribe();
    const interval = setInterval(fetchData, 60000);
    return () => { clearInterval(interval); if (t) clearTimeout(t); supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    if (!mapRef.current || loading) return;

    if (!mapInstance.current) {
      const { center, bounds } = MONTES_CLAROS;
      const maxBounds = L.latLngBounds([bounds.south, bounds.west], [bounds.north, bounds.east]);
      mapInstance.current = L.map(mapRef.current, {
        center: [center.lat, center.lng],
        zoom: 13,
        zoomControl: true,
        maxBounds: maxBounds.pad(0.1),
        maxBoundsViscosity: 1.0,
        minZoom: 12,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        className: "dark-tiles",
      }).addTo(mapInstance.current);
    }

    const map = mapInstance.current;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    // Add driver markers
    const driverIcon = (status: string) => L.divIcon({
      className: "custom-div-icon",
      html: `<div style="background:${status === "available" ? "hsl(142,76%,36%)" : status === "on_ride" ? "hsl(45,93%,47%)" : "hsl(0,0%,50%)"};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    const bounds: L.LatLng[] = [];

    const showDrivers = filter !== "rides";
    const showRides = filter === "all" || filter === "rides";

    drivers.forEach((d) => {
      if (!showDrivers) return;
      if (filter !== "all" && d.status !== filter) return;
      if (d.location_lat && d.location_lng) {
        const pos = L.latLng(d.location_lat, d.location_lng);
        bounds.push(pos);
        const label = d.status === "available" ? "Disponível" : d.status === "on_ride" ? "Em corrida" : "Offline";
        L.marker(pos, { icon: driverIcon(d.status) })
          .addTo(map)
          .bindPopup(`<b>${d.moto_model}</b><br>Placa: ${d.plate}<br>Status: ${label}`);
      }
    });

    rides.forEach((r) => {
      if (!showRides) return;
      if (r.origin_lat && r.origin_lng) {
        const pos = L.latLng(r.origin_lat, r.origin_lng);
        bounds.push(pos);
        L.circleMarker(pos, { radius: 6, color: "hsl(var(--primary))", fillColor: "hsl(var(--primary))", fillOpacity: 0.8, weight: 2 })
          .addTo(map)
          .bindPopup(`<b>Corrida ${r.status}</b><br>📍 ${r.origin_address}<br>📌 ${r.destination_address}`);
      }
    });

    if (bounds.length > 0 && !fitted.current) {
      fitted.current = true;
      map.fitBounds(L.latLngBounds(bounds), { padding: [30, 30], maxZoom: 15 });
    }
  }, [drivers, rides, loading, filter]);

  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  const onlineDrivers = drivers.filter((d) => d.status === "available");
  const onRideDrivers = drivers.filter((d) => d.status === "on_ride");
  const filters = [
    { k: "all", l: "Todos" },
    { k: "available", l: `Disponíveis (${onlineDrivers.length})` },
    { k: "on_ride", l: `Em corrida (${onRideDrivers.length})` },
    { k: "rides", l: `Corridas (${rides.length})` },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          Mapa ao Vivo <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        </h2>
        <button onClick={fetchData} className="text-xs text-primary hover:underline">Atualizar</button>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${filter === f.k ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}
          >
            {f.l}
          </button>
        ))}
      </div>

      <Card className="bg-card border-border overflow-hidden">
        <CardContent className="p-0">
          <div ref={mapRef} className="h-[400px] w-full" />
        </CardContent>
      </Card>

      {/* Active rides list */}
      {rides.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Corridas Ativas</h3>
          {rides.map((r) => (
            <Card key={r.id} className="bg-card border-border">
              <CardContent className="p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">{r.status}</Badge>
                  <span className="text-xs text-muted-foreground">{r.id.slice(0, 8)}...</span>
                </div>
                <p className="text-xs">📍 {r.origin_address}</p>
                <p className="text-xs">📌 {r.destination_address}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
