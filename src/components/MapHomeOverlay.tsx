import { Gift, Crosshair } from "lucide-react";
import { motion } from "framer-motion";

interface MapHomeOverlayProps {
  onPromos?: () => void;
  onRecenter?: () => void;
  topOffset?: number;
}

const MapHomeOverlay = ({ onPromos, onRecenter, topOffset = 96 }: MapHomeOverlayProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="pointer-events-none absolute left-0 right-0 z-20 flex items-start justify-between px-4"
      style={{ top: topOffset }}
    >
      <button
        onClick={onPromos}
        className="pointer-events-auto flex items-center gap-2 rounded-full bg-card/90 px-3.5 py-2 text-sm font-medium text-foreground shadow-elegant backdrop-blur-sm transition-colors hover:bg-surface-hover"
      >
        <Gift size={16} className="text-primary" />
        Promoções
      </button>

      <button
        onClick={onRecenter}
        aria-label="Centralizar"
        className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-card/90 text-foreground shadow-elegant backdrop-blur-sm transition-colors hover:bg-surface-hover"
      >
        <Crosshair size={18} className="text-foreground" />
      </button>
    </motion.div>
  );
};

export default MapHomeOverlay;