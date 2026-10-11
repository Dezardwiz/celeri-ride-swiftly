import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const OPTIONS = [
  { id: "cash", label: "Dinheiro" },
  { id: "pix", label: "PIX" },
  { id: "card", label: "Cartão" },
];

const PaymentPrefs = ({ driverId, initial }: { driverId: string; initial: string[] }) => {
  const [selected, setSelected] = useState<string[]>(initial);

  const toggle = async (id: string) => {
    const next = selected.includes(id) ? selected.filter((m) => m !== id) : [...selected, id];
    if (next.length === 0) {
      toast.error("Aceite pelo menos uma forma de pagamento");
      return;
    }
    const prev = selected;
    setSelected(next);
    const { error } = await supabase.from("drivers").update({ accepted_payment_methods: next }).eq("id", driverId);
    if (error) {
      setSelected(prev);
      toast.error("Não foi possível salvar");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-3 font-display text-xs uppercase tracking-wider text-muted-foreground">Pagamentos que aceito</p>
      <div className="flex gap-2">
        {OPTIONS.map((o) => {
          const on = selected.includes(o.id);
          return (
            <button
              key={o.id}
              onClick={() => toggle(o.id)}
              className={`flex-1 rounded-lg border py-2.5 text-xs font-display uppercase tracking-wider transition-colors ${
                on ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentPrefs;
