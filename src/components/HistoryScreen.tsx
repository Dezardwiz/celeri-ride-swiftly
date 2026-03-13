import { ArrowLeft, Star, MapPin, ChevronRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface HistoryScreenProps {
  onBack: () => void;
}

interface RideWithRating {
  id: string;
  destination_address: string;
  created_at: string;
  final_price: number | null;
  estimated_price: number | null;
  status: string;
  rating: number | null;
}

const HistoryScreen = ({ onBack }: HistoryScreenProps) => {
  const { user } = useAuth();
  const [rides, setRides] = useState<RideWithRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchRides = async () => {
      const { data: ridesData } = await supabase
        .from("rides")
        .select("id, destination_address, created_at, final_price, estimated_price, status")
        .eq("passenger_id", user.id)
        .order("created_at", { ascending: false });

      if (!ridesData) { setLoading(false); return; }

      const { data: ratingsData } = await supabase
        .from("ratings")
        .select("ride_id, score")
        .eq("from_user_id", user.id);

      const ratingsMap = new Map(ratingsData?.map((r) => [r.ride_id, r.score]) ?? []);

      setRides(
        ridesData.map((r) => ({
          ...r,
          rating: ratingsMap.get(r.id) ?? null,
        }))
      );
      setLoading(false);
    };

    fetchRides();
  }, [user]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 0) return `Hoje, ${time}`;
    if (diffDays === 1) return `Ontem, ${time}`;
    return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}, ${time}`;
  };

  const statusLabel: Record<string, string> = {
    COMPLETED: "Concluída",
    CANCELED: "Cancelada",
    REQUESTED: "Solicitada",
    IN_PROGRESS: "Em andamento",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-40 flex flex-col bg-background"
    >
      <div className="border-b border-border p-4 flex items-center gap-3">
        <button onClick={onBack} className="text-foreground p-1">
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-display text-lg uppercase tracking-wider">Histórico</h2>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : rides.length === 0 ? (
          <p className="text-center text-muted-foreground py-16 text-sm">Nenhuma corrida encontrada.</p>
        ) : (
          rides.map((ride) => (
            <div
              key={ride.id}
              className="flex w-full items-center gap-3 border-b border-border px-4 py-4 text-left"
            >
              <div className="rounded-full bg-card p-2">
                <MapPin size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{ride.destination_address}</p>
                <p className="text-xs text-muted-foreground">{formatDate(ride.created_at)}</p>
                <span className={`text-[10px] uppercase tracking-wider ${ride.status === "CANCELED" ? "text-destructive" : "text-muted-foreground"}`}>
                  {statusLabel[ride.status] ?? ride.status}
                </span>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-medium text-foreground">
                  R$ {((ride.final_price ?? ride.estimated_price) ?? 0).toFixed(2).replace(".", ",")}
                </p>
                {ride.rating && (
                  <div className="flex items-center gap-0.5 justify-end">
                    {Array.from({ length: ride.rating }).map((_, i) => (
                      <Star key={i} size={8} className="text-warning fill-warning" />
                    ))}
                  </div>
                )}
              </div>
              <ChevronRight size={14} className="text-muted-foreground" />
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default HistoryScreen;
