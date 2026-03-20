import { useState, useEffect, useRef } from "react";
import { ArrowLeft, MapPin, Navigation, Loader2, Search, AlertTriangle } from "lucide-react";
import { MONTES_CLAROS, isWithinMontesclaros } from "@/lib/geo";
import { motion } from "framer-motion";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
  };
}

interface LocationResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface DestinationSearchProps {
  onBack: () => void;
  onSelect: (destination: string, coords: { lat: number; lng: number }) => void;
  userLocation?: { lat: number; lng: number } | null;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

const recentLocations: LocationResult[] = [
  { name: "Montes Claros Shopping", address: "Av. Donato Quintino, 90 - Cândida Câmara", lat: -16.7195, lng: -43.8533 },
  { name: "Rodoviária de Montes Claros", address: "Av. Castelar Prate, 322 - Centro", lat: -16.7278, lng: -43.8615 },
  { name: "Hospital Santa Casa", address: "Praça Honorato Alves, 22 - Centro", lat: -16.7322, lng: -43.8618 },
];

const DestinationSearch = ({ onBack, onSelect, userLocation }: DestinationSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const viewbox = userLocation
          ? `&viewbox=${userLocation.lng - 0.15},${userLocation.lat + 0.15},${userLocation.lng + 0.15},${userLocation.lat - 0.15}&bounded=1`
          : "";
        const res = await fetch(
          `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=8&countrycodes=br${viewbox}`,
          { headers: { "Accept-Language": "pt-BR" } }
        );
        const data: NominatimResult[] = await res.json();
        setResults(
          data.map((r) => ({
            name: r.display_name.split(",")[0],
            address: r.display_name.split(",").slice(1, 3).join(",").trim(),
            lat: parseFloat(r.lat),
            lng: parseFloat(r.lon),
          }))
        );
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [query, userLocation]);

  const displayList = query.length < 3 ? recentLocations : results;
  const listLabel = query.length < 3 ? "Recentes" : `${results.length} resultado${results.length !== 1 ? "s" : ""}`;

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
            <Search size={14} className="text-primary flex-shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Para onde?"
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            {loading && <Loader2 size={14} className="text-primary animate-spin flex-shrink-0" />}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="px-4 py-3">
          <span className="font-display text-xs uppercase tracking-wider text-muted-foreground">
            {listLabel}
          </span>
        </div>

        {displayList.length === 0 && query.length >= 3 && !loading && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhum endereço encontrado
          </div>
        )}

        {displayList.map((location, i) => (
          <button
            key={`${location.lat}-${location.lng}-${i}`}
            onClick={() => onSelect(location.name, { lat: location.lat, lng: location.lng })}
            className="flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-card"
          >
            <div className="mt-0.5 rounded-full bg-card p-2">
              <MapPin size={14} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{location.name}</p>
              <p className="text-xs text-muted-foreground truncate">{location.address}</p>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default DestinationSearch;
