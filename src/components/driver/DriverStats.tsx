import { useEffect, useState } from "react";
import { Loader2, TrendingUp, CheckCircle2, XCircle, Zap, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDriver } from "@/hooks/useDriver";

type Stats = {
  totalRides: number;
  completed: number;
  canceledByDriver: number;
  canceledByPassenger: number;
  acceptanceRate: number;
  cancellationRate: number;
  ridesPerHour: number;
  avgEarnings: number;
  totalGross: number;
  totalNet: number;
};

const DriverStats = () => {
  const { driver } = useDriver();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [period, setPeriod] = useState<7 | 30>(7);

  useEffect(() => {
    if (!driver) return;
    setLoading(true);
    const since = new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString();

    (async () => {
      const [ridesRes, cancRes, payRes] = await Promise.all([
        supabase
          .from("rides")
          .select("id,status,created_at,started_at,completed_at,final_price,estimated_price")
          .eq("driver_id", driver.id)
          .gte("created_at", since),
        supabase
          .from("cancellations")
          .select("ride_id,canceled_by,created_at")
          .eq("driver_id", driver.id)
          .gte("created_at", since),
        supabase
          .from("driver_payouts")
          .select("amount,created_at")
          .eq("driver_id", driver.id)
          .gte("created_at", since),
      ]);

      const rides = ridesRes.data ?? [];
      const cancs = cancRes.data ?? [];
      const payouts = payRes.data ?? [];

      const completed = rides.filter((r) => r.status === "COMPLETED").length;
      const canceledByDriver = cancs.filter((c) => c.canceled_by === "driver").length;
      const canceledByPassenger = cancs.filter((c) => c.canceled_by === "passenger").length;
      const totalRides = completed + canceledByDriver + canceledByPassenger;

      // Acceptance ≈ rides accepted vs canceled by driver shortly after
      const acceptanceRate = totalRides === 0 ? 0 : 100 * (totalRides - canceledByDriver) / totalRides;
      const cancellationRate = totalRides === 0 ? 0 : 100 * canceledByDriver / totalRides;

      // Hours active: estimate by sum of (completed_at - started_at) for COMPLETED
      const activeHours = rides
        .filter((r) => r.started_at && r.completed_at)
        .reduce((sum, r) => sum + (new Date(r.completed_at!).getTime() - new Date(r.started_at!).getTime()) / 3600000, 0);
      const ridesPerHour = activeHours > 0 ? completed / activeHours : 0;

      const totalGross = rides
        .filter((r) => r.status === "COMPLETED")
        .reduce((s, r) => s + (r.final_price ?? r.estimated_price ?? 0), 0);
      const totalNet = payouts.reduce((s, p) => s + (p.amount ?? 0), 0);
      const avgEarnings = completed > 0 ? totalNet / completed : 0;

      setStats({
        totalRides, completed, canceledByDriver, canceledByPassenger,
        acceptanceRate, cancellationRate, ridesPerHour, avgEarnings,
        totalGross, totalNet,
      });
      setLoading(false);
    })();
  }, [driver?.id, period]);

  if (loading || !stats) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {/* Period toggle */}
      <div className="flex rounded-xl border border-border bg-card p-1">
        {[7, 30].map((d) => (
          <button
            key={d}
            onClick={() => setPeriod(d as 7 | 30)}
            className={`flex-1 rounded-lg py-2 font-display text-xs uppercase tracking-wider ${
              period === d ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            Últimos {d} dias
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<CheckCircle2 size={14} />} label="Aceitação" value={`${stats.acceptanceRate.toFixed(0)}%`} accent="emerald" />
        <StatCard icon={<XCircle size={14} />} label="Cancelamento" value={`${stats.cancellationRate.toFixed(0)}%`} accent="destructive" />
        <StatCard icon={<Zap size={14} />} label="Corridas/hora" value={stats.ridesPerHour.toFixed(1)} />
        <StatCard icon={<DollarSign size={14} />} label="Ganho médio" value={`R$ ${stats.avgEarnings.toFixed(2)}`} />
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <h3 className="font-display text-xs uppercase tracking-wider text-muted-foreground">Resumo do período</h3>
        <Row label="Corridas concluídas" value={stats.completed.toString()} />
        <Row label="Canceladas por você" value={stats.canceledByDriver.toString()} />
        <Row label="Canceladas pelo passageiro" value={stats.canceledByPassenger.toString()} />
        <Row label="Total bruto" value={`R$ ${stats.totalGross.toFixed(2)}`} />
        <Row label="Total líquido" value={`R$ ${stats.totalNet.toFixed(2)}`} accent />
      </div>

      <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
        <TrendingUp size={18} className="text-primary" />
        <p className="text-xs text-muted-foreground">
          {stats.acceptanceRate >= 80
            ? "Excelente taxa de aceitação! Continue assim."
            : "Tente aceitar mais corridas para aumentar sua reputação."}
        </p>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: "emerald" | "destructive" }) => (
  <div className="rounded-xl border border-border bg-card p-4">
    <div className={`flex items-center gap-2 text-xs mb-1 ${
      accent === "emerald" ? "text-emerald-400" : accent === "destructive" ? "text-destructive/80" : "text-muted-foreground"
    }`}>
      {icon}
      {label}
    </div>
    <p className="font-display text-xl text-foreground tabular-nums">{value}</p>
  </div>
);

const Row = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={`tabular-nums ${accent ? "font-display text-primary" : "text-foreground"}`}>{value}</span>
  </div>
);

export default DriverStats;
