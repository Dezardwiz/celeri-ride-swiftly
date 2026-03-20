import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import DriverHome from "@/components/driver/DriverHome";
import DriverEarnings from "@/components/driver/DriverEarnings";
import DriverNav from "@/components/driver/DriverNav";
import ProfileScreen from "@/components/ProfileScreen";

const Driver = () => {
  const [activeTab, setActiveTab] = useState<"home" | "earnings" | "profile">("home");

  return (
    <div className="relative min-h-screen w-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm px-4 py-3">
        <h1 className="font-display text-xl font-bold uppercase tracking-widest text-foreground">
          CELERI <span className="text-primary text-sm font-normal tracking-wide">moto</span>
        </h1>
      </div>

      {/* Content */}
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
    </div>
  );
};

export default Driver;
