import { Navigation, DollarSign, User } from "lucide-react";
import { motion } from "framer-motion";

interface DriverNavProps {
  activeTab: "home" | "earnings" | "profile";
  onTabChange: (tab: "home" | "earnings" | "profile") => void;
}

const DriverNav = ({ activeTab, onTabChange }: DriverNavProps) => {
  const tabs = [
    { id: "home" as const, icon: Navigation, label: "CORRIDAS" },
    { id: "earnings" as const, icon: DollarSign, label: "GANHOS" },
    { id: "profile" as const, icon: User, label: "PERFIL" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-md items-center justify-around py-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center gap-1 px-6 py-2"
            >
              {isActive && (
                <motion.div
                  layoutId="driver-nav-indicator"
                  className="absolute -top-[1px] left-1/2 h-[2px] w-8 -translate-x-1/2 bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <tab.icon
                size={20}
                className={isActive ? "text-primary" : "text-muted-foreground"}
              />
              <span
                className={`font-display text-[10px] tracking-wider ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
};

export default DriverNav;
