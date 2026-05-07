import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Ban } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Settings = Tables<"cancellation_settings">;
type Cancellation = Tables<"cancellations">;

export const AdminCancellations = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [list, setList] = useState<Cancellation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("cancellation_settings").select("*").eq("is_active", true).limit(1).maybeSingle(),
      supabase.from("cancellations").select("*").order("created_at", { ascending: false }).limit(50),
    ]).then(([s, c]) => {
      setSettings(s.data);
      setList(c.data ?? []);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase
      .from("cancellation_settings")
      .update({
        free_window_seconds: settings.free_window_seconds,
        passenger_fee_after_arrived: settings.passenger_fee_after_arrived,
        driver_fee_after_accept: settings.driver_fee_after_accept,
      })
      .eq("id", settings.id);
    setSaving(false);
    if (error) toast.error("Erro ao salvar"); else toast.success("Configurações salvas");
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Ban className="h-5 w-5" /> Regras de cancelamento</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {settings && (
            <>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label>Janela gratuita (segundos)</Label>
                  <Input type="number" min={0} value={settings.free_window_seconds}
                    onChange={(e) => setSettings({ ...settings, free_window_seconds: parseInt(e.target.value || "0") })} />
                </div>
                <div>
                  <Label>Taxa do passageiro após chegada (R$)</Label>
                  <Input type="number" step="0.5" min={0} value={settings.passenger_fee_after_arrived}
                    onChange={(e) => setSettings({ ...settings, passenger_fee_after_arrived: parseFloat(e.target.value || "0") })} />
                </div>
                <div>
                  <Label>Taxa do motorista após chegada (R$)</Label>
                  <Input type="number" step="0.5" min={0} value={settings.driver_fee_after_accept}
                    onChange={(e) => setSettings({ ...settings, driver_fee_after_accept: parseFloat(e.target.value || "0") })} />
                </div>
              </div>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Cancelamentos recentes ({list.length})</CardTitle></CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum cancelamento registrado ainda.</p>
          ) : (
            <div className="space-y-2">
              {list.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                  <div>
                    <p className="font-medium">{c.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      por {c.canceled_by} · status {c.ride_status_at_cancel} ·{" "}
                      {new Date(c.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    {c.fee_amount > 0
                      ? <span className="font-display text-destructive">R$ {Number(c.fee_amount).toFixed(2)}</span>
                      : <span className="text-xs text-muted-foreground">sem taxa</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};