import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDriver } from "@/hooks/useDriver";
import type { Tables } from "@/integrations/supabase/types";

type Ride = Tables<"rides">;
type RideStatus = "ACCEPTED" | "ARRIVING" | "ARRIVED" | "IN_PROGRESS" | "COMPLETED";

const ACTIVE_STATUSES = ["ACCEPTED", "ARRIVING", "ARRIVED", "IN_PROGRESS"] as const;

async function notifyPassenger(passengerId: string, title: string, body: string, data: Record<string, unknown> = {}) {
  try {
    await supabase.functions.invoke("send-ride-event", {
      body: { user_ids: [passengerId], title, body, data },
    });
  } catch (e) { console.error("notify passenger failed", e); }
}

export function useActiveRide() {
  const { driver, updateStatus } = useDriver();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch active ride on mount
  useEffect(() => {
    if (!driver) { setLoading(false); return; }

    const fetchActive = async () => {
      const { data } = await supabase
        .from("rides")
        .select("*")
        .eq("driver_id", driver.id)
        .in("status", [...ACTIVE_STATUSES])
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setRide(data);
      setLoading(false);
    };

    fetchActive();

    // Listen for realtime updates on driver's rides
    const channel = supabase
      .channel("active-ride-" + driver.id)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rides", filter: `driver_id=eq.${driver.id}` },
        (payload) => {
          const updated = payload.new as Ride;
          if (ACTIVE_STATUSES.includes(updated.status as any)) {
            setRide(updated);
          } else if (updated.status === "COMPLETED" || updated.status === "CANCELED") {
            setRide(null);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [driver?.id]);

  const advanceStatus = useCallback(async () => {
    if (!ride) return;
    const flow: Record<string, RideStatus> = {
      ACCEPTED: "ARRIVING",
      ARRIVING: "ARRIVED",
      ARRIVED: "IN_PROGRESS",
    };
    const next = flow[ride.status];
    if (!next) return;

    const updateData: Record<string, unknown> = { status: next };
    if (next === "IN_PROGRESS") updateData.started_at = new Date().toISOString();

    await supabase.from("rides").update(updateData).eq("id", ride.id);
    setRide((r) => r ? { ...r, ...updateData, status: next } as Ride : null);

    if (next === "ARRIVED") {
      notifyPassenger(ride.passenger_id, "🏍️ Mototáxi chegou!", "Seu mototáxi está te aguardando no local.", { ride_id: ride.id });
    } else if (next === "IN_PROGRESS") {
      notifyPassenger(ride.passenger_id, "Corrida iniciada", "Boa viagem! 🛵", { ride_id: ride.id });
    }
  }, [ride]);

  const completeRide = useCallback(async () => {
    if (!ride) return;
    const finalPrice = ride.final_price ?? ride.estimated_price ?? 0;
    await supabase.from("rides").update({
      status: "COMPLETED" as const,
      final_price: finalPrice,
      completed_at: new Date().toISOString(),
    }).eq("id", ride.id);
    await updateStatus("available");
    notifyPassenger(ride.passenger_id, "Corrida finalizada", `Total: R$ ${finalPrice.toFixed(2)}. Avalie sua viagem!`, { ride_id: ride.id });
    setRide(null);
  }, [ride, updateStatus]);

  const cancelRide = useCallback(async () => {
    if (!ride) return;
    await supabase.from("rides").update({
      status: "CANCELED" as const,
      canceled_at: new Date().toISOString(),
      driver_id: null,
    }).eq("id", ride.id);
    await updateStatus("available");
    setRide(null);
  }, [ride, updateStatus]);

  return { ride, loading, advanceStatus, completeRide, cancelRide };
}
