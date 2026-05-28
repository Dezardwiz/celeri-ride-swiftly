import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

type Tariff = Tables<"tariffs">;
type Ride = Tables<"rides">;

interface RideEstimate {
  distanceKm: number;
  durationMin: number;
  price: number;
}

export function useActiveTariff() {
  const [tariff, setTariff] = useState<Tariff | null>(null);

  useEffect(() => {
    supabase
      .from("tariffs")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setTariff(data);
      });
  }, []);

  return tariff;
}

export interface SurgeInfo {
  multiplier: number;
  label: string | null;
  pending: number;
  available: number;
}

export function useActiveSurge() {
  const [surge, setSurge] = useState<SurgeInfo>({ multiplier: 1, label: null, pending: 0, available: 0 });

  useEffect(() => {
    let cancelled = false;
    const fetchSurge = async () => {
      const { data } = await supabase.rpc("get_active_surge");
      if (cancelled || !data) return;
      const d = data as any;
      setSurge({
        multiplier: Number(d.multiplier) || 1,
        label: d.label ?? null,
        pending: Number(d.pending) || 0,
        available: Number(d.available) || 0,
      });
    };
    fetchSurge();
    const i = setInterval(fetchSurge, 60_000);
    return () => { cancelled = true; clearInterval(i); };
  }, []);

  return surge;
}

export function calculatePrice(
  tariff: Tariff | null,
  distanceKm: number,
  durationMin: number,
  multiplier: number = 1
): number {
  if (!tariff) return 0;
  const computed =
    tariff.base_fare + tariff.per_km * distanceKm + tariff.per_minute * durationMin;
  const base = Math.max(computed, tariff.minimum_fare);
  return base * (multiplier > 0 ? multiplier : 1);
}

export function useRide() {
  const { user } = useAuth();
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<any>(null);

  // Subscribe to changes on the current ride so we get driver_id, status, etc. in realtime.
  useEffect(() => {
    if (!currentRide?.id) return;
    const ch = supabase
      .channel(`ride-${currentRide.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rides", filter: `id=eq.${currentRide.id}` },
        (payload) => {
          setCurrentRide((prev) => (prev ? ({ ...prev, ...(payload.new as Ride) }) : (payload.new as Ride)));
        }
      )
      .subscribe();
    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [currentRide?.id]);

  const createRide = async (params: {
    originAddress: string;
    originLat: number;
    originLng: number;
    destinationAddress: string;
    destinationLat: number;
    destinationLng: number;
    estimatedDistanceKm: number;
    estimatedDurationMin: number;
    estimatedPrice: number;
  }) => {
    if (!user) return null;
    setLoading(true);
    const { data, error } = await supabase
      .from("rides")
      .insert({
        passenger_id: user.id,
        origin_address: params.originAddress,
        origin_lat: params.originLat,
        origin_lng: params.originLng,
        destination_address: params.destinationAddress,
        destination_lat: params.destinationLat,
        destination_lng: params.destinationLng,
        estimated_distance_km: params.estimatedDistanceKm,
        estimated_duration_min: params.estimatedDurationMin,
        estimated_price: params.estimatedPrice,
        status: "REQUESTED" as const,
      })
      .select()
      .single();
    setLoading(false);
    if (data) {
      setCurrentRide(data);
      // Kick off sequential matching: offer to the nearest available driver
      supabase.rpc("offer_ride_to_next_driver", { _ride_id: data.id }).catch(console.error);
      // Trigger push notifications to nearby drivers
      supabase.functions.invoke("send-push", {
        body: {
          ride_id: data.id,
          origin_lat: params.originLat,
          origin_lng: params.originLng,
          origin_address: params.originAddress,
          destination_address: params.destinationAddress,
          estimated_price: params.estimatedPrice,
        },
      }).catch(console.error);
    }
    return data;
  };

  // While the ride is REQUESTED, watch the offer window and re-offer when it expires.
  useEffect(() => {
    if (!currentRide?.id || currentRide.status !== "REQUESTED") return;
    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 20; // ~5 min of cycling through drivers

    const tick = async () => {
      if (cancelled) return;
      const expiresAt = (currentRide as any).matching_expires_at as string | null;
      const needsReoffer =
        !expiresAt || new Date(expiresAt).getTime() <= Date.now();
      if (needsReoffer && attempts < MAX_ATTEMPTS) {
        attempts++;
        await supabase.rpc("offer_ride_to_next_driver", { _ride_id: currentRide.id });
      }
    };
    tick();
    const i = setInterval(tick, 3000);
    return () => { cancelled = true; clearInterval(i); };
  }, [currentRide?.id, currentRide?.status, (currentRide as any)?.matching_expires_at]);

  const completeRide = async (finalPrice: number) => {
    if (!currentRide) return;
    await supabase
      .from("rides")
      .update({
        status: "COMPLETED" as const,
        final_price: finalPrice,
        completed_at: new Date().toISOString(),
      })
      .eq("id", currentRide.id);

    // Process automatic wallet transfer if driver is assigned
    if (currentRide.driver_id) {
      await supabase.rpc("process_ride_payment", {
        _ride_id: currentRide.id,
        _passenger_id: currentRide.passenger_id,
        _driver_id: currentRide.driver_id,
        _amount: finalPrice,
      }).then(({ error }) => {
        if (error) console.error("Payment processing error:", error);
      });
    }

    setCurrentRide((r) => (r ? { ...r, status: "COMPLETED", final_price: finalPrice } : null));
  };

  const cancelRide = async () => {
    if (!currentRide) return;
    await supabase
      .from("rides")
      .update({
        status: "CANCELED" as const,
        canceled_at: new Date().toISOString(),
      })
      .eq("id", currentRide.id);
    setCurrentRide(null);
  };

  const savePayment = async (method: "pix" | "card" | "cash", amount: number) => {
    if (!currentRide || !user) return;
    await supabase.from("payments").insert({
      ride_id: currentRide.id,
      user_id: user.id,
      amount,
      method,
      status: "completed" as const,
    });
  };

  const saveRating = async (score: number) => {
    if (!currentRide || !user || !currentRide.driver_id) return;
    await supabase.from("ratings").insert({
      ride_id: currentRide.id,
      from_user_id: user.id,
      to_user_id: currentRide.driver_id,
      score,
    });
  };

  const resetRide = () => setCurrentRide(null);

  return {
    currentRide,
    loading,
    createRide,
    completeRide,
    cancelRide,
    savePayment,
    saveRating,
    resetRide,
  };
}
