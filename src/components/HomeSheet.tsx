import { motion } from "framer-motion";
import {
  LocateFixed,
  Plus,
  Home as HomeIcon,
  Briefcase,
  Star,
  ShoppingBag,
  GraduationCap,
  Cross,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SavedPlace, SearchHistoryItem } from "@/hooks/useSavedPlaces";

interface Suggestion {
  id: string;
  title: string;
  subtitle: string;
  minutes?: number;
  distanceKm?: number;
  icon: LucideIcon;
  coords?: { lat: number; lng: number };
}

interface HomeSheetProps {
  userName?: string | null;
  originAddress?: string;
  places: SavedPlace[];
  history: SearchHistoryItem[];
  onOpenSearch: () => void;
  onSelectDestination: (address: string, coords?: { lat: number; lng: number }) => void;
  onUseCurrentLocation?: () => void;
  onOpenFavorites?: () => void;
  onViewMore?: () => void;
}

const DEFAULT_SUGGESTIONS: Suggestion[] = [
  {
    id: "shopping-mc",
    title: "Shopping Montes Claros",
    subtitle: "Av. Donato Quintino, 90",
    minutes: 4,
    distanceKm: 2.1,
    icon: ShoppingBag,
  },
  {
    id: "faculdade",
    title: "Faculdade",
    subtitle: "Rua Universitária, 789",
    minutes: 6,
    distanceKm: 3.5,
    icon: GraduationCap,
  },
  {
    id: "hospital",
    title: "Hospital Aroldo Tourinho",
    subtitle: "Av. Dr. Cula Mangabeira, 211",
    minutes: 7,
    distanceKm: 3.8,
    icon: Cross,
  },
];

const HomeSheet = ({
  userName,
  originAddress = "Sua localização atual",
  places,
  history,
  onOpenSearch,
  onSelectDestination,
  onUseCurrentLocation,
  onOpenFavorites,
  onViewMore,
}: HomeSheetProps) => {
  const firstName = (userName ?? "").trim().split(" ")[0];

  const home = places.find((p) => p.category === "home");
  const work = places.find((p) => p.category === "work");

  // Build suggestions: prefer recent history, fallback to defaults
  const suggestions: Suggestion[] =
    history.length > 0
      ? history.slice(0, 3).map((h, i) => ({
          id: h.id,
          title: h.address.split(",")[0] ?? h.address,
          subtitle: h.address,
          icon: [ShoppingBag, GraduationCap, Cross][i % 3],
          coords: h.lat != null && h.lng != null ? { lat: h.lat, lng: h.lng } : undefined,
        }))
      : DEFAULT_SUGGESTIONS;

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-x-0 bottom-[72px] z-30 max-h-[68vh] overflow-y-auto no-scrollbar rounded-t-3xl border border-border/60 bg-background/98 backdrop-blur-md shadow-elevated"
    >
      {/* Handle */}
      <div className="sticky top-0 z-10 flex justify-center bg-background/98 pt-2.5 pb-1">
        <span className="h-1 w-10 rounded-full bg-muted-foreground/30" />
      </div>

      <div className="px-5 pb-6 pt-2 space-y-5">
        {/* Greeting */}
        <div>
          {firstName && (
            <p className="text-base text-muted-foreground">Olá, {firstName}</p>
          )}
          <h2 className="font-display text-2xl font-bold text-foreground">Para onde vamos?</h2>
        </div>

        {/* Origin + Destination card */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 rounded-2xl bg-card/80 px-4 py-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
              <span className="h-3 w-3 rounded-full bg-primary" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">Meu local</p>
              <p className="truncate text-xs text-muted-foreground">{originAddress}</p>
            </div>
            <button
              onClick={onUseCurrentLocation}
              aria-label="Usar localização atual"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-foreground/80 transition-colors hover:bg-surface-hover"
            >
              <LocateFixed size={16} />
            </button>
          </div>

          <button
            onClick={onOpenSearch}
            className="flex w-full items-center gap-3 rounded-2xl bg-card/80 px-4 py-3 text-left transition-colors hover:bg-surface-hover"
          >
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
              <span className="h-3 w-3 rounded-sm bg-success" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">Para onde?</p>
              <p className="truncate text-xs text-muted-foreground">Digite o destino</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-foreground/80">
              <Plus size={16} />
            </span>
          </button>
        </div>

        {/* Quick chips */}
        <div className="grid grid-cols-3 gap-2">
          <QuickChip
            icon={HomeIcon}
            label="Casa"
            value={home?.address ?? "Adicionar"}
            onClick={() =>
              home
                ? onSelectDestination(home.address, { lat: home.lat, lng: home.lng })
                : onOpenSearch()
            }
          />
          <QuickChip
            icon={Briefcase}
            label="Trabalho"
            value={work?.address ?? "Adicionar"}
            onClick={() =>
              work
                ? onSelectDestination(work.address, { lat: work.lat, lng: work.lng })
                : onOpenSearch()
            }
          />
          <QuickChip
            icon={Star}
            label="Favoritos"
            value="Meus lugares"
            onClick={onOpenFavorites ?? onOpenSearch}
          />
        </div>

        {/* Suggestions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Sugestões
            </span>
            <button
              onClick={onViewMore ?? onOpenSearch}
              className="text-xs font-medium text-primary transition-opacity hover:opacity-80"
            >
              Ver mais
            </button>
          </div>

          <div className="space-y-2">
            {suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelectDestination(s.subtitle, s.coords)}
                className="flex w-full items-center gap-3 rounded-2xl bg-card/70 px-4 py-3 text-left transition-colors hover:bg-surface-hover"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <s.icon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{s.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{s.subtitle}</p>
                </div>
                {(s.minutes != null || s.distanceKm != null) && (
                  <div className="flex flex-col items-end text-xs text-muted-foreground">
                    {s.minutes != null && <span>{s.minutes} min</span>}
                    {s.distanceKm != null && (
                      <span>{s.distanceKm.toFixed(1).replace(".", ",")} km</span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const QuickChip = ({
  icon: Icon,
  label,
  value,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2.5 rounded-2xl bg-card/70 px-3 py-2.5 text-left transition-colors hover:bg-surface-hover"
  >
    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
      <Icon size={16} />
    </span>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-foreground">{label}</p>
      <p className="truncate text-[11px] text-muted-foreground">{value}</p>
    </div>
  </button>
);

export default HomeSheet;