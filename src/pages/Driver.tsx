import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import DriverHome from "@/components/driver/DriverHome";
import DriverEarnings from "@/components/driver/DriverEarnings";
import DriverNav from "@/components/driver/DriverNav";
import DriverRideNavigation from "@/components/driver/DriverRideNavigation";
import ProfileScreen from "@/components/ProfileScreen";
import { useActiveRide } from "@/hooks/useActiveRide";
import { toast } from "sonner";
import geleriLogo from "@/assets/geleri-logo.jpeg";
import CancellationDialog from "@/components/CancellationDialog";
import { useCancellationSettings, estimateCancellationFee, cancelRideRpc } from "@/hooks/useCancellation";

const Driver = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"home" | "earnings" | "profile">("home");
  const { ride: activeRide, advanceStatus, completeRide } = useActiveRide();
  const settings = useCancellationSettings();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("drivers")
      .select("onboarding_status, is_approved")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        const status = (data as any).onboarding_status;
        if (status && status !== "approved" && !data.is_approved) {
          navigate("/driver/onboarding", { replace: true });
        }
      });
  }, [user, navigate]);

  const handleAdvance = async () => {
    await advanceStatus();
  };

  const handleComplete = async () => {
    await completeRide();
    toast.success("Corrida finalizada!");
  };

  const handleCancel = () => setCancelOpen(true);

  const confirmCancel = async (reason: string) => {
    if (!activeRide) return;
    setCanceling(true);
    try {
      const res = await cancelRideRpc(activeRide.id, "driver", reason);
      if (res?.fee && res.fee > 0) {
        toast.warning(`Corrida cancelada — taxa de R$ ${res.fee.toFixed(2)} aplicada`);
      } else {
        toast.info("Corrida cancelada");
      }
      setCancelOpen(false);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao cancelar");
    } finally {
      setCanceling(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center gap-2">
          <img src={geleriLogo} alt="Celeri" className="h-8 w-8 rounded-lg" />
          <h1 className="font-display text-xl font-bold uppercase tracking-widest text-foreground">
            CELERI <span className="text-primary text-sm font-normal tracking-wide">moto</span>
          </h1>
        </div>
      </div>

      {/* Active ride navigation - fullscreen overlay */}
      <AnimatePresence>
        {activeRide && (
          <DriverRideNavigation
            key="ride-nav"
            ride={activeRide}
            onAdvance={handleAdvance}
            onComplete={handleComplete}
            onCancel={handleCancel}
          />
        )}
      </AnimatePresence>

      <CancellationDialog
        open={cancelOpen}
        actor="driver"
        estimatedFee={estimateCancellationFee(activeRide, "driver", settings)}
        loading={canceling}
        onConfirm={confirmCancel}
        onClose={() => setCancelOpen(false)}
      />

      {/* Content - only shown when no active ride */}
      {!activeRide && (
        <>
          <AnimatePresence mode="wait">
            {activeTab === "home" && (
              <motion.div key="driver-home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <DriverHome />
              </motion.div>
            )}
            {activeTab === "earnings" && (
              <motion.div key="driver-earnings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <DriverEarnings />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {activeTab === "profile" && (
              <ProfileScreen key="driver-profile" onBack={() => setActiveTab("home")} />
            )}
          </AnimatePresence>

          <DriverNav activeTab={activeTab} onTabChange={setActiveTab} />
        </>
      )}
    </div>
  );
};

export default Driver;
