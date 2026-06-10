import { Menu, Bell } from "lucide-react";
import { motion } from "framer-motion";
import geleriLogo from "@/assets/geleri-logo.jpeg";

interface HomeHeaderProps {
  hasNotifications?: boolean;
  onMenu?: () => void;
  onNotifications?: () => void;
}

const HomeHeader = ({ hasNotifications = true, onMenu, onNotifications }: HomeHeaderProps) => {
  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-4 pt-safe pb-3 bg-gradient-to-b from-background via-background/85 to-transparent"
    >
      <button
        onClick={onMenu}
        aria-label="Menu"
        className="flex h-10 w-10 items-center justify-center rounded-full text-foreground/90 transition-colors hover:bg-surface-hover"
      >
        <Menu size={22} strokeWidth={2.2} />
      </button>

      <div className="flex items-center gap-2 pointer-events-none select-none">
        <img src={geleriLogo} alt="Celeri" className="h-9 w-9 rounded-lg" />
        <div className="flex flex-col leading-none">
          <span className="font-display text-2xl font-bold uppercase tracking-widest text-foreground">CELERI</span>
          <span className="mt-0.5 text-[10px] tracking-wide text-primary">Seu destino, sem demora.</span>
        </div>
      </div>

      <button
        onClick={onNotifications}
        aria-label="Notificações"
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground/90 transition-colors hover:bg-surface-hover"
      >
        <Bell size={22} strokeWidth={2.2} />
        {hasNotifications && (
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
        )}
      </button>
    </motion.header>
  );
};

export default HomeHeader;