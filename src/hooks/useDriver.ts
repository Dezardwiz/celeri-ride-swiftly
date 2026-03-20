import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

type Driver = Tables<"drivers">;
type Ride = Tables<"rides">;
type DriverStatus = "available" | "unavailable" | "on_ride";

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

  return { driver, loading, updateStatus };
}

export function useIncomingRides() {
  const [rides, setRides] = useState<Ride[]>([]);

  const fetchRides = useCallback(async () => {
    const { data } = await supabase
      .from("rides")
      .select("*")
      .eq("status", "REQUESTED")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setRides(data);
  }, []);

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

export function useDriverEarnings() {
  const { user } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
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
        const { data } = await supabase
          .from("rides")
          .select("*")
          .eq("driver_id", driver.id)
          .eq("status", "COMPLETED")
          .order("completed_at", { ascending: false })
          .limit(50);
        if (data) setRides(data);
        setLoading(false);
      });
  }, [user]);

  const totalEarnings = rides.reduce((sum, r) => sum + (r.final_price ?? r.estimated_price ?? 0), 0);
  const todayEarnings = rides
    .filter((r) => r.completed_at && new Date(r.completed_at).toDateString() === new Date().toDateString())
    .reduce((sum, r) => sum + (r.final_price ?? r.estimated_price ?? 0), 0);

  return { rides, loading, totalEarnings, todayEarnings };
}
