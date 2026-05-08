import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SavedPlace {
  id: string;
  user_id: string;
  label: string;
  category: "home" | "work" | "other" | string;
  address: string;
  lat: number;
  lng: number;
}

export interface SearchHistoryItem {
  id: string;
  address: string;
  lat: number | null;
  lng: number | null;
  searched_at: string;
}

export function useSavedPlaces() {
  const { user } = useAuth();
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const [p, h] = await Promise.all([
      supabase.from("saved_places").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
      supabase.from("search_history").select("*").eq("user_id", user.id).order("searched_at", { ascending: false }).limit(8),
    ]);
    setPlaces((p.data ?? []) as any);
    setHistory((h.data ?? []) as any);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const addPlace = useCallback(async (place: Omit<SavedPlace, "id" | "user_id">) => {
    if (!user) return;
    const { error } = await supabase.from("saved_places").insert({ ...place, user_id: user.id });
    if (!error) refresh();
    return error;
  }, [user, refresh]);

  const deletePlace = useCallback(async (id: string) => {
    await supabase.from("saved_places").delete().eq("id", id);
    refresh();
  }, [refresh]);

  const recordSearch = useCallback(async (address: string, lat?: number, lng?: number) => {
    if (!user) return;
    // de-dup: remove same address from recent
    await supabase.from("search_history").delete().eq("user_id", user.id).eq("address", address);
    await supabase.from("search_history").insert({
      user_id: user.id,
      address,
      lat: lat ?? null,
      lng: lng ?? null,
    });
  }, [user]);

  return { places, history, loading, addPlace, deletePlace, recordSearch, refresh };
}