import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Coffee, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (minutes: number) => void;
  onStop?: () => void;
  isResting: boolean;
  restUntil?: string | null;
}

const OPTIONS = [15, 30, 60];

const RestModeDialog = ({ open, onClose, onConfirm, onStop, isResting, restUntil }: Props) => {
  const [selected, setSelected] = useState(15);

  const minutesLeft = restUntil ? Math.max(0, Math.round((new Date(restUntil).getTime() - Date.now()) / 60000)) : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coffee size={18} className="text-primary" /> Modo descanso
          </DialogTitle>
          <DialogDescription>
            Pause o recebimento de novas corridas sem ficar offline. Você continua aparecendo no mapa.
          </DialogDescription>
        </DialogHeader>

        {isResting ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Em descanso</p>
              <p className="font-display text-2xl text-foreground mt-1">{minutesLeft} min restantes</p>
            </div>
            <button
              onClick={() => { onStop?.(); onClose(); }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive/15 text-destructive border border-destructive/30 py-3 font-display text-sm uppercase tracking-wider"
            >
              <X size={16} /> Encerrar descanso
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {OPTIONS.map((m) => (
                <button
                  key={m}
                  onClick={() => setSelected(m)}
                  className={`rounded-xl border py-3 font-display text-sm ${
                    selected === m ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {m} min
                </button>
              ))}
            </div>
            <button
              onClick={() => { onConfirm(selected); onClose(); }}
              className="w-full rounded-xl bg-primary py-3 font-display text-sm uppercase tracking-wider text-primary-foreground"
            >
              Iniciar descanso de {selected} min
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RestModeDialog;
