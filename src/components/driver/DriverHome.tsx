import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Power, MapPin, Navigation, Clock, DollarSign, Loader2 } from "lucide-react";
import { useDriver, useIncomingRides, useDriverLocation } from "@/hooks/useDriver";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Ride = Tables<"rides">;

const DriverHome = () => {
  const { driver, loading: driverLoading, updateStatus, updateLocation } = useDriver();
  const driverLocation = useDriverLocation();
  const incomingRides = useIncomingRides(driverLocation);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const isOnline = driver?.status === "available";

  // Update driver location periodically when online
  useEffect(() => {
    if (!isOnline || !driver) return;
    updateLocation(driverLocation.lat, driverLocation.lng);
    const interval = setInterval(() => {
      updateLocation(driverLocation.lat, driverLocation.lng);
    }, 30000); // every 30s
    return () => clearInterval(interval);
  }, [isOnline, driverLocation.lat, driverLocation.lng, driver?.id]);

  const toggleAvailability = async () => {
    await updateStatus(isOnline ? "unavailable" : "available");
    if (!isOnline) {
      await updateLocation(driverLocation.lat, driverLocation.lng);
    }
    toast.success(isOnline ? "Você está offline" : "Você está online!");
  };

  const acceptRide = async (ride: Ride) => {
    if (!driver) return;
    setAcceptingId(ride.id);
    const { error } = await supabase
      .from("rides")
      .update({ status: "ACCEPTED", driver_id: driver.id })
      .eq("id", ride.id)
      .eq("status", "REQUESTED");

    if (error) {
      toast.error("Corrida já aceita por outro mototaxista");
    } else {
      await updateStatus("on_ride");
      toast.success("Corrida aceita! Vá até o passageiro.");
    }
    setAcceptingId(null);
  };

  if (driverLoading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center py-20">
        <Power className="h-12 w-12 text-muted-foreground" />
        <h2 className="font-display text-lg uppercase tracking-wider text-foreground">Cadastro pendente</h2>
        <p className="text-sm text-muted-foreground">Seu cadastro de mototaxista ainda não foi encontrado ou aprovado.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 pb-24">
      {/* Status toggle */}
      <motion.button
        onClick={toggleAvailability}
        className={`relative flex items-center justify-center gap-3 rounded-2xl p-6 font-display text-lg uppercase tracking-wider transition-colors ${
          isOnline
            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
            : "bg-card text-muted-foreground border border-border"
        }`}
        whileTap={{ scale: 0.97 }}
      >
        <Power className="h-6 w-6" />
        {isOnline ? "Online — Disponível" : "Offline — Toque para ficar online"}
        <span
          className={`absolute right-4 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full ${
            isOnline ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground/40"
          }`}
        />
      </motion.button>

      {/* Incoming rides */}
      <div>
        <h3 className="font-display text-xs uppercase tracking-wider text-muted-foreground mb-3">
          Corridas próximas ({incomingRides.length})
        </h3>

        {!isOnline && (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Fique online para receber corridas</p>
          </div>
        )}

        {isOnline && incomingRides.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <Navigation className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Aguardando novas corridas próximas...</p>
          </div>
        )}

        <AnimatePresence>
          {isOnline &&
            incomingRides.map((ride) => (
              <motion.div
                key={ride.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="mb-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                    <div className="h-6 w-px bg-border" />
                    <div className="h-2.5 w-2.5 rounded-full border-2 border-primary" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Origem</p>
                      <p className="text-sm text-foreground truncate">{ride.origin_address}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Destino</p>
                      <p className="text-sm text-foreground truncate">{ride.destination_address}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4 border-t border-border pt-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin size={12} />
                    {ride.estimated_distance_km?.toFixed(1)} km
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={12} />
                    {ride.estimated_duration_min} min
                  </div>
                  <div className="ml-auto flex items-center gap-1 font-display text-sm text-primary">
                    <DollarSign size={14} />
                    R$ {(ride.estimated_price ?? 0).toFixed(2)}
                  </div>
                </div>

                <motion.button
                  onClick={() => acceptRide(ride)}
                  disabled={acceptingId === ride.id}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-display text-sm uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  whileTap={{ scale: 0.97 }}
                >
                  {acceptingId === ride.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Aceitar corrida"
                  )}
                </motion.button>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DriverHome;
