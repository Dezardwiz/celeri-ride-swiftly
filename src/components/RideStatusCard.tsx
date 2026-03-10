import { Phone, MessageCircle, Star, Navigation } from "lucide-react";
import { motion } from "framer-motion";

type RideStatus = "accepted" | "arriving" | "arrived" | "in_progress";

interface RideStatusCardProps {
  status: RideStatus;
  onAdvance: () => void;
  onComplete: () => void;
}

const statusConfig: Record<RideStatus, { label: string; sublabel: string; color: string }> = {
  accepted: { label: "Corrida Aceita", sublabel: "Mototaxista a caminho", color: "text-primary" },
  arriving: { label: "Aproximando-se", sublabel: "Chegando em 2 min", color: "text-primary" },
  arrived: { label: "Chegou!", sublabel: "Seu mototaxista está esperando", color: "text-success" },
  in_progress: { label: "Em Andamento", sublabel: "Aproveite a corrida", color: "text-primary" },
};

const driver = {
  name: "Carlos Silva",
  rating: 4.9,
  plate: "MAO-2B45",
  model: "Honda CG 160",
  avatar: "CS",
};

const RideStatusCard = ({ status, onAdvance, onComplete }: RideStatusCardProps) => {
  const config = statusConfig[status];
  const isInProgress = status === "in_progress";

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
          <span className="text-xs text-muted-foreground">{config.sublabel}</span>
        </div>

        {/* Driver info */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-display text-sm text-primary-foreground">
                {driver.avatar}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{driver.name}</p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star size={10} className="text-warning fill-warning" />
                    <span className="text-xs text-muted-foreground">{driver.rating}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{driver.plate}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="rounded-full border border-border p-2 text-muted-foreground hover:bg-surface-hover transition-colors">
                <MessageCircle size={16} />
              </button>
              <button className="rounded-full border border-border p-2 text-muted-foreground hover:bg-surface-hover transition-colors">
                <Phone size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md bg-input px-3 py-2">
            <Navigation size={12} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{driver.model}</span>
            <span className="ml-auto text-xs font-medium text-foreground">{driver.plate}</span>
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
            <button
              onClick={onAdvance}
              className="w-full rounded-md border border-border py-3 font-display text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:bg-surface-hover"
            >
              Simular Próximo Estado →
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default RideStatusCard;
