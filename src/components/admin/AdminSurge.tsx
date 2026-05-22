import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, TrendingUp } from "lucide-react";

type Rule = {
  id: string;
  label: string;
  day_of_week: number | null;
  hour_start: number;
  hour_end: number;
  multiplier: number;
  is_active: boolean;
};

const DAYS = ["Todos", "Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const AdminSurge = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState<{ multiplier: number; label: string | null } | null>(null);

  const [form, setForm] = useState({
    label: "Horário de pico",
    day_of_week: "-1",
    hour_start: 17,
    hour_end: 20,
    multiplier: 1.3,
  });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("surge_rules").select("*").order("multiplier", { ascending: false });
    setRules((data as any) ?? []);
    const { data: cur } = await supabase.rpc("get_active_surge");
    if (cur) setCurrent({ multiplier: Number((cur as any).multiplier), label: (cur as any).label });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    const dow = parseInt(form.day_of_week);
    const { error } = await supabase.from("surge_rules").insert({
      label: form.label,
      day_of_week: dow === -1 ? null : dow,
      hour_start: form.hour_start,
      hour_end: form.hour_end,
      multiplier: form.multiplier,
      is_active: true,
    });
    if (error) return toast.error(error.message);
    toast.success("Regra criada");
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("surge_rules").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const handleToggle = async (id: string, is_active: boolean) => {
    await supabase.from("surge_rules").update({ is_active }).eq("id", id);
    load();
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tarifa Dinâmica</h2>
        {current && (
          <div className="flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs">
            <TrendingUp className="h-3 w-3 text-primary" />
            Agora: <strong>{current.multiplier.toFixed(2)}x</strong>
            {current.label && <span className="text-muted-foreground">· {current.label}</span>}
          </div>
        )}
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Nova regra</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Descrição</Label>
              <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Dia</Label>
              <select
                className="w-full h-10 rounded-md border border-border bg-input px-3 text-sm"
                value={form.day_of_week}
                onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
              >
                <option value="-1">Todos os dias</option>
                {DAYS.slice(1).map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hora início (0-23)</Label>
              <Input type="number" min={0} max={23} value={form.hour_start}
                onChange={(e) => setForm({ ...form, hour_start: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hora fim (1-24)</Label>
              <Input type="number" min={1} max={24} value={form.hour_end}
                onChange={(e) => setForm({ ...form, hour_end: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Multiplicador (1.00 - 3.00)</Label>
              <Input type="number" step="0.05" min={1} max={3} value={form.multiplier}
                onChange={(e) => setForm({ ...form, multiplier: parseFloat(e.target.value) || 1 })} />
            </div>
          </div>
          <Button onClick={handleCreate} className="w-full">
            <Plus className="h-4 w-4 mr-2" /> Adicionar regra
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {rules.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-6">
            Nenhuma regra cadastrada. O preço sobe automaticamente quando há mais pedidos que motoristas.
          </p>
        )}
        {rules.map((r) => (
          <Card key={r.id} className="bg-card border-border">
            <CardContent className="p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{r.label}</p>
                <p className="text-xs text-muted-foreground">
                  {DAYS[(r.day_of_week ?? -1) + 1]} · {r.hour_start.toString().padStart(2, "0")}:00–
                  {r.hour_end.toString().padStart(2, "0")}:00 · <strong>{Number(r.multiplier).toFixed(2)}x</strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={r.is_active} onCheckedChange={(v) => handleToggle(r.id, v)} />
                <Button size="icon" variant="ghost" onClick={() => handleDelete(r.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};