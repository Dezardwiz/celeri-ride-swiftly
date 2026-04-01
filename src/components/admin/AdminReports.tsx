import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Users, DollarSign, XCircle } from "lucide-react";

interface Stats {
  totalRides: number;
  completedRides: number;
  canceledRides: number;
  totalRevenue: number;
  totalDrivers: number;
  approvedDrivers: number;
  avgRating: number;
}

export const AdminReports = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [ridesRes, driversRes, ratingsRes] = await Promise.all([
        supabase.from("rides").select("status, final_price, estimated_price"),
        supabase.from("drivers").select("is_approved, rating_avg"),
        supabase.from("ratings").select("score"),
      ]);

      const rides = ridesRes.data || [];
      const drivers = driversRes.data || [];
      const ratings = ratingsRes.data || [];

      const completedRides = rides.filter((r) => r.status === "COMPLETED");
      const totalRevenue = completedRides.reduce(
        (sum, r) => sum + (r.final_price || r.estimated_price || 0), 0
      );
      const avgRating = ratings.length > 0
        ? ratings.reduce((s, r) => s + r.score, 0) / ratings.length
        : 0;

      setStats({
        totalRides: rides.length,
        completedRides: completedRides.length,
        canceledRides: rides.filter((r) => r.status === "CANCELED").length,
        totalRevenue,
        totalDrivers: drivers.length,
        approvedDrivers: drivers.filter((d) => d.is_approved).length,
        avgRating,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  if (!stats) return null;

  const cards = [
    { label: "Total de Corridas", value: stats.totalRides, icon: Car, color: "text-primary" },
    { label: "Corridas Concluídas", value: stats.completedRides, icon: Car, color: "text-green-400" },
    { label: "Corridas Canceladas", value: stats.canceledRides, icon: XCircle, color: "text-destructive" },
    { label: "Receita Total", value: `R$ ${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-green-400" },
    { label: "Mototaxistas", value: `${stats.approvedDrivers}/${stats.totalDrivers}`, icon: Users, color: "text-primary" },
    { label: "Avaliação Média", value: `⭐ ${stats.avgRating.toFixed(1)}`, icon: Users, color: "text-yellow-400" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Relatórios</h2>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <Card key={c.label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <c.icon className={`h-4 w-4 ${c.color}`} />
                <span className="text-xs text-muted-foreground">{c.label}</span>
              </div>
              <p className="text-xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
