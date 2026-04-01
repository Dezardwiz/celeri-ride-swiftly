import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

type Ride = Tables<"rides">;

const statusColors: Record<string, string> = {
  REQUESTED: "bg-yellow-500/20 text-yellow-400",
  ACCEPTED: "bg-blue-500/20 text-blue-400",
  ARRIVING: "bg-blue-500/20 text-blue-400",
  ARRIVED: "bg-blue-500/20 text-blue-400",
  IN_PROGRESS: "bg-primary/20 text-primary",
  COMPLETED: "bg-green-500/20 text-green-400",
  CANCELED: "bg-destructive/20 text-destructive",
};

export const AdminRides = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const fetchRides = async () => {
      let query = supabase.from("rides").select("*").order("created_at", { ascending: false }).limit(100);
      if (filter !== "all") {
        query = query.eq("status", filter as Ride["status"]);
      }
      const { data } = await query;
      setRides(data || []);
      setLoading(false);
    };
    fetchRides();
  }, [filter]);

  const filters = ["all", "REQUESTED", "IN_PROGRESS", "COMPLETED", "CANCELED"];

  if (loading) return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setLoading(true); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {f === "all" ? "Todas" : f.replace("_", " ")}
          </button>
        ))}
      </div>

      {rides.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Nenhuma corrida encontrada.</p>
      ) : (
        <div className="grid gap-3">
          {rides.map((r) => (
            <Card key={r.id} className="bg-card border-border">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge className={`text-xs ${statusColors[r.status] || ""}`}>
                    {r.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(r.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <div className="text-sm space-y-1">
                  <p>📍 {r.origin_address}</p>
                  <p>📌 {r.destination_address}</p>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Estimado: R$ {r.estimated_price?.toFixed(2) || "—"}</span>
                  <span>Final: R$ {r.final_price?.toFixed(2) || "—"}</span>
                  <span>{r.estimated_distance_km?.toFixed(1) || "—"} km</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
