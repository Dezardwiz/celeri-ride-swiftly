import { Clock, MapPin, Bike, Loader2, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface RideConfirmCardProps {
  destination: string;
  estimatedPrice: number;
  estimatedTime: number;
  estimatedDistance: number;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  surgeMultiplier?: number;
  surgeLabel?: string | null;
}

const RideConfirmCard = ({
  destination,
  estimatedPrice,
  estimatedTime,
  estimatedDistance,
  loading,
  onConfirm,
  onCancel,
  surgeMultiplier = 1,
  surgeLabel,
}: RideConfirmCardProps) => {
  const priceStr = `R$ ${estimatedPrice.toFixed(2).replace(".", ",")}`;
  const timeStr = `${estimatedTime} min`;
  const distStr = `${estimatedDistance.toFixed(1)} km`;
  const hasSurge = surgeMultiplier > 1.01;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute bottom-20 left-0 right-0 z-40 px-4"
    >
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <div className="flex items-center gap-3">
          <MapPin size={16} className="text-primary flex-shrink-0" />
          <span className="text-sm font-medium text-foreground truncate">{destination}</span>
        </div>

        <div className="flex items-center justify-between border-t border-b border-border py-3">
          <div className="flex items-center gap-2">
            <Bike size={16} className="text-muted-foreground" />
            <span className="font-display text-xs uppercase tracking-wider text-muted-foreground">Mototáxi</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Clock size={12} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{timeStr}</span>
            </div>
            <span className="text-xs text-muted-foreground">{distStr}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Valor estimado</span>
          <span className="font-display text-xl tracking-tight text-foreground">{priceStr}</span>
        </div>

        {hasSurge && (
          <div className="flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2">
            <TrendingUp size={14} className="text-primary" />
            <span className="text-xs text-foreground">
              Tarifa dinâmica <strong>{surgeMultiplier.toFixed(2)}x</strong>
              {surgeLabel ? ` · ${surgeLabel}` : ""}
            </span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-md border border-border py-3 font-display text-sm uppercase tracking-wider text-muted-foreground transition-colors hover:bg-surface-hover"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-md bg-primary py-3 font-display text-sm uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="mx-auto animate-spin" /> : "Confirmar Corrida"}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default RideConfirmCard;
