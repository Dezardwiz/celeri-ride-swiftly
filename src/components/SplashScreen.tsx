import { motion, AnimatePresence } from "framer-motion";
import appIcon from "/app-icon.png";

interface SplashScreenProps {
  visible: boolean;
}

const SplashScreen = ({ visible }: SplashScreenProps) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        key="splash"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
        style={{ backgroundColor: "#000000" }}
      >
        <motion.img
          src={appIcon}
          alt="Celeri"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="h-28 w-28 rounded-3xl"
        />
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-6 text-4xl font-bold uppercase tracking-[0.3em] text-white"
        >
          CELERI
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-2 text-sm italic tracking-wide text-white"
        >
          Seu destino, sem demora.
        </motion.p>
      </motion.div>
    )}
  </AnimatePresence>
);

export default SplashScreen;
