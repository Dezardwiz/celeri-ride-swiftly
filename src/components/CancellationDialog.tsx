import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Loader2 } from "lucide-react";

export type CancelActor = "passenger" | "driver";

const REASONS_PASSENGER = [
  "Mudei de ideia",
  "Mototaxista demorando muito",
  "Endereço incorreto",
  "Solicitei por engano",
  "Outro motivo",
];

const REASONS_DRIVER = [
  "Passageiro não apareceu",
  "Endereço inacessível",
  "Problema com a moto",
  "Passageiro pediu para cancelar",
  "Outro motivo",
];

interface Props {
  open: boolean;
  actor: CancelActor;
  estimatedFee?: number;
  loading?: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

const CancellationDialog = ({ open, actor, estimatedFee = 0, loading, onConfirm, onClose }: Props) => {
  const reasons = actor === "passenger" ? REASONS_PASSENGER : REASONS_DRIVER;
  const [selected, setSelected] = useState<string>(reasons[0]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-2xl border border-border bg-card p-5 sm:rounded-2xl"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h3 className="font-display text-base uppercase tracking-wider text-foreground">
                  Cancelar corrida
                </h3>
              </div>
              <button onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:bg-surface-hover">
                <X className="h-4 w-4" />
              </button>
            </div>

            {estimatedFee > 0 && (
              <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                <p className="text-xs text-destructive">
                  Uma taxa de cancelamento de{" "}
                  <span className="font-display">R$ {estimatedFee.toFixed(2)}</span> poderá ser aplicada.
                </p>
              </div>
            )}

            <p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">Motivo</p>
            <div className="mt-2 space-y-2">
              {reasons.map((r) => (
                <label
                  key={r}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors ${
                    selected === r
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-input text-muted-foreground"
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={selected === r}
                    onChange={() => setSelected(r)}
                    className="accent-primary"
                  />
                  {r}
                </label>
              ))}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 rounded-lg border border-border py-3 text-sm font-medium text-muted-foreground hover:bg-surface-hover disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                onClick={() => onConfirm(selected)}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-destructive py-3 font-display text-sm uppercase tracking-wider text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar cancelamento"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CancellationDialog;