import { Clock, MapPin, Bike, Loader2, TrendingUp, Tag, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RideConfirmCardProps {
  destination: string;
  estimatedPrice: number;
  estimatedTime: number;
  estimatedDistance: number;
  loading?: boolean;
  onConfirm: (coupon?: { code: string; discount: number }) => void;
  onCancel: () => void;
  surgeMultiplier?: number;
  surgeLabel?: string | null;
}

const RideConfirmCard = ({
  destination,
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

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute bottom-20 left-0 right-0 z-40 px-4"
    >
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <div className="flex items-center gap-3">
          <MapPin size={16} className="text-primary flex-shrink-0" />
          <span className="text-sm font-medium text-foreground truncate">{destination}</span>
        </div>

        <div className="flex items-center justify-between border-t border-b border-border py-3">
          <div className="flex items-center gap-2">
            <Bike size={16} className="text-muted-foreground" />
            <span className="font-display text-xs uppercase tracking-wider text-muted-foreground">Mototáxi</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Clock size={12} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{timeStr}</span>
            </div>
            <span className="text-xs text-muted-foreground">{distStr}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Valor estimado</span>
          <div className="text-right">
            {appliedCoupon && (
              <span className="block text-xs text-muted-foreground line-through">
                R$ {estimatedPrice.toFixed(2).replace(".", ",")}
              </span>
            )}
            <span className="font-display text-xl tracking-tight text-foreground">{priceStr}</span>
          </div>
        </div>

        {/* Coupon area */}
        {appliedCoupon ? (
          <div className="flex items-center justify-between rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-emerald-400">
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
              className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm uppercase tracking-wider text-foreground placeholder:text-muted-foreground placeholder:normal-case placeholder:tracking-normal"
            />
            <button
              onClick={validateCoupon}
              disabled={validating}
              className="rounded-md bg-primary px-3 py-2 font-display text-xs uppercase text-primary-foreground disabled:opacity-50"
            >
              {validating ? <Loader2 size={14} className="animate-spin" /> : "Aplicar"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCouponOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Tag size={12} /> Tenho um cupom
          </button>
        )}

        {hasSurge && (
          <div className="flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2">
            <TrendingUp size={14} className="text-primary" />
            <span className="text-xs text-foreground">
              Tarifa dinâmica <strong>{surgeMultiplier.toFixed(2)}x</strong>
              {surgeLabel ? ` · ${surgeLabel}` : ""}
            </span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-md border border-border py-3 font-display text-sm uppercase tracking-wider text-muted-foreground transition-colors hover:bg-surface-hover"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(appliedCoupon ?? undefined)}
            disabled={loading}
            className="flex-1 rounded-md bg-primary py-3 font-display text-sm uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="mx-auto animate-spin" /> : "Confirmar Corrida"}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default RideConfirmCard;
