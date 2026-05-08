import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Check, Clock, Loader2, Upload, X, FileText } from "lucide-react";
import {
  REQUIRED_DOCS,
  useDriverDocuments,
  submitForReview,
  type DriverDocType,
  type DriverDocument,
} from "@/hooks/useDriverDocuments";
import geleriLogo from "@/assets/geleri-logo.jpeg";

const DriverOnboarding = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [driverId, setDriverId] = useState<string | undefined>();
  const [onboardingStatus, setOnboardingStatus] = useState<string>("pending_documents");
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [loadingDriver, setLoadingDriver] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("drivers")
      .select("id, onboarding_status, rejection_reason, is_approved")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDriverId(data.id);
          setOnboardingStatus((data as any).onboarding_status ?? "pending_documents");
          setRejectionReason((data as any).rejection_reason ?? null);
          if ((data as any).onboarding_status === "approved" || data.is_approved) {
            navigate("/driver", { replace: true });
          }
        }
        setLoadingDriver(false);
      });
  }, [user, navigate]);

  const { docs, loading, uploading, upload } = useDriverDocuments(driverId);

  const docByType = (t: DriverDocType): DriverDocument | undefined =>
    docs.find((d) => d.type === t);

  const allUploaded = REQUIRED_DOCS.every((d) => !!docByType(d.type));
  const hasRejected = docs.some((d) => d.status === "rejected");
  const allApproved = REQUIRED_DOCS.every((d) => docByType(d.type)?.status === "approved");

  const handleFile = async (type: DriverDocType, file: File | null) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx. 8MB)");
      return;
    }
    try {
      await upload(type, file);
      toast.success("Documento enviado");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao enviar");
    }
  };

  const handleSubmit = async () => {
    if (!driverId) return;
    setSubmitting(true);
    const { error } = await submitForReview(driverId);
    if (error) toast.error(error.message);
    else {
      toast.success("Documentos enviados para análise");
      setOnboardingStatus("in_review");
    }
    setSubmitting(false);
  };

  if (loadingDriver || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!driverId) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-6 text-center">
        <div className="space-y-3">
          <p className="text-muted-foreground">Cadastro de mototaxista não encontrado.</p>
          <Button onClick={() => navigate("/driver/auth")}>Voltar ao cadastro</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={geleriLogo} alt="Celeri" className="h-8 w-8 rounded-lg" />
            <h1 className="font-display text-lg font-bold uppercase tracking-widest">Verificação</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Sair
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-xl space-y-4 p-4">
        {/* Status banner */}
        {onboardingStatus === "in_review" && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex items-start gap-3 p-4">
              <Clock className="mt-0.5 h-5 w-5 text-primary" />
              <div className="space-y-1">
                <p className="font-medium">Documentos em análise</p>
                <p className="text-sm text-muted-foreground">
                  Nossa equipe está revisando seus documentos. Você receberá uma notificação quando estiver liberado para receber corridas.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {onboardingStatus === "rejected" && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="flex items-start gap-3 p-4">
              <X className="mt-0.5 h-5 w-5 text-destructive" />
              <div className="space-y-1">
                <p className="font-medium">Cadastro reprovado</p>
                {rejectionReason && (
                  <p className="text-sm text-muted-foreground">{rejectionReason}</p>
                )}
                <p className="text-sm text-muted-foreground">Reenvie os documentos abaixo para nova análise.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="font-display text-2xl font-semibold">Envie seus documentos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Para sua segurança e a dos passageiros, precisamos verificar sua identidade e os dados da moto.
          </p>
        </motion.div>

        <div className="space-y-3">
          {REQUIRED_DOCS.map((d) => {
            const doc = docByType(d.type);
            const isUploading = uploading === d.type;
            return (
              <Card key={d.type} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{d.label}</p>
                          <p className="text-xs text-muted-foreground">{d.description}</p>
                        </div>
                        {doc && (
                          <Badge
                            variant={
                              doc.status === "approved"
                                ? "default"
                                : doc.status === "rejected"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-[10px] uppercase"
                          >
                            {doc.status === "approved"
                              ? "Aprovado"
                              : doc.status === "rejected"
                              ? "Rejeitado"
                              : "Em análise"}
                          </Badge>
                        )}
                      </div>

                      {doc?.status === "rejected" && doc.rejection_reason && (
                        <p className="text-xs text-destructive">{doc.rejection_reason}</p>
                      )}

                      <label className="block">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          disabled={isUploading || onboardingStatus === "in_review"}
                          onChange={(e) => handleFile(d.type, e.target.files?.[0] ?? null)}
                        />
                        <Button
                          asChild={false}
                          type="button"
                          variant={doc?.status === "approved" ? "outline" : "secondary"}
                          size="sm"
                          className="gap-2"
                          disabled={isUploading || onboardingStatus === "in_review"}
                          onClick={(e) => {
                            const input = (e.currentTarget.previousSibling as HTMLInputElement);
                            input?.click();
                          }}
                        >
                          {isUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : doc ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          {doc ? "Reenviar" : "Enviar foto"}
                        </Button>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!allApproved && (
          <Button
            className="w-full h-12"
            disabled={!allUploaded || onboardingStatus === "in_review" || submitting}
            onClick={handleSubmit}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : onboardingStatus === "in_review" ? (
              "Aguardando análise"
            ) : hasRejected ? (
              "Reenviar para análise"
            ) : (
              "Enviar para análise"
            )}
          </Button>
        )}

        {!allUploaded && (
          <p className="text-center text-xs text-muted-foreground">
            Envie todos os documentos para liberar o envio.
          </p>
        )}
      </div>
    </div>
  );
};

export default DriverOnboarding;