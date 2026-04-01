import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, User } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Driver = Tables<"drivers">;

export const AdminDrivers = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDrivers = async () => {
    const { data } = await supabase
      .from("drivers")
      .select("*")
      .order("created_at", { ascending: false });
    setDrivers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchDrivers(); }, []);

  const toggleApproval = async (id: string, approve: boolean) => {
    const { error } = await supabase
      .from("drivers")
      .update({ is_approved: approve })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      toast.success(approve ? "Mototaxista aprovado!" : "Mototaxista reprovado");
      fetchDrivers();
    }
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Mototaxistas ({drivers.length})</h2>
      </div>

      {drivers.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Nenhum mototaxista cadastrado.</p>
      ) : (
        <div className="grid gap-3">
          {drivers.map((d) => (
            <Card key={d.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      {d.photo_url ? (
                        <img src={d.photo_url} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{d.moto_model} • {d.plate}</p>
                      <p className="text-xs text-muted-foreground">Doc: {d.document}</p>
                      <div className="flex gap-2">
                        <Badge variant={d.is_approved ? "default" : "destructive"} className="text-xs">
                          {d.is_approved ? "Aprovado" : "Pendente"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {d.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ⭐ {d.rating_avg?.toFixed(1) || "0.0"} • {d.total_rides || 0} corridas
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!d.is_approved && (
                      <Button size="sm" variant="default" onClick={() => toggleApproval(d.id, true)}>
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {d.is_approved && (
                      <Button size="sm" variant="destructive" onClick={() => toggleApproval(d.id, false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
