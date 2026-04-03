import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, CreditCard, Banknote } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import { format, subDays, startOfDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
  created_at: string;
  ride_id: string;
  user_id: string;
}

interface CompletedRide {
  id: string;
  final_price: number | null;
  estimated_price: number | null;
  created_at: string;
  driver_id: string | null;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(142 76% 36%)",
  "hsl(45 93% 47%)",
  "hsl(var(--destructive))",
];

const methodLabels: Record<string, string> = {
  pix: "Pix",
  card: "Cartão",
  cash: "Dinheiro",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  completed: "Concluído",
  refunded: "Reembolsado",
};

export const AdminFinance = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [rides, setRides] = useState<CompletedRide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [paymentsRes, ridesRes] = await Promise.all([
        supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("rides").select("id, final_price, estimated_price, created_at, driver_id").eq("status", "COMPLETED").order("created_at", { ascending: false }),
      ]);
      setPayments(paymentsRes.data || []);
      setRides(ridesRes.data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;

  const totalRevenue = rides.reduce((s, r) => s + (r.final_price || r.estimated_price || 0), 0);
  const totalPayments = payments.filter(p => p.status === "completed").reduce((s, p) => s + p.amount, 0);
  const pendingPayments = payments.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0);

  // Revenue by day (last 14 days)
  const dailyMap = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    dailyMap.set(format(subDays(new Date(), i), "yyyy-MM-dd"), 0);
  }
  rides.forEach((r) => {
    const key = format(startOfDay(parseISO(r.created_at)), "yyyy-MM-dd");
    if (dailyMap.has(key)) {
      dailyMap.set(key, (dailyMap.get(key) || 0) + (r.final_price || r.estimated_price || 0));
    }
  });
  const dailyData = Array.from(dailyMap.entries()).map(([date, revenue]) => ({
    label: format(parseISO(date), "dd/MM", { locale: ptBR }),
    revenue,
  }));

  // Payment method breakdown
  const methodCounts: Record<string, number> = {};
  payments.forEach((p) => {
    methodCounts[p.method] = (methodCounts[p.method] || 0) + 1;
  });
  const methodData = Object.entries(methodCounts).map(([method, value]) => ({
    name: methodLabels[method] || method,
    value,
  }));

  const summaryCards = [
    { label: "Receita Total", value: `R$ ${totalRevenue.toFixed(2)}`, icon: TrendingUp, color: "text-green-500" },
    { label: "Pagamentos Recebidos", value: `R$ ${totalPayments.toFixed(2)}`, icon: DollarSign, color: "text-primary" },
    { label: "Pagamentos Pendentes", value: `R$ ${pendingPayments.toFixed(2)}`, icon: CreditCard, color: "text-yellow-500" },
    { label: "Total Corridas Pagas", value: rides.length, icon: Banknote, color: "text-green-500" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Financeiro</h2>

      <div className="grid grid-cols-2 gap-3">
        {summaryCards.map((c) => (
          <Card key={c.label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <c.icon className={`h-4 w-4 ${c.color}`} />
                <span className="text-xs text-muted-foreground">{c.label}</span>
              </div>
              <p className="text-lg font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue chart */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Receita diária (14 dias)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                formatter={(v: number) => [`R$ ${v.toFixed(2)}`, "Receita"]}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
              />
              <Bar dataKey="revenue" name="Receita" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Payment methods pie */}
      {methodData.length > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Métodos de Pagamento</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={methodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {methodData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent payments table */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Últimos Pagamentos</h3>
          {payments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 text-sm">Nenhum pagamento registrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs">Valor</TableHead>
                    <TableHead className="text-xs">Método</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.slice(0, 20).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs">{format(new Date(p.created_at), "dd/MM HH:mm", { locale: ptBR })}</TableCell>
                      <TableCell className="text-xs font-medium">R$ {p.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-xs">{methodLabels[p.method] || p.method}</TableCell>
                      <TableCell>
                        <Badge variant={p.status === "completed" ? "default" : p.status === "pending" ? "outline" : "destructive"} className="text-xs">
                          {statusLabels[p.status] || p.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
