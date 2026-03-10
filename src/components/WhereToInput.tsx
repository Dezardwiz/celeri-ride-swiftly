import { Search, MapPin, Circle } from "lucide-react";
import { motion } from "framer-motion";

interface WhereToInputProps {
  onFocus: () => void;
  destination?: string;
}

const WhereToInput = ({ onFocus, destination }: WhereToInputProps) => {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute bottom-24 left-4 right-4 z-30"
    >
      <div className="rounded-lg bg-card border border-border p-4 space-y-3">
        {/* Origin */}
        <div className="flex items-center gap-3">
          <Circle size={10} className="text-primary fill-primary flex-shrink-0" />
          <div className="flex-1 text-sm text-muted-foreground">Sua localização</div>
        </div>

        <div className="ml-[4px] h-4 w-[2px] bg-border" />

        {/* Destination */}
        <button
          onClick={onFocus}
          className="flex w-full items-center gap-3 rounded-md bg-input p-3 text-left transition-colors hover:bg-surface-hover"
        >
          <Search size={16} className="text-muted-foreground flex-shrink-0" />
          <span className={`text-sm ${destination ? "text-foreground" : "text-muted-foreground"}`}>
            {destination || "Para onde?"}
          </span>
        </button>
      </div>
    </motion.div>
  );
};

export default WhereToInput;
