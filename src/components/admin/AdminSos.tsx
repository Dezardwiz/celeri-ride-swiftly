import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, MapPin, Check } from "lucide-react";
import { toast } from "sonner";
import { playSound } from "@/lib/notifications";

interface SosRow {
  id: string;
  user_id: string;
  ride_id: string | null;
  role: string;
  lat: number | null;
  lng: number | null;
  status: string;
  created_at: string;
  full_name?: string | null;
  phone?: string | null;
}

export const AdminSos = () => {
  const [alerts, setAlerts] = useState<SosRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    const { data } = await supabase
      .from("sos_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    const rows = (data ?? []) as SosRow[];
    const ids = [...new Set(rows.map((r) => r.user_id))];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name, phone").in("user_id", ids);
      const m = new Map((profs ?? []).map((p) => [p.user_id, p]));
      rows.forEach((r) => { r.full_name = m.get(r.user_id)?.full_name; r.phone = m.get(r.user_id)?.phone; });
    }
    setAlerts(rows);
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
    const ch = supabase
      .channel("admin-sos")
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_alerts" }, (p) => {
        if (p.eventType === "INSERT") {
          playSound("sos");
          toast.error("🚨 Novo alerta SOS recebido!");
        }
        fetchAlerts();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const resolve = async (id: string) => {
    const { error } = await supabase.from("sos_alerts").update({ status: "resolved", resolved_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Alerta marcado como resolvido");
  };

  if (loading) return <div className="py-8 text-center text-muted-foreground">Carregando...</div>;
  const open = alerts.filter((a) => a.status === "open").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><ShieldAlert className="h-5 w-5 text-destructive" /> Central de Segurança</h2>
        <Badge variant={open ? "destructive" : "outline"}>{open} em aberto</Badge>
      </div>
      {alerts.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">Nenhum alerta SOS registrado.</p>
      ) : alerts.map((a) => (
        <Card key={a.id} className={a.status === "open" ? "border-destructive" : ""}>
          <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant={a.status === "open" ? "destructive" : "secondary"}>{a.status === "open" ? "ABERTO" : "RESOLVIDO"}</Badge>
                <span className="text-xs text-muted-foreground">{a.role === "driver" ? "Mototaxista" : "Passageiro"}</span>
              </div>
              <p className="text-sm font-medium">{a.full_name || "Sem nome"} {a.phone ? `• ${a.phone}` : ""}</p>
              <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("pt-BR")}{a.ride_id ? ` • Corrida ${a.ride_id.slice(0, 8)}` : ""}</p>
            </div>
            <div className="flex gap-2">
              {a.lat && a.lng && (
                <Button size="sm" variant="outline" asChild>
                  <a href={`https://maps.google.com/?q=${a.lat},${a.lng}`} target="_blank" rel="noreferrer"><MapPin className="mr-1 h-4 w-4" /> Local</a>
                </Button>
              )}
              {a.status === "open" && (
                <Button size="sm" onClick={() => resolve(a.id)}><Check className="mr-1 h-4 w-4" /> Resolver</Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
