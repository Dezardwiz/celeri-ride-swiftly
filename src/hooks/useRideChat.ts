import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface RideMessage {
  id: string;
  ride_id: string;
  sender_id: string;
  sender_role: "passenger" | "driver";
  message: string;
  read_at: string | null;
  created_at: string;
}

/**
 * Live chat between passenger and driver for a ride.
 * Handles realtime subscription with automatic reconnection if the channel drops.
 */
export function useRideChat(rideId: string | null | undefined, role: "passenger" | "driver") {
  const { user } = useAuth();
  const [messages, setMessages] = useState<RideMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!rideId) { setMessages([]); setLoading(false); return; }
    const { data } = await supabase
      .from("ride_messages")
      .select("*")
      .eq("ride_id", rideId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as RideMessage[]);
    setLoading(false);
  }, [rideId]);

  useEffect(() => {
    if (!rideId) return;
    fetchMessages();

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      channel = supabase
        .channel(`ride-chat:${rideId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "ride_messages", filter: `ride_id=eq.${rideId}` },
          (payload) => {
            setMessages((prev) => {
              const msg = payload.new as RideMessage;
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "ride_messages", filter: `ride_id=eq.${rideId}` },
          (payload) => {
            const msg = payload.new as RideMessage;
            setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setConnected(true);
            // Resync any messages we may have missed
            fetchMessages();
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            setConnected(false);
            // Auto-reconnect with backoff
            if (!cancelled && !reconnectTimeoutRef.current) {
              reconnectTimeoutRef.current = setTimeout(() => {
                reconnectTimeoutRef.current = null;
                if (channel) supabase.removeChannel(channel);
                connect();
              }, 2500);
            }
          }
        });
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (channel) supabase.removeChannel(channel);
    };
  }, [rideId, fetchMessages]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !rideId || !user) return { error: "missing" as const };
      if (trimmed.length > 500) return { error: "too_long" as const };
      const { error } = await supabase.from("ride_messages").insert({
        ride_id: rideId,
        sender_id: user.id,
        sender_role: role,
        message: trimmed,
      });
      return { error: error?.message ?? null };
    },
    [rideId, user, role]
  );

  const markAllRead = useCallback(async () => {
    if (!rideId || !user) return;
    const unreadIds = messages
      .filter((m) => m.sender_id !== user.id && !m.read_at)
      .map((m) => m.id);
    if (unreadIds.length === 0) return;
    await supabase
      .from("ride_messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds);
  }, [rideId, user, messages]);

  const unreadCount = user
    ? messages.filter((m) => m.sender_id !== user.id && !m.read_at).length
    : 0;

  return { messages, loading, connected, unreadCount, sendMessage, markAllRead };
}