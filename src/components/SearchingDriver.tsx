import { motion } from "framer-motion";

interface SearchingDriverProps {
  onFound: () => void;
}

const SearchingDriver = ({ onFound }: SearchingDriverProps) => {
  // Simulate finding a driver after 3 seconds
  setTimeout(onFound, 3000);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="absolute bottom-20 left-0 right-0 z-40 px-4"
    >
      <div className="rounded-lg border border-border bg-card p-6 text-center space-y-4">
        {/* Pulse indicator */}
        <div className="flex justify-center">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div className="absolute h-8 w-8 rounded-full bg-primary animate-sonar" />
            <div className="absolute h-8 w-8 rounded-full bg-primary animate-sonar-delay" />
            <div className="h-4 w-4 rounded-full bg-primary" />
          </div>
        </div>

        <div>
          <h3 className="font-display text-lg uppercase tracking-wider text-foreground">
            Procurando Mototaxista
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Buscando o mais próximo de você...
          </p>
        </div>

        <div className="h-1 w-full overflow-hidden rounded-full bg-input">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 3, ease: "linear" }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default SearchingDriver;
