import { DollarSign, TrendingUp, Clock, MapPin, Loader2 } from "lucide-react";
import { useDriverEarnings } from "@/hooks/useDriver";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DriverEarnings = () => {
  const { rides, loading, totalEarnings, todayEarnings } = useDriverEarnings();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <DollarSign size={12} />
            Hoje
          </div>
          <p className="font-display text-xl text-foreground tabular-nums">
            R$ {todayEarnings.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <TrendingUp size={12} />
            Total
          </div>
          <p className="font-display text-xl text-foreground tabular-nums">
            R$ {totalEarnings.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground mb-1">Corridas completadas</p>
        <p className="font-display text-2xl text-foreground tabular-nums">{rides.length}</p>
      </div>

      {/* Ride list */}
      <h3 className="font-display text-xs uppercase tracking-wider text-muted-foreground mt-2">
        Histórico de ganhos
      </h3>

      {rides.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <DollarSign className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Nenhuma corrida completada ainda</p>
        </div>
      )}

      {rides.map((ride) => {
        const price = ride.final_price ?? ride.estimated_price ?? 0;
        const date = ride.completed_at ? new Date(ride.completed_at) : new Date(ride.created_at);

        return (
          <div key={ride.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <MapPin size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {ride.destination_address}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span>{format(date, "dd MMM, HH:mm", { locale: ptBR })}</span>
                {ride.estimated_distance_km && (
                  <span className="flex items-center gap-0.5">
                    <Clock size={10} />
                    {ride.estimated_distance_km.toFixed(1)} km
                  </span>
                )}
              </div>
            </div>
            <p className="font-display text-sm text-primary tabular-nums">
              R$ {price.toFixed(2)}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default DriverEarnings;
