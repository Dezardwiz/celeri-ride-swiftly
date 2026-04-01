import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Tariff = Tables<"tariffs">;

export const AdminTariffs = () => {
  const [tariff, setTariff] = useState<Tariff | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("tariffs").select("*").eq("is_active", true).limit(1).single().then(({ data }) => {
      setTariff(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!tariff) return;
    setSaving(true);
    const { error } = await supabase
      .from("tariffs")
      .update({
        base_fare: tariff.base_fare,
        per_km: tariff.per_km,
        per_minute: tariff.per_minute,
        minimum_fare: tariff.minimum_fare,
        cancellation_fee: tariff.cancellation_fee,
      })
      .eq("id", tariff.id);
    setSaving(false);
    if (error) toast.error("Erro ao salvar tarifas");
    else toast.success("Tarifas atualizadas!");
  };

  const updateField = (field: keyof Tariff, value: string) => {
    if (!tariff) return;
    setTariff({ ...tariff, [field]: parseFloat(value) || 0 });
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  if (!tariff) return <p className="text-center text-muted-foreground py-8">Nenhuma tarifa configurada.</p>;

  const fields: { key: keyof Tariff; label: string; prefix: string }[] = [
    { key: "base_fare", label: "Tarifa Base", prefix: "R$" },
    { key: "per_km", label: "Por Quilômetro", prefix: "R$" },
    { key: "per_minute", label: "Por Minuto", prefix: "R$" },
    { key: "minimum_fare", label: "Tarifa Mínima", prefix: "R$" },
    { key: "cancellation_fee", label: "Taxa de Cancelamento", prefix: "R$" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Configurar Tarifas</h2>
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-4">
          {fields.map(({ key, label, prefix }) => (
            <div key={key} className="space-y-1">
              <Label className="text-sm text-muted-foreground">{label}</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{prefix}</span>
                <Input
                  type="number"
                  step="0.01"
                  value={tariff[key] as number}
                  onChange={(e) => updateField(key, e.target.value)}
                  className="bg-input border-border"
                />
              </div>
            </div>
          ))}
          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : "Salvar Tarifas"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
