import { ArrowLeft, MapPin, Clock, Navigation } from "lucide-react";
import { motion } from "framer-motion";

interface DestinationSearchProps {
  onBack: () => void;
  onSelect: (destination: string) => void;
}

const mockLocations = [
  { name: "Shopping Manaus ViaNorte", address: "Av. Arquiteto José Henrique Bento, 1300", distance: "3.2 km" },
  { name: "Aeroporto Eduardo Gomes", address: "Av. Santos Dumont, 1350", distance: "8.7 km" },
  { name: "Praia da Ponta Negra", address: "Av. da Praia, s/n", distance: "5.1 km" },
  { name: "Hospital 28 de Agosto", address: "R. Recife, 1581", distance: "2.4 km" },
  { name: "Teatro Amazonas", address: "R. Tapajós, s/n - Centro", distance: "4.8 km" },
];

const DestinationSearch = ({ onBack, onSelect }: DestinationSearchProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-background"
    >
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="text-foreground p-1">
            <ArrowLeft size={20} />
          </button>
          <h2 className="font-display text-lg uppercase tracking-wider">Destino</h2>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3 rounded-md bg-input p-3">
            <Navigation size={14} className="text-primary flex-shrink-0" />
            <span className="text-sm text-muted-foreground">Sua localização</span>
          </div>
          <div className="flex items-center gap-3 rounded-md bg-input p-3 ring-1 ring-primary">
            <MapPin size={14} className="text-primary flex-shrink-0" />
            <input
              autoFocus
              placeholder="Para onde?"
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </div>

      {/* Recent / Suggestions */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="px-4 py-3">
          <span className="font-display text-xs uppercase tracking-wider text-muted-foreground">
            Sugestões
          </span>
        </div>
        {mockLocations.map((location, i) => (
          <button
            key={i}
            onClick={() => onSelect(location.name)}
            className="flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-card"
          >
            <div className="mt-0.5 rounded-full bg-card p-2">
              <MapPin size={14} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{location.name}</p>
              <p className="text-xs text-muted-foreground truncate">{location.address}</p>
            </div>
            <span className="text-xs text-muted-foreground mt-1">{location.distance}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default DestinationSearch;
