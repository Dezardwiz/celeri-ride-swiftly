import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DriverInfo {
  id: string;
  name: string;
  plate: string;
  moto_model: string;
  photo_url: string | null;
  rating: number;
  total_rides: number;
  location_lat: number | null;
  location_lng: number | null;
}

export function useDriverInfo(driverId?: string | null) {
  const [driver, setDriver] = useState<DriverInfo | null>(null);

  useEffect(() => {
    if (!driverId) { setDriver(null); return; }
    let active = true;

    const fetchDriver = async () => {
      const { data: d } = await supabase
        .from("drivers")
        .select("id, user_id, plate, moto_model, photo_url, rating_avg, total_rides, location_lat, location_lng")
        .eq("id", driverId)
        .maybeSingle();
      if (!d || !active) return;
      const { data: p } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", (d as any).user_id)
        .maybeSingle();
      if (!active) return;
      setDriver({
        id: d.id,
        name: (p as any)?.full_name ?? "Mototaxista",
        plate: d.plate,
        moto_model: d.moto_model,
        photo_url: d.photo_url,
        rating: Number(d.rating_avg ?? 0),
        total_rides: d.total_rides ?? 0,
        location_lat: d.location_lat as any,
        location_lng: d.location_lng as any,
      });
    };

    fetchDriver();

    const channel = supabase
      .channel(`driver-info-${driverId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "drivers", filter: `id=eq.${driverId}` },
        (payload) => {
          const n = payload.new as any;
          setDriver((prev) => prev ? {
            ...prev,
            location_lat: n.location_lat,
            location_lng: n.location_lng,
            rating: Number(n.rating_avg ?? prev.rating),
          } : prev);
        }
      )
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, [driverId]);

  return driver;
}

// Compute ETA in minutes given driver position and pickup, assuming 28 km/h average urban speed.
export function estimateEtaMin(
  driver?: { location_lat: number | null; location_lng: number | null } | null,
  target?: { lat: number; lng: number } | null
): number | null {
  if (!driver?.location_lat || !driver?.location_lng || !target) return null;
  const R = 6371;
  const dLat = ((target.lat - driver.location_lat) * Math.PI) / 180;
  const dLng = ((target.lng - driver.location_lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((driver.location_lat * Math.PI) / 180) * Math.cos((target.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const km = R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)) * 1.3;
  return Math.max(1, Math.round((km / 28) * 60));
}