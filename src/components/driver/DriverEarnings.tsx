import { DollarSign, TrendingUp, Clock, MapPin, Loader2, Percent, Wallet } from "lucide-react";
import { useDriverEarnings } from "@/hooks/useDriver";
import { useWallet } from "@/hooks/useWallet";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DriverEarnings = () => {
  const { rides, loading, totalEarnings, todayEarnings, payouts } = useDriverEarnings();
  const { wallet } = useWallet();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate totals from payouts
  const totalCommission = payouts.reduce((sum, p) => sum + (p.commission_amount ?? 0), 0);
  const totalNet = payouts.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {/* Wallet balance */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
          <Wallet size={18} className="text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Saldo da carteira</p>
          <p className="font-display text-2xl text-foreground tabular-nums">
            R$ {(wallet?.balance ?? 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <DollarSign size={12} />
            Hoje (bruto)
          </div>
          <p className="font-display text-xl text-foreground tabular-nums">
            R$ {todayEarnings.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <TrendingUp size={12} />
            Total (bruto)
          </div>
          <p className="font-display text-xl text-foreground tabular-nums">
            R$ {totalEarnings.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-destructive/70 mb-1">
            <Percent size={12} />
            Comissão total
          </div>
          <p className="font-display text-lg text-destructive tabular-nums">
            - R$ {totalCommission.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-primary/30 bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-primary mb-1">
            <DollarSign size={12} />
            Líquido total
          </div>
          <p className="font-display text-lg text-primary tabular-nums">
            R$ {totalNet.toFixed(2)}
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
        const grossPrice = ride.final_price ?? ride.estimated_price ?? 0;
        const payout = payouts.find((p) => p.reference_ride_id === ride.id);
        const commission = payout?.commission_amount ?? 0;
        const netPrice = payout?.amount ?? grossPrice;
        const date = ride.completed_at ? new Date(ride.completed_at) : new Date(ride.created_at);

        return (
          <div key={ride.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-center gap-3">
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
            </div>
            {/* Price breakdown */}
            <div className="flex items-center justify-between text-xs border-t border-border pt-2 ml-13">
              <div className="flex gap-4">
                <span className="text-muted-foreground">
                  Bruto: <span className="text-foreground">R$ {grossPrice.toFixed(2)}</span>
                </span>
                {commission > 0 && (
                  <span className="text-destructive/70">
                    Comissão: -R$ {commission.toFixed(2)}
                  </span>
                )}
              </div>
              <span className="font-display text-sm text-primary tabular-nums">
                R$ {netPrice.toFixed(2)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DriverEarnings;
