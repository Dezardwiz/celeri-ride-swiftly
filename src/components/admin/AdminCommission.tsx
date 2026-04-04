import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Percent, DollarSign, TrendingUp, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface CommissionSetting {
  id: string;
  percentage: number;
  is_active: boolean;
}

interface DriverPayout {
  id: string;
  driver_id: string;
  amount: number;
  commission_amount: number;
  gross_amount: number;
  status: string;
  period_start: string | null;
  period_end: string | null;
  paid_at: string | null;
  created_at: string;
}

export const AdminCommission = () => {
  const [commission, setCommission] = useState<CommissionSetting | null>(null);
  const [payouts, setPayouts] = useState<DriverPayout[]>([]);
  const [newPercentage, setNewPercentage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const [commRes, payoutsRes] = await Promise.all([
        supabase.from("commission_settings").select("*").eq("is_active", true).limit(1).single(),
        supabase.from("driver_payouts").select("*").order("created_at", { ascending: false }).limit(50),
      ]);
      if (commRes.data) {
        setCommission(commRes.data as CommissionSetting);
        setNewPercentage(String(commRes.data.percentage));
      }
      setPayouts((payoutsRes.data || []) as DriverPayout[]);
      setLoading(false);
    };
    fetch();
  }, []);

  const saveCommission = async () => {
    const pct = parseFloat(newPercentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast.error("Porcentagem inválida (0-100)");
      return;
    }
    setSaving(true);
    if (commission) {
      await supabase.from("commission_settings").update({ percentage: pct }).eq("id", commission.id);
      setCommission({ ...commission, percentage: pct });
    }
    toast.success("Comissão atualizada!");
    setSaving(false);
  };

  const markPaid = async (id: string) => {
    await supabase.from("driver_payouts").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    setPayouts((prev) => prev.map((p) => (p.id === id ? { ...p, status: "paid", paid_at: new Date().toISOString() } : p)));
    toast.success("Repasse marcado como pago");
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;

  const totalCommission = payouts.reduce((s, p) => s + p.commission_amount, 0);
  const totalPaid = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalPending = payouts.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Comissão & Repasses</h2>

      {/* Commission setting */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Percent className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Taxa de Comissão</span>
          </div>
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              value={newPercentage}
              onChange={(e) => setNewPercentage(e.target.value)}
              className="w-24"
              min={0}
              max={100}
            />
            <span className="text-sm text-muted-foreground">%</span>
            <Button size="sm" onClick={saveCommission} disabled={saving}>
              {saving ? "..." : "Salvar"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            A comissão é aplicada sobre cada corrida finalizada.
          </p>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="h-3 w-3 text-primary" />
              <span className="text-[10px] text-muted-foreground">Comissão Total</span>
            </div>
            <p className="text-sm font-bold">R$ {totalCommission.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center gap-1 mb-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-[10px] text-muted-foreground">Pago</span>
            </div>
            <p className="text-sm font-bold">R$ {totalPaid.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center gap-1 mb-1">
              <DollarSign className="h-3 w-3 text-yellow-500" />
              <span className="text-[10px] text-muted-foreground">Pendente</span>
            </div>
            <p className="text-sm font-bold">R$ {totalPending.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Payouts table */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Repasses aos Motoristas</h3>
          {payouts.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 text-sm">Nenhum repasse registrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs">Bruto</TableHead>
                    <TableHead className="text-xs">Comissão</TableHead>
                    <TableHead className="text-xs">Líquido</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs">
                        {format(new Date(p.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-xs">R$ {p.gross_amount.toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-primary">R$ {p.commission_amount.toFixed(2)}</TableCell>
                      <TableCell className="text-xs font-medium">R$ {p.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={p.status === "paid" ? "default" : p.status === "pending" ? "outline" : "destructive"}
                          className="text-xs"
                        >
                          {p.status === "paid" ? "Pago" : p.status === "pending" ? "Pendente" : "Cancelado"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {p.status === "pending" && (
                          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => markPaid(p.id)}>
                            Pagar
                          </Button>
                        )}
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
