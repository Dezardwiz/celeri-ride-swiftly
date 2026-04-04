import { Star, X, DollarSign, CreditCard, QrCode, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface RideCompleteProps {
  price: number;
  distanceKm: number;
  durationMin: number;
  onSubmit: (payment: "pix" | "card" | "cash", rating: number) => void;
  onClose: () => void;
}

const RideComplete = ({ price, distanceKm, durationMin, onSubmit, onClose }: RideCompleteProps) => {
  const [rating, setRating] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card" | "cash">("pix");
  const [submitted, setSubmitted] = useState(false);

  const payments = [
    { id: "pix" as const, label: "PIX", icon: QrCode },
    { id: "card" as const, label: "CARTÃO", icon: CreditCard },
    { id: "cash" as const, label: "DINHEIRO", icon: DollarSign },
  ];

  const handleSubmit = () => {
    onSubmit(paymentMethod, rating);
    setSubmitted(true);
    setTimeout(onClose, 1500);
  };

  const priceStr = `R$ ${price.toFixed(2).replace(".", ",")}`;

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
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-md rounded-t-xl border border-border bg-card p-6 space-y-5"
      >
        {submitted ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="py-8 text-center space-y-2"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
              <Star size={24} className="text-primary fill-primary" />
            </div>
            <h3 className="font-display text-lg uppercase tracking-wider text-foreground">Obrigado!</h3>
            <p className="text-sm text-muted-foreground">Corrida finalizada com sucesso</p>
          </motion.div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg uppercase tracking-wider text-foreground">Corrida Finalizada</h3>
              <button onClick={onClose} className="text-muted-foreground p-1"><X size={18} /></button>
            </div>

            <div className="rounded-md bg-input p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Distância</span>
                <span className="text-sm text-foreground">{distanceKm.toFixed(1)} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Duração</span>
                <span className="text-sm text-foreground">{durationMin} min</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-sm font-medium text-foreground">Total</span>
                <span className="font-display text-xl tracking-tight text-foreground">{priceStr}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-display text-xs uppercase tracking-wider text-muted-foreground">Pagamento</span>
              <div className="flex gap-2">
                {payments.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPaymentMethod(p.id)}
                    className={`flex flex-1 flex-col items-center gap-1 rounded-md border py-3 transition-colors ${
                      paymentMethod === p.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-surface-hover"
                    }`}
                  >
                    <p.icon size={16} />
                    <span className="font-display text-[10px] tracking-wider">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-display text-xs uppercase tracking-wider text-muted-foreground">Avalie o mototaxista</span>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setRating(star)} className="p-1">
                    <Star
                      size={28}
                      className={`transition-colors ${star <= rating ? "text-warning fill-warning" : "text-muted-foreground"}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={rating === 0}
              className="w-full rounded-md bg-primary py-3 font-display text-sm uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
            >
              Confirmar Pagamento
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default RideComplete;
