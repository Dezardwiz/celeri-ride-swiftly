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
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#2a2a2a]"
      >
        <motion.img
          src="/geleri-splash.jpeg"
          alt="Geleri"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-72 w-72 object-contain"
        />
      </motion.div>
    )}
  </AnimatePresence>
);

export default SplashScreen;
