import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useMotionValue, animate, type PanInfo } from "framer-motion";

export type SnapPoint = "collapsed" | "half" | "expanded";

interface DragSheetProps {
  children: ReactNode;
  /** Fractions of viewport height occupied by the sheet at each snap point */
  snapFractions?: Record<SnapPoint, number>;
  initial?: SnapPoint;
  bottomOffset?: number;
  onSnapChange?: (snap: SnapPoint) => void;
  className?: string;
}

const DEFAULT_FRACTIONS: Record<SnapPoint, number> = {
  collapsed: 0.22,
  half: 0.52,
  expanded: 0.86,
};

const ORDER: SnapPoint[] = ["collapsed", "half", "expanded"];

/**
 * Uber-style bottom sheet with real, gesture-driven snap points.
 * Built on Framer Motion only — no extra dependency.
 */
const DragSheet = ({
  children,
  snapFractions = DEFAULT_FRACTIONS,
  initial = "half",
  bottomOffset = 72,
  onSnapChange,
  className = "",
}: DragSheetProps) => {
  const [vh, setVh] = useState(() => (typeof window === "undefined" ? 800 : window.innerHeight));
  const [snap, setSnap] = useState<SnapPoint>(initial);
  const y = useMotionValue(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sheetHeight = Math.max(vh * snapFractions.expanded, 240);
  const offsetFor = (s: SnapPoint) => sheetHeight - vh * snapFractions[s];

  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    animate(y, offsetFor(snap), { type: "spring", stiffness: 420, damping: 40 });
    onSnapChange?.(snap);
    if (scrollRef.current && snap !== "expanded") scrollRef.current.scrollTop = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap, vh, sheetHeight]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const current = y.get() + info.velocity.y * 0.12;
    let best: SnapPoint = ORDER[0];
    let bestDist = Infinity;
    for (const s of ORDER) {
      const d = Math.abs(offsetFor(s) - current);
      if (d < bestDist) {
        bestDist = d;
        best = s;
      }
    }
    if (best === snap) animate(y, offsetFor(snap), { type: "spring", stiffness: 420, damping: 40 });
    setSnap(best);
  };

  const cycle = () => {
    const idx = ORDER.indexOf(snap);
    setSnap(ORDER[(idx + 1) % ORDER.length]);
  };

  return (
    <motion.div
      style={{ y, height: sheetHeight, bottom: bottomOffset }}
      drag="y"
      dragElastic={0.06}
      dragMomentum={false}
      dragConstraints={{ top: offsetFor("expanded"), bottom: offsetFor("collapsed") }}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: sheetHeight }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={`absolute inset-x-0 z-30 flex flex-col rounded-t-[28px] border-t border-border/60 bg-background/98 backdrop-blur-xl shadow-lg touch-none ${className}`}
    >
      <button
        onClick={cycle}
        aria-label="Expandir ou recolher"
        className="flex w-full flex-shrink-0 cursor-grab justify-center py-3 active:cursor-grabbing"
      >
        <span className="h-1.5 w-11 rounded-full bg-muted-foreground/30 transition-colors hover:bg-muted-foreground/50" />
      </button>

      <div
        ref={scrollRef}
        className={`no-scrollbar flex-1 ${snap === "expanded" ? "overflow-y-auto touch-pan-y" : "overflow-hidden"}`}
      >
        {children}
      </div>
    </motion.div>
  );
};

export default DragSheet;