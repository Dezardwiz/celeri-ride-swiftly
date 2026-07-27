import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    className="flex flex-col items-center justify-center gap-3 px-8 py-16 text-center"
  >
    <div className="relative flex h-20 w-20 items-center justify-center">
      <span className="absolute inset-0 rounded-full bg-primary/10" />
      <span className="absolute inset-3 rounded-full bg-primary/10" />
      <Icon size={28} className="relative text-primary" />
    </div>
    <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
    {description && <p className="max-w-[260px] text-sm text-muted-foreground">{description}</p>}
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="mt-2 rounded-full bg-primary px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-transform active:scale-95"
      >
        {actionLabel}
      </button>
    )}
  </motion.div>
);

export default EmptyState;