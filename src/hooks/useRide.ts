import { useState, useEffect } from "react";
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

export function calculatePrice(
  tariff: Tariff | null,
  distanceKm: number,
  durationMin: number
): number {
  if (!tariff) return 0;
  const computed =
    tariff.base_fare + tariff.per_km * distanceKm + tariff.per_minute * durationMin;
  return Math.max(computed, tariff.minimum_fare);
}

export function useRide() {
  const { user } = useAuth();
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(false);

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
