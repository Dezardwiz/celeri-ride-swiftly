import { useState, useEffect, useRef } from "react";
import { ArrowLeft, MapPin, Navigation, Loader2, Search, AlertTriangle, Home, Briefcase, Star, Plus, X, Clock } from "lucide-react";
import { MONTES_CLAROS, isWithinMontesclaros } from "@/lib/geo";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { SavedPlace, SearchHistoryItem } from "@/hooks/useSavedPlaces";

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
  savedPlaces?: SavedPlace[];
  history?: SearchHistoryItem[];
  onSaveCurrent?: (place: Omit<SavedPlace, "id" | "user_id">) => Promise<any>;
  onDeletePlace?: (id: string) => Promise<void> | void;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

const PlaceIcon = ({ category, className }: { category?: string; className?: string }) => {
  if (category === "home") return <Home size={14} className={className} />;
  if (category === "work") return <Briefcase size={14} className={className} />;
  return <Star size={14} className={className} />;
};

const DestinationSearch = ({
  onBack,
  onSelect,
  userLocation,
  savedPlaces = [],
  history = [],
  onSaveCurrent,
  onDeletePlace,
}: DestinationSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newCategory, setNewCategory] = useState<"home" | "work" | "other">("other");
  const [selectedForSave, setSelectedForSave] = useState<LocationResult | null>(null);
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
        const { bounds } = MONTES_CLAROS;
        const viewbox = `&viewbox=${bounds.west},${bounds.north},${bounds.east},${bounds.south}&bounded=1`;
        const res = await fetch(
          `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=8&countrycodes=br${viewbox}`,
          { headers: { "Accept-Language": "pt-BR" } }
        );
        const data: NominatimResult[] = await res.json();
        setResults(
          data
            .filter((r) => isWithinMontesclaros(parseFloat(r.lat), parseFloat(r.lon)))
            .map((r) => ({
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

  const historyAsList: LocationResult[] = history
    .filter((h) => h.lat != null && h.lng != null)
    .map((h) => ({ name: h.address.split(",")[0], address: h.address.split(",").slice(1, 3).join(",").trim(), lat: h.lat as number, lng: h.lng as number }));

  const showSuggestions = query.length < 3;

  const handleSaveSubmit = async () => {
    if (!selectedForSave || !onSaveCurrent || !newLabel.trim()) return;
    const err = await onSaveCurrent({
      label: newLabel.trim(),
      category: newCategory,
      address: selectedForSave.address || selectedForSave.name,
      lat: selectedForSave.lat,
      lng: selectedForSave.lng,
    });
    if (err) toast.error("Erro ao salvar local");
    else toast.success("Local salvo");
    setAdding(false);
    setSelectedForSave(null);
    setNewLabel("");
    setNewCategory("other");
  };

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
        {showSuggestions && (
          <>
            {/* Saved places */}
            {savedPlaces.length > 0 && (
              <div>
                <div className="px-4 pt-3 pb-2">
                  <span className="font-display text-xs uppercase tracking-wider text-muted-foreground">Favoritos</span>
                </div>
                {savedPlaces.map((p) => (
                  <div key={p.id} className="flex items-center border-b border-border">
                    <button
                      onClick={() => onSelect(p.address, { lat: p.lat, lng: p.lng })}
                      className="flex flex-1 items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-card"
                    >
                      <div className="mt-0.5 rounded-full bg-primary/10 p-2">
                        <PlaceIcon category={p.category} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{p.address}</p>
                      </div>
                    </button>
                    {onDeletePlace && (
                      <button onClick={() => onDeletePlace(p.id)} className="px-3 text-muted-foreground hover:text-destructive">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* History */}
            {historyAsList.length > 0 && (
              <div>
                <div className="px-4 pt-3 pb-2">
                  <span className="font-display text-xs uppercase tracking-wider text-muted-foreground">Recentes</span>
                </div>
                {historyAsList.map((h, i) => (
                  <button
                    key={`${h.lat}-${h.lng}-${i}`}
                    onClick={() => onSelect(h.name, { lat: h.lat, lng: h.lng })}
                    className="flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-card"
                  >
                    <div className="mt-0.5 rounded-full bg-card p-2">
                      <Clock size={14} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{h.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{h.address}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {savedPlaces.length === 0 && historyAsList.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Pesquise um endereço em Montes Claros para começar.
              </div>
            )}
          </>
        )}

        {!showSuggestions && (
          <div className="px-4 py-3">
            <span className="font-display text-xs uppercase tracking-wider text-muted-foreground">
              {`${results.length} resultado${results.length !== 1 ? "s" : ""}`}
            </span>
          </div>
        )}

        {!showSuggestions && results.length === 0 && !loading && (
          <div className="px-4 py-8 text-center space-y-2">
            <AlertTriangle size={24} className="mx-auto text-yellow-500" />
            <p className="text-sm text-muted-foreground">
              Nenhum endereço encontrado em <strong className="text-foreground">Montes Claros – MG</strong>.
            </p>
            <p className="text-xs text-muted-foreground">
              O serviço atende apenas a cidade de Montes Claros.
            </p>
          </div>
        )}

        {!showSuggestions && results.map((location, i) => (
          <div key={`${location.lat}-${location.lng}-${i}`} className="flex items-center border-b border-border">
            <button
              onClick={() => onSelect(location.name, { lat: location.lat, lng: location.lng })}
              className="flex flex-1 items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-card"
            >
              <div className="mt-0.5 rounded-full bg-card p-2">
                <MapPin size={14} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{location.name}</p>
                <p className="text-xs text-muted-foreground truncate">{location.address}</p>
              </div>
            </button>
            {onSaveCurrent && (
              <button
                title="Salvar como favorito"
                onClick={() => { setSelectedForSave(location); setAdding(true); setNewLabel(location.name); }}
                className="px-3 text-muted-foreground hover:text-primary"
              >
                <Plus size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      {adding && selectedForSave && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center" onClick={() => setAdding(false)}>
          <div className="w-full max-w-md rounded-t-2xl border border-border bg-card p-4 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-base font-semibold mb-1">Salvar local</h3>
            <p className="text-xs text-muted-foreground mb-3">{selectedForSave.address || selectedForSave.name}</p>
            <input
              autoFocus
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Ex: Casa, Trabalho, Academia"
              className="w-full rounded-md bg-input p-3 text-sm text-foreground outline-none mb-3"
            />
            <div className="flex gap-2 mb-3">
              {(["home", "work", "other"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setNewCategory(c)}
                  className={`flex-1 rounded-md border px-3 py-2 text-xs uppercase tracking-wider transition-colors ${
                    newCategory === c ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {c === "home" ? "Casa" : c === "work" ? "Trabalho" : "Outro"}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setAdding(false)}
                className="flex-1 rounded-md border border-border py-3 text-sm text-muted-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSubmit}
                disabled={!newLabel.trim()}
                className="flex-1 rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default DestinationSearch;
