import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldAlert, Phone, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { playSound, vibrate } from "@/lib/notifications";

interface Props {
  rideId?: string | null;
  role: "passenger" | "driver";
  className?: string;
}

const getPos = () =>
  new Promise<{ lat: number; lng: number } | null>((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  });

const SosButton = ({ rideId, role, className = "" }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  const trigger = async () => {
    playSound("sos");
    vibrate([400, 100, 400, 100, 400]);
    const pos = await getPos();
    if (user) {
      const { error } = await (supabase as any).from("sos_alerts").insert({
        user_id: user.id,
        ride_id: rideId ?? null,
        role,
        lat: pos?.lat ?? null,
        lng: pos?.lng ?? null,
      });
      if (error) console.error("SOS error", error);
    }
    setSent(true);
    toast.error("Alerta SOS enviado à central CELERI");
    return pos;
  };

  const shareLocation = async () => {
    const pos = await trigger();
    const link = rideId
      ? `${window.location.origin}/share/${rideId}`
      : pos
      ? `https://maps.google.com/?q=${pos.lat},${pos.lng}`
      : "";
    const text = `🚨 Preciso de ajuda! Estou em uma corrida CELERI. Minha localização: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const call190 = async () => {
    trigger();
    window.location.href = "tel:190";
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="SOS emergência"
        className={`flex items-center gap-1 rounded-full bg-destructive px-3 py-2 font-display text-xs uppercase tracking-wider text-destructive-foreground shadow-lg ${className}`}
      >
        <ShieldAlert size={14} /> SOS
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md space-y-3 rounded-t-xl border border-border bg-card p-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-display text-lg uppercase tracking-wider text-destructive">
                  <ShieldAlert size={20} /> Emergência
                </h3>
                <button onClick={() => setOpen(false)} className="p-1 text-muted-foreground"><X size={18} /></button>
              </div>
              <p className="text-sm text-muted-foreground">
                {sent ? "A central já foi avisada com sua localização." : "Escolha uma opção. A central CELERI será avisada com sua localização."}
              </p>
              <button onClick={call190} className="flex w-full items-center justify-center gap-2 rounded-md bg-destructive py-3 font-display text-sm uppercase tracking-wider text-destructive-foreground">
                <Phone size={16} /> Ligar 190 (Polícia)
              </button>
              <button onClick={shareLocation} className="flex w-full items-center justify-center gap-2 rounded-md border border-border py-3 font-display text-sm uppercase tracking-wider text-foreground">
                <Share2 size={16} /> Enviar localização no WhatsApp
              </button>
              {!sent && (
                <button onClick={trigger} className="w-full rounded-md border border-destructive/40 py-3 font-display text-xs uppercase tracking-wider text-destructive">
                  Só avisar a central
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SosButton;
