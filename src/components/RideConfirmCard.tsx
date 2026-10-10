import { Clock, Bike, Loader2, TrendingUp, Tag, Check, X, Zap, Banknote, CreditCard, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RideConfirmCardProps {
  destination: string;
  origin?: string;
  estimatedPrice: number;
  estimatedTime: number;
  estimatedDistance: number;
  loading?: boolean;
  onConfirm: (
    coupon?: { code: string; discount: number },
    opts?: { payment: "pix" | "cash" | "card"; changeFor: number; usePin: boolean }
  ) => void;
  onCancel: () => void;
  surgeMultiplier?: number;
  surgeLabel?: string | null;
}

const RideConfirmCard = ({
  destination,
  origin,
  estimatedPrice,
  estimatedTime,
  estimatedDistance,
  loading,
  onConfirm,
  onCancel,
  surgeMultiplier = 1,
  surgeLabel,
}: RideConfirmCardProps) => {
  const [couponCode, setCouponCode] = useState("");
  const [couponOpen, setCouponOpen] = useState(false);
  const [validating, setValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [payment, setPayment] = useState<"pix" | "cash" | "card">("pix");
  const [changeFor, setChangeFor] = useState(0);
  const [usePin, setUsePin] = useState(false);

  const finalPrice = Math.max(0, estimatedPrice - (appliedCoupon?.discount ?? 0));
  const priceStr = `R$ ${finalPrice.toFixed(2).replace(".", ",")}`;
  const timeStr = `${estimatedTime} min`;
  const distStr = `${estimatedDistance.toFixed(1)} km`;
  const hasSurge = surgeMultiplier > 1.01;

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidating(true);
    const { data, error } = await supabase.rpc("validate_coupon", {
      _code: couponCode.trim().toUpperCase(),
      _ride_price: estimatedPrice,
    });
    setValidating(false);
    const res = data as any;
    if (error || !res?.ok) {
      const reason = res?.reason;
      const msg =
        reason === "invalid_code" ? "Cupom inválido" :
        reason === "expired" ? "Cupom expirado" :
        reason === "fully_used" ? "Cupom esgotado" :
        reason === "already_used" ? "Você já usou este cupom" :
        reason === "not_first_ride" ? "Cupom válido apenas na primeira corrida" :
        reason === "below_minimum" ? `Valor mínimo de R$ ${res.min?.toFixed(2) ?? ""}` :
        "Não foi possível aplicar o cupom";
      toast.error(msg);
      return;
    }
    setAppliedCoupon({ code: res.code, discount: Number(res.discount) });
    toast.success(`Cupom aplicado: -R$ ${Number(res.discount).toFixed(2)}`);
    setCouponOpen(false);
  };

  const payOptions = [
    { id: "pix" as const, label: "PIX", icon: Zap },
    { id: "cash" as const, label: "Dinheiro", icon: Banknote },
    { id: "card" as const, label: "Cartão", icon: CreditCard },
  ];
  const changeOptions = [0, 20, 50, 100].filter((v) => v === 0 || v > finalPrice);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute bottom-20 left-0 right-0 z-40 px-4"
    >
      <div className="max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-card p-4 space-y-4 shadow-2xl">
        {/* Route origin → destination */}
        <div className="flex gap-3">
          <div className="flex flex-col items-center pt-1">
            <span className="h-3 w-3 rounded-full border-2 border-primary bg-background" />
            <span className="my-1 w-px flex-1 border-l-2 border-dashed border-muted-foreground/40" />
            <span className="h-3 w-3 rounded-sm bg-primary" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Embarque</p>
              <p className="truncate text-sm text-foreground">{origin || "Sua localização atual (GPS)"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Destino</p>
              <p className="truncate text-sm font-medium text-foreground">{destination}</p>
            </div>
          </div>
        </div>

        {/* Category card */}
        <div className="flex items-center gap-3 rounded-xl border-2 border-primary bg-primary/5 p-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
            <Bike size={26} className="text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-bold uppercase tracking-wider text-foreground">CELERI Moto</span>
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary-foreground">Rápido</span>
            </div>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock size={11} /> {timeStr} · {distStr}
            </p>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <User size={11} /> 1 passageiro · capacete higienizado
            </p>
          </div>
          <div className="text-right">
            {appliedCoupon && (
              <span className="block text-[11px] text-muted-foreground line-through">
                R$ {estimatedPrice.toFixed(2).replace(".", ",")}
              </span>
            )}
            <span className="font-display text-lg font-bold text-primary">{priceStr}</span>
          </div>
        </div>

        {hasSurge && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2">
            <TrendingUp size={14} className="text-primary" />
            <span className="text-xs text-foreground">
              Tarifa dinâmica <strong>{surgeMultiplier.toFixed(2)}x</strong>
              {surgeLabel ? ` · ${surgeLabel}` : ""}
            </span>
          </div>
        )}

        {/* Payment selector */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Forma de pagamento</p>
          <div className="grid grid-cols-3 gap-2">
            {payOptions.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setPayment(id)}
                className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs transition-all ${
                  payment === id
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={18} className={payment === id ? "text-primary" : ""} />
                {label}
              </button>
            ))}
          </div>
          <AnimatePresence>
            {payment === "cash" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="pb-1.5 pt-1 text-[11px] text-muted-foreground">Precisa de troco?</p>
                <div className="flex flex-wrap gap-2">
                  {changeOptions.map((v) => (
                    <button
                      key={v}
                      onClick={() => setChangeFor(v)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                        changeFor === v
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {v === 0 ? "Sem troco" : `Para R$ ${v}`}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Coupon area */}
        {appliedCoupon ? (
          <div className="flex items-center justify-between rounded-lg border border-primary/40 bg-primary/10 px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-primary">
              <Check size={14} />
              <strong>{appliedCoupon.code}</strong>
              <span>-R$ {appliedCoupon.discount.toFixed(2)}</span>
            </div>
            <button onClick={() => setAppliedCoupon(null)} className="text-muted-foreground">
              <X size={14} />
            </button>
          </div>
        ) : couponOpen ? (
          <div className="flex gap-2">
            <input
              autoFocus
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Código do cupom"
              className="flex-1 rounded-lg border border-border bg-input px-3 py-2 text-sm uppercase tracking-wider text-foreground placeholder:text-muted-foreground placeholder:normal-case placeholder:tracking-normal"
            />
            <button
              onClick={validateCoupon}
              disabled={validating}
              className="rounded-lg bg-primary px-3 py-2 font-display text-xs uppercase text-primary-foreground disabled:opacity-50"
            >
              {validating ? <Loader2 size={14} className="animate-spin" /> : "Aplicar"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCouponOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Tag size={12} /> Tenho um cupom
          </button>
        )}

        <button
          type="button"
          onClick={() => setUsePin((v) => !v)}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-input px-3 py-2.5 text-left"
        >
          <div>
            <p className="text-xs font-medium text-foreground">Código de segurança no embarque</p>
            <p className="text-[11px] text-muted-foreground">Confira 4 números com o mototaxista antes de sair</p>
          </div>
          <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${usePin ? "bg-primary" : "bg-muted"}`}>
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-all ${usePin ? "left-[18px]" : "left-0.5"}`} />
          </span>
        </button>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl border border-border px-4 py-3.5 font-display text-sm uppercase tracking-wider text-muted-foreground transition-colors hover:bg-surface-hover"
          >
            Voltar
          </button>
          <button
            onClick={() => onConfirm(appliedCoupon ?? undefined, { payment, changeFor, usePin })}
            disabled={loading}
            className="flex-1 rounded-xl bg-primary py-3.5 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="mx-auto animate-spin" /> : `Pedir CELERI · ${priceStr}`}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default RideConfirmCard;
