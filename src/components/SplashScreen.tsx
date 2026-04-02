import { motion, AnimatePresence } from "framer-motion";

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
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ backgroundColor: "#2b2b2b" }}
      >
        <motion.img
          src="/geleri-splash.jpeg"
          alt="Geleri"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="h-64 w-64 object-contain"
        />
      </motion.div>
    )}
  </AnimatePresence>
);

export default SplashScreen;
