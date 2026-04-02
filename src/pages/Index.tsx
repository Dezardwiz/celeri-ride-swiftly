import { useState, useCallback, useEffect } from "react";
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
import { useRide, useActiveTariff, calculatePrice } from "@/hooks/useRide";
import { MONTES_CLAROS } from "@/lib/geo";
import { toast } from "sonner";
import geleriLogo from "@/assets/geleri-logo.jpeg";

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

// Haversine distance in km
function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

const Index = () => {
  const [screen, setScreen] = useState<AppScreen>("home");
  const [activeTab, setActiveTab] = useState<"home" | "history" | "profile">("home");
  const [destination, setDestination] = useState("");
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const tariff = useActiveTariff();
  const ride = useRide();

  // Estimated values
  const distanceKm = userLocation && dropoffCoords ? haversine(userLocation, dropoffCoords) * 1.3 : 0; // 1.3 road factor
  const durationMin = Math.max(Math.round((distanceKm / 30) * 60), 1); // ~30km/h avg
  const price = calculatePrice(tariff, distanceKm, durationMin);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation(MONTES_CLAROS.center),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleDestinationSelect = useCallback((dest: string, coords?: { lat: number; lng: number }) => {
    setDestination(dest);
    if (coords) setDropoffCoords(coords);
    setScreen("confirm");
  }, []);

  const handleConfirmRide = useCallback(async () => {
    if (!userLocation || !dropoffCoords) return;
    const created = await ride.createRide({
      originAddress: "Sua localização",
      originLat: userLocation.lat,
      originLng: userLocation.lng,
      destinationAddress: destination,
      destinationLat: dropoffCoords.lat,
      destinationLng: dropoffCoords.lng,
      estimatedDistanceKm: parseFloat(distanceKm.toFixed(2)),
      estimatedDurationMin: durationMin,
      estimatedPrice: parseFloat(price.toFixed(2)),
    });
    if (created) {
      setScreen("searching");
      toast.success("Corrida solicitada!");
    } else {
      toast.error("Erro ao solicitar corrida");
    }
  }, [userLocation, dropoffCoords, destination, distanceKm, durationMin, price, ride]);

  const handleDriverFound = useCallback(() => setScreen("accepted"), []);

  const handleAdvanceStatus = useCallback(() => {
    setScreen((prev) => {
      const idx = rideStatusFlow.indexOf(prev);
      return idx >= 0 && idx < rideStatusFlow.length - 1 ? rideStatusFlow[idx + 1] : prev;
    });
  }, []);

  const handleCompleteRide = useCallback(() => setScreen("complete"), []);

  const handleRideSubmit = useCallback(
    async (payment: "pix" | "card" | "cash", rating: number) => {
      await ride.completeRide(parseFloat(price.toFixed(2)));
      await ride.savePayment(payment, parseFloat(price.toFixed(2)));
      if (rating > 0) await ride.saveRating(rating);
    },
    [ride, price]
  );

  const handleReset = useCallback(() => {
    setScreen("home");
    setDestination("");
    setDropoffCoords(null);
    setActiveTab("home");
    ride.resetRide();
  }, [ride]);

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
      <MapView
        showRoute={showRoute}
        searching={isSearching}
        driverLocation={showDriver ? { lat: (userLocation?.lat ?? MONTES_CLAROS.center.lat) + 0.004, lng: (userLocation?.lng ?? MONTES_CLAROS.center.lng) + 0.004 } : undefined}
        pickupLocation={userLocation ?? MONTES_CLAROS.center}
        dropoffLocation={dropoffCoords ?? { lat: (userLocation?.lat ?? MONTES_CLAROS.center.lat) + 0.015, lng: (userLocation?.lng ?? MONTES_CLAROS.center.lng) + 0.01 }}
      />

      <div className="absolute left-4 top-4 z-30 flex items-center gap-2">
        <img src={geleriLogo} alt="Celeri" className="h-9 w-9 rounded-lg" />
        <h1 className="font-display text-xl font-bold uppercase tracking-widest text-foreground">CELERI</h1>
      </div>

      <AnimatePresence mode="wait">
        {screen === "home" && activeTab === "home" && (
          <WhereToInput key="where-to" onFocus={() => setScreen("search")} />
        )}
        {screen === "search" && (
          <DestinationSearch key="search" onBack={() => setScreen("home")} onSelect={handleDestinationSelect} userLocation={userLocation} />
        )}
        {screen === "confirm" && (
          <RideConfirmCard
            key="confirm"
            destination={destination}
            estimatedPrice={price}
            estimatedTime={durationMin}
            estimatedDistance={distanceKm}
            loading={ride.loading}
            onConfirm={handleConfirmRide}
            onCancel={handleReset}
          />
        )}
        {screen === "searching" && <SearchingDriver key="searching" onFound={handleDriverFound} />}
        {(screen === "accepted" || screen === "arriving" || screen === "arrived" || screen === "in_progress") && (
          <RideStatusCard key="ride-status" status={screen} onAdvance={handleAdvanceStatus} onComplete={handleCompleteRide} />
        )}
        {screen === "complete" && (
          <RideComplete
            key="complete"
            price={price}
            distanceKm={distanceKm}
            durationMin={durationMin}
            onSubmit={handleRideSubmit}
            onClose={handleReset}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeTab === "history" && <HistoryScreen key="history" onBack={() => setActiveTab("home")} />}
        {activeTab === "profile" && <ProfileScreen key="profile" onBack={() => setActiveTab("home")} />}
      </AnimatePresence>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default Index;
