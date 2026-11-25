import { useEffect, useRef, useState } from "react";
import SosButton from "@/components/SosButton";
import { playSound, vibrate } from "@/lib/notifications";
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
  pinCode?: string | null;
}

const RideStatusCard = ({ status, onAdvance, onComplete, onCancel, driver, etaMin, rideId, pinCode }: RideStatusCardProps) => {
  const [chatOpen, setChatOpen] = useState(false);
  const { unreadCount } = useRideChat(rideId ?? null, "passenger");
  const prevStatus = useRef<RideStatus | null>(null);
  useEffect(() => {
    if (prevStatus.current !== status) {
      if (status === "accepted") playSound("accepted");
      if (status === "arrived") { playSound("arrived"); vibrate([300, 100, 300]); }
      if (status === "in_progress" && prevStatus.current) playSound("accepted");
      prevStatus.current = status;
    }
  }, [status]);
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
      <div className="mb-2 flex justify-end">
        <SosButton rideId={rideId} role="passenger" />
      </div>
      <div className="sheet-premium overflow-hidden">
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-muted-foreground/30" />
        {/* Status */}
        <div className="flex items-center justify-between px-5 pt-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${isInProgress ? "bg-primary" : "bg-success"}`} />
                <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isInProgress ? "bg-primary" : "bg-success"}`} />
              </span>
              <span className={`font-display text-xs uppercase tracking-[0.18em] ${config.color}`}>{config.label}</span>
            </div>
            <p className="mt-1 text-lg font-semibold text-foreground">{sublabel}</p>
          </div>
          {etaMin != null && !isInProgress && status !== "arrived" && (
            <div className="rounded-2xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-center">
              <p className="font-display text-2xl leading-none text-primary">{etaMin}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">min</p>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 px-5 pt-3">
          {(["accepted", "arrived", "in_progress", "done"] as const).map((s, i) => {
            const idx = { accepted: 0, arriving: 0, arrived: 1, in_progress: 2 }[status];
            return (
              <div key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow"
                  initial={{ width: 0 }}
                  animate={{ width: i <= idx ? "100%" : "0%" }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                />
              </div>
            );
          })}
        </div>

        <div className="space-y-4 p-5">
          {/* Driver */}
          <div className="flex items-center gap-4">
            <div className="avatar-ring shrink-0">
              {driver?.photo_url ? (
                <img src={driver.photo_url} alt={driver.name} className="h-14 w-14 rounded-full border-2 border-card object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-card bg-secondary font-display text-lg text-primary">
                  {initials || <User size={20} />}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-foreground">{driver?.name ?? "Procurando mototaxista..."}</p>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Star size={12} className="fill-warning text-warning" />
                <span className="font-medium text-foreground">{(driver?.rating ?? 0).toFixed(1)}</span>
                <span>·</span>
                <Navigation size={11} />
                <span className="truncate">{driver?.moto_model ?? "—"}</span>
              </div>
            </div>
            <span className="plate-badge shrink-0">{driver?.plate ?? "—"}</span>
          </div>

          {pinCode && status !== "in_progress" && (
            <div className="flex items-center justify-between rounded-2xl border border-primary/40 bg-gradient-to-r from-primary/15 to-transparent px-4 py-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">PIN de segurança</p>
                <p className="text-xs text-muted-foreground">Informe ao mototaxista</p>
              </div>
              <span className="font-display text-2xl tracking-[0.35em] text-primary">{pinCode}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-around">
            {rideId && driver && (
              <button onClick={() => setChatOpen(true)} className="flex flex-col items-center gap-1" aria-label="Conversar com mototaxista">
                <span className="icon-btn relative">
                  <MessageCircle size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 font-display text-[10px] text-primary-foreground">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-muted-foreground">Chat</span>
              </button>
            )}
            <button className="flex flex-col items-center gap-1" aria-label="Ligar">
              <span className="icon-btn"><Phone size={18} /></span>
              <span className="text-[11px] text-muted-foreground">Ligar</span>
            </button>
            {rideId && (
              <button onClick={handleShare} className="flex flex-col items-center gap-1" aria-label="Compartilhar corrida">
                <span className="icon-btn"><Share2 size={18} /></span>
                <span className="text-[11px] text-muted-foreground">Compartilhar</span>
              </button>
            )}
          </div>

          {isInProgress ? (
            <button
              onClick={onComplete}
              className="press btn-glow w-full rounded-2xl bg-gradient-to-r from-primary to-primary-glow py-4 font-display text-sm uppercase tracking-wider text-primary-foreground"
            >
              Finalizar Corrida
            </button>
          ) : (
            <div className="flex gap-2">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="press flex items-center justify-center gap-1 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3.5 font-display text-xs uppercase tracking-wider text-destructive hover:bg-destructive/20"
                >
                  <X size={14} /> Cancelar
                </button>
              )}
              <button
                onClick={onAdvance}
                className="press flex-1 rounded-2xl border border-border py-3.5 font-display text-xs uppercase tracking-wider text-muted-foreground hover:bg-surface-hover"
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
