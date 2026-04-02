import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import DriverHome from "@/components/driver/DriverHome";
import DriverEarnings from "@/components/driver/DriverEarnings";
import DriverNav from "@/components/driver/DriverNav";
import DriverRideNavigation from "@/components/driver/DriverRideNavigation";
import ProfileScreen from "@/components/ProfileScreen";
import { useActiveRide } from "@/hooks/useActiveRide";
import { toast } from "sonner";
import geleriLogo from "@/assets/geleri-logo.jpeg";

const Driver = () => {
  const [activeTab, setActiveTab] = useState<"home" | "earnings" | "profile">("home");
  const { ride: activeRide, advanceStatus, completeRide, cancelRide } = useActiveRide();

  const handleAdvance = async () => {
    await advanceStatus();
  };

  const handleComplete = async () => {
    await completeRide();
    toast.success("Corrida finalizada!");
  };

  const handleCancel = async () => {
    await cancelRide();
    toast.info("Corrida cancelada");
  };

  return (
    <div className="relative min-h-screen w-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center gap-2">
          <img src={geleriLogo} alt="Geleri" className="h-8 w-8 rounded-lg" />
          <h1 className="font-display text-xl font-bold uppercase tracking-widest text-foreground">
            GELERI <span className="text-primary text-sm font-normal tracking-wide">moto</span>
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
