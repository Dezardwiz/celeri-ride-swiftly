import { useState } from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const GOOD = ["Pontual", "Educado", "Local correto", "Pagamento rápido"];
const BAD = ["Atrasou", "Local errado", "Falta de educação", "Problema no pagamento"];

interface Props {
  rideId: string;
  passengerId: string;
  onClose: () => void;
}

const RatePassengerSheet = ({ rideId, passengerId, onClose }: Props) => {
  const { user } = useAuth();
  const [score, setScore] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const options = score >= 4 || score === 0 ? GOOD : BAD;

  const toggle = (t: string) => setTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  const submit = async () => {
    if (!user || score === 0) return;
    setSaving(true);
    const { error } = await supabase.from("ratings").insert({
      ride_id: rideId,
      from_user_id: user.id,
      to_user_id: passengerId,
      score,
      tags,
    });
    setSaving(false);
    if (error) toast.error("Não foi possível salvar a avaliação");
    else toast.success("Avaliação enviada");
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        className="w-full max-w-md rounded-t-xl border border-border bg-card p-6 space-y-5"
      >
        <h3 className="font-display text-lg uppercase tracking-wider text-foreground">Avalie o passageiro</h3>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => { setScore(s); setTags([]); }} aria-label={`${s} estrelas`}>
              <Star size={32} className={s <= score ? "text-primary fill-primary" : "text-muted-foreground"} />
            </button>
          ))}
        </div>
        {score > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {options.map((t) => (
              <button
                key={t}
                onClick={() => toggle(t)}
                className={`rounded-full border px-3 py-1 text-xs ${tags.includes(t) ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-md border border-border py-3 text-sm text-muted-foreground">Pular</button>
          <button
            onClick={submit}
            disabled={score === 0 || saving}
            className="flex-1 rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RatePassengerSheet;
