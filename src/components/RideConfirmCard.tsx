import { Clock, MapPin, Bike } from "lucide-react";
import { motion } from "framer-motion";

interface RideConfirmCardProps {
  destination: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const RideConfirmCard = ({ destination, onConfirm, onCancel }: RideConfirmCardProps) => {
  const estimatedPrice = "R$ 12,50";
  const estimatedTime = "8 min";
  const estimatedDistance = "3.2 km";

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute bottom-20 left-0 right-0 z-40 px-4"
    >
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        {/* Destination info */}
        <div className="flex items-center gap-3">
          <MapPin size={16} className="text-primary flex-shrink-0" />
          <span className="text-sm font-medium text-foreground truncate">{destination}</span>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between border-t border-b border-border py-3">
          <div className="flex items-center gap-2">
            <Bike size={16} className="text-muted-foreground" />
            <span className="font-display text-xs uppercase tracking-wider text-muted-foreground">Mototáxi</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Clock size={12} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{estimatedTime}</span>
            </div>
            <span className="text-xs text-muted-foreground">{estimatedDistance}</span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Valor estimado</span>
          <span className="font-display text-xl tracking-tight text-foreground">{estimatedPrice}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-md border border-border py-3 font-display text-sm uppercase tracking-wider text-muted-foreground transition-colors hover:bg-surface-hover"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-md bg-primary py-3 font-display text-sm uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Confirmar Corrida
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default RideConfirmCard;
