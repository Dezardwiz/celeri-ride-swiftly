import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Car, Users, DollarSign, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { format, subDays, startOfDay, startOfWeek, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Stats {
  totalRides: number;
  completedRides: number;
  canceledRides: number;
  totalRevenue: number;
  totalDrivers: number;
  approvedDrivers: number;
  avgRating: number;
}

interface RideRow {
  status: string;
  final_price: number | null;
  estimated_price: number | null;
  created_at: string;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(142 76% 36%)",
  "hsl(var(--destructive))",
  "hsl(45 93% 47%)",
  "hsl(200 80% 50%)",
];

export const AdminReports = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [rides, setRides] = useState<RideRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [ridesRes, driversRes, ratingsRes] = await Promise.all([
        supabase.from("rides").select("status, final_price, estimated_price, created_at"),
        supabase.from("drivers").select("is_approved, rating_avg"),
        supabase.from("ratings").select("score"),
      ]);

      const ridesData = (ridesRes.data || []) as RideRow[];
      const drivers = driversRes.data || [];
      const ratings = ratingsRes.data || [];

      const completedRides = ridesData.filter((r) => r.status === "COMPLETED");
      const totalRevenue = completedRides.reduce(
        (sum, r) => sum + (r.final_price || r.estimated_price || 0), 0
      );
      const avgRating = ratings.length > 0
        ? ratings.reduce((s, r) => s + r.score, 0) / ratings.length
        : 0;

      setRides(ridesData);
      setStats({
        totalRides: ridesData.length,
        completedRides: completedRides.length,
        canceledRides: ridesData.filter((r) => r.status === "CANCELED").length,
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

  // --- Daily data (last 14 days) ---
  const dailyMap = new Map<string, { total: number; completed: number; canceled: number; revenue: number }>();
  for (let i = 13; i >= 0; i--) {
    const key = format(subDays(new Date(), i), "yyyy-MM-dd");
    dailyMap.set(key, { total: 0, completed: 0, canceled: 0, revenue: 0 });
  }
  rides.forEach((r) => {
    const key = format(startOfDay(parseISO(r.created_at)), "yyyy-MM-dd");
    const entry = dailyMap.get(key);
    if (!entry) return;
    entry.total++;
    if (r.status === "COMPLETED") {
      entry.completed++;
      entry.revenue += r.final_price || r.estimated_price || 0;
    }
    if (r.status === "CANCELED") entry.canceled++;
  });
  const dailyData = Array.from(dailyMap.entries()).map(([date, v]) => ({
    label: format(parseISO(date), "dd/MM", { locale: ptBR }),
    ...v,
  }));

  // --- Weekly data (last 8 weeks) ---
  const weeklyMap = new Map<string, { total: number; completed: number; revenue: number }>();
  for (let i = 7; i >= 0; i--) {
    const key = format(startOfWeek(subDays(new Date(), i * 7), { weekStartsOn: 1 }), "yyyy-MM-dd");
    if (!weeklyMap.has(key)) weeklyMap.set(key, { total: 0, completed: 0, revenue: 0 });
  }
  rides.forEach((r) => {
    const key = format(startOfWeek(parseISO(r.created_at), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const entry = weeklyMap.get(key);
    if (!entry) return;
    entry.total++;
    if (r.status === "COMPLETED") {
      entry.completed++;
      entry.revenue += r.final_price || r.estimated_price || 0;
    }
  });
  const weeklyData = Array.from(weeklyMap.entries()).map(([date, v]) => ({
    label: `Sem ${format(parseISO(date), "dd/MM", { locale: ptBR })}`,
    ...v,
  }));

  // --- Status pie data ---
  const statusCounts: Record<string, number> = {};
  rides.forEach((r) => { statusCounts[r.status] = (statusCounts[r.status] || 0) + 1; });
  const statusLabels: Record<string, string> = {
    REQUESTED: "Solicitada", ACCEPTED: "Aceita", ARRIVING: "A caminho",
    ARRIVED: "Chegou", IN_PROGRESS: "Em andamento", COMPLETED: "Concluída", CANCELED: "Cancelada",
  };
  const pieData = Object.entries(statusCounts).map(([status, value]) => ({
    name: statusLabels[status] || status, value,
  }));

  const summaryCards = [
    { label: "Total de Corridas", value: stats.totalRides, icon: Car, color: "text-primary" },
    { label: "Concluídas", value: stats.completedRides, icon: Car, color: "text-green-500" },
    { label: "Canceladas", value: stats.canceledRides, icon: XCircle, color: "text-destructive" },
    { label: "Receita Total", value: `R$ ${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-green-500" },
    { label: "Mototaxistas", value: `${stats.approvedDrivers}/${stats.totalDrivers}`, icon: Users, color: "text-primary" },
    { label: "Avaliação Média", value: `⭐ ${stats.avgRating.toFixed(1)}`, icon: Users, color: "text-yellow-500" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Relatórios</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {summaryCards.map((c) => (
          <Card key={c.label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <c.icon className={`h-4 w-4 ${c.color}`} />
                <span className="text-xs text-muted-foreground">{c.label}</span>
              </div>
              <p className="text-xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList className="bg-card">
          <TabsTrigger value="daily">Diário (14d)</TabsTrigger>
          <TabsTrigger value="weekly">Semanal</TabsTrigger>
          <TabsTrigger value="status">Por Status</TabsTrigger>
        </TabsList>

        {/* Daily bar chart */}
        <TabsContent value="daily">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Corridas por dia</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
                  />
                  <Legend />
                  <Bar dataKey="completed" name="Concluídas" fill="hsl(142 76% 36%)" radius={[4,4,0,0]} />
                  <Bar dataKey="canceled" name="Canceladas" fill="hsl(var(--destructive))" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card border-border mt-4">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Receita diária (R$)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    formatter={(v: number) => [`R$ ${v.toFixed(2)}`, "Receita"]}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weekly chart */}
        <TabsContent value="weekly">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Corridas por semana</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                  <Legend />
                  <Bar dataKey="total" name="Total" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                  <Bar dataKey="completed" name="Concluídas" fill="hsl(142 76% 36%)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card border-border mt-4">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Receita semanal (R$)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    formatter={(v: number) => [`R$ ${v.toFixed(2)}`, "Receita"]}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status pie */}
        <TabsContent value="status">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Distribuição por status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
