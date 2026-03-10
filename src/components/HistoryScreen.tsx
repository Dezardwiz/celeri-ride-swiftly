import { ArrowLeft, User, Star, Clock, MapPin, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface HistoryScreenProps {
  onBack: () => void;
}

const mockRides = [
  { id: 1, dest: "Shopping Manaus ViaNorte", date: "Hoje, 14:30", price: "R$ 12,50", rating: 5 },
  { id: 2, dest: "Aeroporto Eduardo Gomes", date: "Ontem, 08:15", price: "R$ 28,00", rating: 4 },
  { id: 3, dest: "Praia da Ponta Negra", date: "08 Mar, 19:45", price: "R$ 18,00", rating: 5 },
  { id: 4, dest: "Teatro Amazonas", date: "07 Mar, 10:00", price: "R$ 15,50", rating: 4 },
  { id: 5, dest: "Hospital 28 de Agosto", date: "06 Mar, 22:10", price: "R$ 9,00", rating: 5 },
];

const HistoryScreen = ({ onBack }: HistoryScreenProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-40 flex flex-col bg-background"
    >
      <div className="border-b border-border p-4 flex items-center gap-3">
        <button onClick={onBack} className="text-foreground p-1">
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-display text-lg uppercase tracking-wider">Histórico</h2>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
        {mockRides.map((ride) => (
          <button
            key={ride.id}
            className="flex w-full items-center gap-3 border-b border-border px-4 py-4 text-left hover:bg-card transition-colors"
          >
            <div className="rounded-full bg-card p-2">
              <MapPin size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{ride.dest}</p>
              <p className="text-xs text-muted-foreground">{ride.date}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-medium text-foreground">{ride.price}</p>
              <div className="flex items-center gap-0.5 justify-end">
                {Array.from({ length: ride.rating }).map((_, i) => (
                  <Star key={i} size={8} className="text-warning fill-warning" />
                ))}
              </div>
            </div>
            <ChevronRight size={14} className="text-muted-foreground" />
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default HistoryScreen;
