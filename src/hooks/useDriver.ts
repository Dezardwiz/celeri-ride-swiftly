import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";
import { MONTES_CLAROS } from "@/lib/geo";
import { getCurrentPosition, watchPosition, requestLocationPermission } from "@/lib/geolocation";

type Driver = Tables<"drivers">;
type Ride = Tables<"rides">;
type DriverStatus = "available" | "unavailable" | "on_ride";

// Haversine distance in km
function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

const MAX_DISTANCE_KM = 8; // Only show rides within 8km

export function useDriver() {
  const { user } = useAuth();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("drivers")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setDriver(data);
        setLoading(false);
      });
  }, [user]);

  const updateStatus = useCallback(
    async (status: DriverStatus) => {
      if (!driver) return;
      const { error } = await supabase
        .from("drivers")
        .update({ status })
        .eq("id", driver.id);
      if (!error) setDriver((d) => (d ? { ...d, status } : null));
    },
    [driver]
  );

  const updateLocation = useCallback(
    async (lat: number, lng: number) => {
      if (!driver) return;
      await supabase
        .from("drivers")
        .update({ location_lat: lat, location_lng: lng } as any)
        .eq("id", driver.id);
    },
    [driver]
  );

  const setRestUntil = useCallback(
    async (until: Date | null) => {
      if (!driver) return;
      const value = until ? until.toISOString() : null;
      const { error } = await supabase
        .from("drivers")
        .update({ rest_until: value } as any)
        .eq("id", driver.id);
      if (!error) setDriver((d) => (d ? ({ ...d, rest_until: value } as Driver) : null));
    },
    [driver]
  );

  return { driver, loading, updateStatus, updateLocation, setRestUntil };
}

export function useDriverLocation() {
  const [location, setLocation] = useState<{ lat: number; lng: number }>(MONTES_CLAROS.center);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    (async () => {
      const granted = await requestLocationPermission();
      if (!granted) return;

      const pos = await getCurrentPosition();
      if (pos) setLocation(pos);

      cleanup = watchPosition(
        (p) => setLocation(p),
        () => {}
      );
    })();

    return () => cleanup?.();
  }, []);

  return location;
}

export function useIncomingRides(driverLocation?: { lat: number; lng: number }) {
  const [rides, setRides] = useState<Ride[]>([]);

  const filterByProximity = useCallback(
    (rideList: Ride[]) => {
      if (!driverLocation) return rideList;
      return rideList.filter((r) => {
        if (r.origin_lat == null || r.origin_lng == null) return true; // show if no coords
        const dist = haversine(driverLocation, { lat: r.origin_lat, lng: r.origin_lng });
        return dist <= MAX_DISTANCE_KM;
      });
    },
    [driverLocation?.lat, driverLocation?.lng]
  );

  const fetchRides = useCallback(async () => {
    const { data } = await supabase
      .from("rides")
      .select("*")
      .eq("status", "REQUESTED")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setRides(filterByProximity(data));
  }, [filterByProximity]);

  useEffect(() => {
    fetchRides();
    const channel = supabase
      .channel("incoming-rides")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rides", filter: "status=eq.REQUESTED" },
        () => fetchRides()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchRides]);

  return rides;
}

interface DriverPayout {
  driver_id: string;
  gross_amount: number;
  commission_amount: number;
  amount: number;
  reference_ride_id?: string;
}

export function useDriverEarnings() {
  const { user } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [payouts, setPayouts] = useState<DriverPayout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("drivers")
      .select("id")
      .eq("user_id", user.id)
      .single()
      .then(async ({ data: driver }) => {
        if (!driver) { setLoading(false); return; }
        const [ridesRes, payoutsRes] = await Promise.all([
          supabase
            .from("rides")
            .select("*")
            .eq("driver_id", driver.id)
            .eq("status", "COMPLETED")
            .order("completed_at", { ascending: false })
            .limit(50),
          supabase
            .from("driver_payouts")
            .select("*")
            .eq("driver_id", driver.id)
            .order("created_at", { ascending: false })
            .limit(50),
        ]);
        if (ridesRes.data) setRides(ridesRes.data);
        if (payoutsRes.data) setPayouts(payoutsRes.data as any);
        setLoading(false);
      });
  }, [user]);

  const totalEarnings = rides.reduce((sum, r) => sum + (r.final_price ?? r.estimated_price ?? 0), 0);
  const todayEarnings = rides
    .filter((r) => r.completed_at && new Date(r.completed_at).toDateString() === new Date().toDateString())
    .reduce((sum, r) => sum + (r.final_price ?? r.estimated_price ?? 0), 0);

  return { rides, loading, totalEarnings, todayEarnings, payouts };
}
