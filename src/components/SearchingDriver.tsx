import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { ShieldCheck, X } from "lucide-react";

interface SearchingDriverProps {
  onFound: () => void;
  onCancel?: () => void;
}

const TIPS = [
  "Todos os condutores têm CNH e documentos verificados.",
  "Confira a placa da moto antes de embarcar.",
  "Use sempre o capacete oferecido pelo mototaxista.",
  "Compartilhe sua viagem com alguém de confiança.",
];

const STEPS = [
  "Localizando mototaxistas próximos...",
  "Enviando seu pedido...",
  "Aguardando confirmação...",
];

const SearchingDriver = ({ onFound, onCancel }: SearchingDriverProps) => {
  const [tip, setTip] = useState(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setTimeout(onFound, 3000);
    const a = setInterval(() => setTip((i) => (i + 1) % TIPS.length), 3500);
    const b = setInterval(() => setStep((i) => Math.min(i + 1, STEPS.length - 1)), 1100);
    return () => { clearTimeout(t); clearInterval(a); clearInterval(b); };
  }, [onFound]);

  return (
    <>
      {/* Radar over the map */}
      <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center pb-40">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute h-24 w-24 rounded-full border-2 border-primary bg-primary/10"
            initial={{ scale: 0.3, opacity: 0.8 }}
            animate={{ scale: 3.5, opacity: 0 }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
          />
        ))}
        <span className="relative h-5 w-5 rounded-full border-4 border-background bg-primary shadow-lg" />
      </div>

      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="absolute bottom-20 left-0 right-0 z-40 px-4"
      >
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-2xl">
          <div>
            <h3 className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
              Procurando mototaxista
            </h3>
            <AnimatePresence mode="wait">
              <motion.p
                key={step}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-1 text-sm text-muted-foreground"
              >
                {STEPS[step]}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="h-1 w-full overflow-hidden rounded-full bg-input">
            <motion.div
              className="h-full w-1/3 rounded-full bg-primary"
              animate={{ x: ["-100%", "300%"] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-primary/10 p-3">
            <ShieldCheck size={16} className="mt-0.5 flex-shrink-0 text-primary" />
            <AnimatePresence mode="wait">
              <motion.p
                key={tip}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-foreground"
              >
                {TIPS[tip]}
              </motion.p>
            </AnimatePresence>
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 font-display text-sm uppercase tracking-wider text-muted-foreground transition-colors hover:bg-surface-hover"
            >
              <X size={14} /> Cancelar busca
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default SearchingDriver;
