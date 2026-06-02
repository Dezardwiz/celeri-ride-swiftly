import { useState } from "react";
import { Phone, MessageCircle, Star, Navigation, X, Share2, User } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { DriverInfo } from "@/hooks/useDriverInfo";
import RideChatSheet from "@/components/RideChatSheet";
import { useRideChat } from "@/hooks/useRideChat";

type RideStatus = "accepted" | "arriving" | "arrived" | "in_progress";

interface RideStatusCardProps {
  status: RideStatus;
  onAdvance: () => void;
  onComplete: () => void;
  onCancel?: () => void;
  driver?: DriverInfo | null;
  etaMin?: number | null;
  rideId?: string;
}

const RideStatusCard = ({ status, onAdvance, onComplete, onCancel, driver, etaMin, rideId }: RideStatusCardProps) => {
  const [chatOpen, setChatOpen] = useState(false);
  const { unreadCount } = useRideChat(rideId ?? null, "passenger");
  const labels: Record<RideStatus, { label: string; color: string }> = {
    accepted: { label: "Corrida Aceita", color: "text-primary" },
    arriving: { label: "Aproximando-se", color: "text-primary" },
    arrived: { label: "Chegou!", color: "text-success" },
    in_progress: { label: "Em Andamento", color: "text-primary" },
  };
  const sublabel =
    status === "arrived"
      ? "Seu mototaxista está esperando"
      : status === "in_progress"
      ? "Aproveite a corrida"
      : etaMin != null
      ? `Chegando em ${etaMin} min`
      : "Mototaxista a caminho";
  const config = labels[status];
  const isInProgress = status === "in_progress";
  const initials = (driver?.name ?? "MT")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  const handleShare = async () => {
    if (!rideId) return;
    const url = `${window.location.origin}/share/${rideId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Acompanhe minha corrida", text: "Acompanhe minha corrida em tempo real:", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado!");
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute bottom-20 left-0 right-0 z-40 px-4"
    >
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {/* Status bar */}
        <div className="bg-input px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isInProgress ? "bg-primary animate-pulse" : "bg-success"}`} />
            <span className={`font-display text-xs uppercase tracking-wider ${config.color}`}>
              {config.label}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">{sublabel}</span>
        </div>

        {/* Driver info */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {driver?.photo_url ? (
                <img src={driver.photo_url} alt={driver.name} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-display text-sm text-primary-foreground">
                  {initials || <User size={16} />}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-foreground">{driver?.name ?? "Procurando mototaxista..."}</p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star size={10} className="text-warning fill-warning" />
                    <span className="text-xs text-muted-foreground">{(driver?.rating ?? 0).toFixed(1)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{driver?.plate ?? "—"}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {rideId && (
                <button
                  onClick={handleShare}
                  title="Compartilhar corrida"
                  className="rounded-full border border-border p-2 text-muted-foreground hover:bg-surface-hover transition-colors"
                >
                  <Share2 size={16} />
                </button>
              )}
              {rideId && driver && (
                <button
                  onClick={() => setChatOpen(true)}
                  title="Conversar com mototaxista"
                  className="relative rounded-full border border-border p-2 text-muted-foreground hover:bg-surface-hover transition-colors"
                >
                  <MessageCircle size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-display text-primary-foreground">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              )}
              <button className="rounded-full border border-border p-2 text-muted-foreground hover:bg-surface-hover transition-colors">
                <Phone size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md bg-input px-3 py-2">
            <Navigation size={12} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{driver?.moto_model ?? "—"}</span>
            <span className="ml-auto text-xs font-medium text-foreground">{driver?.plate ?? "—"}</span>
          </div>

          {/* Action button */}
          {isInProgress ? (
            <button
              onClick={onComplete}
              className="w-full rounded-md bg-primary py-3 font-display text-sm uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Finalizar Corrida
            </button>
          ) : (
            <div className="flex gap-2">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="flex items-center justify-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-3 font-display text-xs uppercase tracking-wider text-destructive transition-colors hover:bg-destructive/20"
                >
                  <X size={14} /> Cancelar
                </button>
              )}
              <button
                onClick={onAdvance}
                className="flex-1 rounded-md border border-border py-3 font-display text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:bg-surface-hover"
              >
                Simular Próximo Estado →
              </button>
            </div>
          )}
        </div>
      </div>
      {rideId && (
        <RideChatSheet
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          rideId={rideId}
          role="passenger"
          counterpartyName={driver?.name ?? "Mototaxista"}
        />
      )}
    </motion.div>
  );
};

export default RideStatusCard;
