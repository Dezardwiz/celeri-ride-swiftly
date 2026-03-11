import { useState, useCallback, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import MapView from "@/components/MapView";
import WhereToInput from "@/components/WhereToInput";
import DestinationSearch from "@/components/DestinationSearch";
import RideConfirmCard from "@/components/RideConfirmCard";
import SearchingDriver from "@/components/SearchingDriver";
import RideStatusCard from "@/components/RideStatusCard";
import RideComplete from "@/components/RideComplete";
import HistoryScreen from "@/components/HistoryScreen";
import ProfileScreen from "@/components/ProfileScreen";

type AppScreen =
  | "home"
  | "search"
  | "confirm"
  | "searching"
  | "accepted"
  | "arriving"
  | "arrived"
  | "in_progress"
  | "complete";

const rideStatusFlow: AppScreen[] = ["accepted", "arriving", "arrived", "in_progress"];

const Index = () => {
  const [screen, setScreen] = useState<AppScreen>("home");
  const [activeTab, setActiveTab] = useState<"home" | "history" | "profile">("home");
  const [destination, setDestination] = useState<string>("");
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Get real user geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        // Fallback to Manaus center
        setUserLocation({ lat: -3.119, lng: -60.022 });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleDestinationSelect = useCallback((dest: string, coords?: { lat: number; lng: number }) => {
    setDestination(dest);
    if (coords) setDropoffCoords(coords);
    setScreen("confirm");
  }, []);

  const handleConfirmRide = useCallback(() => {
    setScreen("searching");
  }, []);

  const handleDriverFound = useCallback(() => {
    setScreen("accepted");
  }, []);

  const handleAdvanceStatus = useCallback(() => {
    setScreen((prev) => {
      const idx = rideStatusFlow.indexOf(prev);
      if (idx >= 0 && idx < rideStatusFlow.length - 1) {
        return rideStatusFlow[idx + 1];
      }
      return prev;
    });
  }, []);

  const handleCompleteRide = useCallback(() => {
    setScreen("complete");
  }, []);

  const handleReset = useCallback(() => {
    setScreen("home");
    setDestination("");
    setDropoffCoords(null);
    setActiveTab("home");
  }, []);

  const handleTabChange = useCallback((tab: "home" | "history" | "profile") => {
    setActiveTab(tab);
    if (tab === "home") {
      setScreen("home");
      setDestination("");
    }
  }, []);

  const isRideActive = ["confirm", "searching", "accepted", "arriving", "arrived", "in_progress"].includes(screen);
  const showRoute = ["confirm", "accepted", "arriving", "arrived", "in_progress"].includes(screen);
  const isSearching = screen === "searching";
  const showDriver = ["accepted", "arriving", "arrived", "in_progress"].includes(screen);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      {/* Map */}
      <MapView
        showRoute={showRoute}
        searching={isSearching}
        driverLocation={showDriver ? { lat: (userLocation?.lat ?? -3.119) + 0.004, lng: (userLocation?.lng ?? -60.022) + 0.004 } : undefined}
        pickupLocation={userLocation ?? { lat: -3.119, lng: -60.022 }}
        dropoffLocation={{ lat: (userLocation?.lat ?? -3.119) + 0.024, lng: (userLocation?.lng ?? -60.022) + 0.017 }}
      />

      {/* Logo */}
      <div className="absolute left-4 top-4 z-30">
        <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-foreground">
          CELERI
        </h1>
      </div>

      {/* Main screens */}
      <AnimatePresence mode="wait">
        {screen === "home" && activeTab === "home" && (
          <WhereToInput key="where-to" onFocus={() => setScreen("search")} />
        )}

        {screen === "search" && (
          <DestinationSearch
            key="search"
            onBack={() => setScreen("home")}
            onSelect={handleDestinationSelect}
          />
        )}

        {screen === "confirm" && (
          <RideConfirmCard
            key="confirm"
            destination={destination}
            onConfirm={handleConfirmRide}
            onCancel={handleReset}
          />
        )}

        {screen === "searching" && (
          <SearchingDriver key="searching" onFound={handleDriverFound} />
        )}

        {(screen === "accepted" || screen === "arriving" || screen === "arrived" || screen === "in_progress") && (
          <RideStatusCard
            key="ride-status"
            status={screen}
            onAdvance={handleAdvanceStatus}
            onComplete={handleCompleteRide}
          />
        )}

        {screen === "complete" && (
          <RideComplete key="complete" onClose={handleReset} />
        )}
      </AnimatePresence>

      {/* Overlay screens */}
      <AnimatePresence>
        {activeTab === "history" && (
          <HistoryScreen key="history" onBack={() => setActiveTab("home")} />
        )}
        {activeTab === "profile" && (
          <ProfileScreen key="profile" onBack={() => setActiveTab("home")} />
        )}
      </AnimatePresence>

      {/* Bottom Nav */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default Index;
