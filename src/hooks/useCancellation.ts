import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Settings = Tables<"cancellation_settings">;
type Ride = Tables<"rides">;

export function useCancellationSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  useEffect(() => {
    supabase
      .from("cancellation_settings")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setSettings(data));
  }, []);
  return settings;
}

/**
 * Estimate the cancellation fee that would be applied right now,
 * matching server logic in cancel_ride().
 */
export function estimateCancellationFee(
  ride: Pick<Ride, "status" | "accepted_at"> | null,
  actor: "passenger" | "driver",
  settings: Settings | null
): number {
  if (!ride || !settings) return 0;
  if (actor === "passenger") {
    if (ride.status === "ARRIVED" || ride.status === "IN_PROGRESS") {
      return Number(settings.passenger_fee_after_arrived ?? 0);
    }
    if (ride.accepted_at && (ride.status === "ACCEPTED" || ride.status === "ARRIVING")) {
      const elapsed = (Date.now() - new Date(ride.accepted_at).getTime()) / 1000;
      if (elapsed > (settings.free_window_seconds ?? 120)) {
        return Number(settings.passenger_fee_after_arrived ?? 0);
      }
    }
    return 0;
  }
  // driver
  if (ride.status === "ARRIVED" || ride.status === "IN_PROGRESS") {
    return Number(settings.driver_fee_after_accept ?? 0);
  }
  return 0;
}

export async function cancelRideRpc(rideId: string, actor: "passenger" | "driver", reason: string) {
  const { data, error } = await supabase.rpc("cancel_ride", {
    _ride_id: rideId,
    _canceled_by: actor,
    _reason: reason,
  });
  if (error) throw error;
  return data as { fee: number; seconds_since_accept: number | null };
}