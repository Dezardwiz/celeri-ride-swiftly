import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, X, Loader2, Eye, User } from "lucide-react";
import { toast } from "sonner";
import { REQUIRED_DOCS, type DriverDocType } from "@/hooks/useDriverDocuments";

interface DriverWithDocs {
  id: string;
  user_id: string;
  document: string;
  moto_model: string;
  plate: string;
  onboarding_status: string;
  rejection_reason: string | null;
  is_approved: boolean;
  created_at: string;
  full_name?: string | null;
}

interface DocRow {
  id: string;
  driver_id: string;
  type: DriverDocType;
  file_path: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
}

export const AdminDriverVerification = () => {
  const [drivers, setDrivers] = useState<DriverWithDocs[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [docsByDriver, setDocsByDriver] = useState<Record<string, DocRow[]>>({});
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const fetchDrivers = async () => {
    setLoading(true);
    const { data: driverRows } = await supabase
      .from("drivers")
      .select("*")
      .in("onboarding_status", ["in_review", "rejected", "pending_documents"])
      .order("created_at", { ascending: false });
    if (driverRows && driverRows.length) {
      const ids = driverRows.map((d: any) => d.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", ids);
      const map = new Map((profiles ?? []).map((p: any) => [p.user_id, p.full_name]));
      setDrivers(driverRows.map((d: any) => ({ ...d, full_name: map.get(d.user_id) ?? null })));
    } else {
      setDrivers([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchDrivers(); }, []);

  const expandDriver = async (driverId: string) => {
    if (expanded === driverId) { setExpanded(null); return; }
    setExpanded(driverId);
    if (!docsByDriver[driverId]) {
      const { data } = await supabase
        .from("driver_documents")
        .select("*")
        .eq("driver_id", driverId);
      setDocsByDriver((s) => ({ ...s, [driverId]: (data ?? []) as any }));
    }
  };

  const viewDoc = async (path: string) => {
    if (signedUrls[path]) {
      window.open(signedUrls[path], "_blank");
      return;
    }
    const { data } = await supabase.storage
      .from("driver-documents")
      .createSignedUrl(path, 60 * 10);
    if (data?.signedUrl) {
      setSignedUrls((s) => ({ ...s, [path]: data.signedUrl }));
      window.open(data.signedUrl, "_blank");
    }
  };

  const reviewDoc = async (doc: DocRow, status: "approved" | "rejected", reason?: string) => {
    const { error } = await supabase
      .from("driver_documents")
      .update({
        status,
        rejection_reason: status === "rejected" ? (reason || "Documento ilegível") : null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", doc.id);
    if (error) { toast.error(error.message); return; }
    setDocsByDriver((s) => ({
      ...s,
      [doc.driver_id]: s[doc.driver_id].map((d) =>
        d.id === doc.id ? { ...d, status, rejection_reason: status === "rejected" ? (reason || "Documento ilegível") : null } : d
      ),
    }));
    toast.success(status === "approved" ? "Documento aprovado" : "Documento rejeitado");
  };

  const finalizeDriver = async (driver: DriverWithDocs, action: "approve" | "reject") => {
    if (action === "approve") {
      const { error } = await supabase
        .from("drivers")
        .update({ onboarding_status: "approved", is_approved: true, rejection_reason: null })
        .eq("id", driver.id);
      if (error) toast.error(error.message);
      else { toast.success("Mototaxista aprovado"); fetchDrivers(); }
    } else {
      const reason = reasons[driver.id]?.trim() || "Documentos insuficientes";
      const { error } = await supabase
        .from("drivers")
        .update({ onboarding_status: "rejected", is_approved: false, rejection_reason: reason })
        .eq("id", driver.id);
      if (error) toast.error(error.message);
      else { toast.success("Cadastro rejeitado"); fetchDrivers(); }
    }
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Verificação de mototaxistas ({drivers.length})</h2>
      {drivers.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Nenhum mototaxista pendente de verificação.</p>
      ) : (
        <div className="space-y-3">
          {drivers.map((d) => {
            const isOpen = expanded === d.id;
            const docs = docsByDriver[d.id] ?? [];
            const allApproved = docs.length === REQUIRED_DOCS.length && docs.every((x) => x.status === "approved");
            return (
              <Card key={d.id} className="bg-card">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{d.full_name || "Sem nome"}</p>
                        <p className="text-xs text-muted-foreground">{d.moto_model} • {d.plate} • Doc: {d.document}</p>
                        <Badge
                          variant={
                            d.onboarding_status === "in_review" ? "secondary"
                              : d.onboarding_status === "rejected" ? "destructive" : "outline"
                          }
                          className="mt-1 text-[10px] uppercase"
                        >
                          {d.onboarding_status === "in_review" ? "Em análise"
                            : d.onboarding_status === "rejected" ? "Rejeitado" : "Aguardando documentos"}
                        </Badge>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => expandDriver(d.id)}>
                      {isOpen ? "Fechar" : "Revisar"}
                    </Button>
                  </div>

                  {isOpen && (
                    <div className="space-y-2 border-t border-border pt-3">
                      {REQUIRED_DOCS.map((req) => {
                        const doc = docs.find((x) => x.type === req.type);
                        return (
                          <div key={req.type} className="flex items-center justify-between gap-2 rounded-md border border-border p-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{req.label}</p>
                              {doc ? (
                                <Badge
                                  variant={doc.status === "approved" ? "default" : doc.status === "rejected" ? "destructive" : "secondary"}
                                  className="text-[10px] uppercase mt-1"
                                >
                                  {doc.status}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">Não enviado</span>
                              )}
                            </div>
                            {doc && (
                              <div className="flex gap-1 shrink-0">
                                <Button size="icon" variant="ghost" onClick={() => viewDoc(doc.file_path)} title="Ver">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => reviewDoc(doc, "approved")} title="Aprovar">
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Rejeitar"
                                  onClick={() => {
                                    const reason = window.prompt("Motivo da rejeição:", "Documento ilegível");
                                    if (reason !== null) reviewDoc(doc, "rejected", reason);
                                  }}
                                >
                                  <X className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                        <Input
                          placeholder="Motivo da rejeição (opcional)"
                          value={reasons[d.id] ?? ""}
                          onChange={(e) => setReasons((s) => ({ ...s, [d.id]: e.target.value }))}
                          className="h-9 text-sm"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" variant="destructive" onClick={() => finalizeDriver(d, "reject")} className="flex-1">
                            Rejeitar cadastro
                          </Button>
                          <Button
                            size="sm"
                            disabled={!allApproved}
                            onClick={() => finalizeDriver(d, "approve")}
                            className="flex-1"
                          >
                            {allApproved ? "Aprovar mototaxista" : "Aprove os docs primeiro"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminDriverVerification;