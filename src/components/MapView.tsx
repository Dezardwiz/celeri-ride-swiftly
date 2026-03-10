import { MapPin, Navigation, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MapViewProps {
  showRoute?: boolean;
  searching?: boolean;
  driverLocation?: { x: number; y: number };
  pickupLocation?: { x: number; y: number };
  dropoffLocation?: { x: number; y: number };
}

const MapView = ({
  showRoute = false,
  searching = false,
  driverLocation,
  pickupLocation = { x: 50, y: 45 },
  dropoffLocation = { x: 70, y: 25 },
}: MapViewProps) => {
  return (
    <div className="absolute inset-0 map-grid bg-background overflow-hidden">
      {/* Simulated map roads */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {/* Main roads */}
        <line x1="0" y1="40%" x2="100%" y2="40%" stroke="hsl(220 14% 18%)" strokeWidth="3" />
        <line x1="0" y1="60%" x2="100%" y2="60%" stroke="hsl(220 14% 18%)" strokeWidth="3" />
        <line x1="30%" y1="0" x2="30%" y2="100%" stroke="hsl(220 14% 18%)" strokeWidth="3" />
        <line x1="65%" y1="0" x2="65%" y2="100%" stroke="hsl(220 14% 18%)" strokeWidth="3" />
        
        {/* Secondary roads */}
        <line x1="0" y1="25%" x2="100%" y2="25%" stroke="hsl(220 14% 14%)" strokeWidth="1.5" />
        <line x1="0" y1="75%" x2="100%" y2="75%" stroke="hsl(220 14% 14%)" strokeWidth="1.5" />
        <line x1="15%" y1="0" x2="15%" y2="100%" stroke="hsl(220 14% 14%)" strokeWidth="1.5" />
        <line x1="50%" y1="0" x2="50%" y2="100%" stroke="hsl(220 14% 14%)" strokeWidth="1.5" />
        <line x1="82%" y1="0" x2="82%" y2="100%" stroke="hsl(220 14% 14%)" strokeWidth="1.5" />

        {/* Route line */}
        {showRoute && (
          <path
            d={`M ${pickupLocation.x}% ${pickupLocation.y}% Q 55% 35%, ${dropoffLocation.x}% ${dropoffLocation.y}%`}
            fill="none"
            stroke="hsl(221 100% 59%)"
            strokeWidth="3"
            strokeLinecap="round"
            className="animate-draw-route"
          />
        )}
      </svg>

      {/* Pickup marker */}
      <div
        className="absolute z-10"
        style={{ left: `${pickupLocation.x}%`, top: `${pickupLocation.y}%`, transform: "translate(-50%, -100%)" }}
      >
        <div className="flex flex-col items-center">
          <div className="rounded-full bg-primary p-1.5">
            <Circle size={8} className="text-primary-foreground fill-primary-foreground" />
          </div>
          <div className="h-4 w-0.5 bg-primary" />
        </div>
      </div>

      {/* Destination marker */}
      {showRoute && (
        <div
          className="absolute z-10"
          style={{ left: `${dropoffLocation.x}%`, top: `${dropoffLocation.y}%`, transform: "translate(-50%, -100%)" }}
        >
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-foreground p-1.5">
              <MapPin size={10} className="text-background" />
            </div>
            <div className="h-4 w-0.5 bg-foreground" />
          </div>
        </div>
      )}

      {/* Searching pulse */}
      <AnimatePresence>
        {searching && (
          <div
            className="absolute z-20"
            style={{ left: `${pickupLocation.x}%`, top: `${pickupLocation.y}%`, transform: "translate(-50%, -50%)" }}
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute h-6 w-6 rounded-full bg-primary animate-sonar" />
              <div className="absolute h-6 w-6 rounded-full bg-primary animate-sonar-delay" />
              <div className="h-3 w-3 rounded-full bg-primary" />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Driver marker */}
      {driverLocation && (
        <motion.div
          className="absolute z-20"
          style={{ transform: "translate(-50%, -50%)" }}
          initial={{ left: `${driverLocation.x - 10}%`, top: `${driverLocation.y + 10}%` }}
          animate={{ left: `${driverLocation.x}%`, top: `${driverLocation.y}%` }}
          transition={{ duration: 2, ease: "easeInOut" }}
        >
          <div className="rounded-full border-2 border-primary bg-background p-1">
            <Navigation size={14} className="text-primary" />
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MapView;
