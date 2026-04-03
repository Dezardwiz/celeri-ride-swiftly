import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface RideCount {
  passenger_id: string;
  count: number;
}

export const AdminPassengers = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [rideCounts, setRideCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const [profilesRes, ridesRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("rides").select("passenger_id, status"),
      ]);

      setProfiles(profilesRes.data || []);

      const counts = new Map<string, number>();
      (ridesRes.data || []).forEach((r: any) => {
        counts.set(r.passenger_id, (counts.get(r.passenger_id) || 0) + 1);
      });
      setRideCounts(counts);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase();
    return !q || (p.full_name?.toLowerCase().includes(q)) || (p.phone?.includes(q));
  });

  if (loading) return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Passageiros ({profiles.length})</h2>
      </div>

      <Input
        placeholder="Buscar por nome ou telefone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-input border-border"
      />

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Nenhum passageiro encontrado.</p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((p) => (
            <Card key={p.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{p.full_name || "Sem nome"}</p>
                    {p.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {p.phone}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(p.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {rideCounts.get(p.user_id) || 0} corridas
                      </Badge>
                    </div>
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
