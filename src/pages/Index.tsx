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
import WalletScreen from "@/components/WalletScreen";
import { useRide, useActiveTariff, calculatePrice } from "@/hooks/useRide";
import { MONTES_CLAROS } from "@/lib/geo";
import { toast } from "sonner";
import geleriLogo from "@/assets/geleri-logo.jpeg";
import CancellationDialog from "@/components/CancellationDialog";
import { useCancellationSettings, estimateCancellationFee, cancelRideRpc } from "@/hooks/useCancellation";

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
  const [activeTab, setActiveTab] = useState<"home" | "history" | "wallet" | "profile">("home");
  const [destination, setDestination] = useState("");
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const tariff = useActiveTariff();
  const ride = useRide();
  const settings = useCancellationSettings();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);

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
    async (payment: "pix" | "card" | "cash" | "wallet", rating: number) => {
      await ride.completeRide(parseFloat(price.toFixed(2)));
      await ride.savePayment(payment === "wallet" ? "pix" : payment, parseFloat(price.toFixed(2)));
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

  const requestCancel = useCallback(() => {
    if (ride.currentRide) setCancelOpen(true);
    else handleReset();
  }, [ride.currentRide, handleReset]);

  const confirmCancel = useCallback(
    async (reason: string) => {
      if (!ride.currentRide) return;
      setCanceling(true);
      try {
        const res = await cancelRideRpc(ride.currentRide.id, "passenger", reason);
        if (res?.fee && res.fee > 0) {
          toast.warning(`Corrida cancelada — taxa de R$ ${res.fee.toFixed(2)} aplicada`);
        } else {
          toast.info("Corrida cancelada");
        }
        setCancelOpen(false);
        handleReset();
      } catch (e: any) {
        toast.error(e.message ?? "Erro ao cancelar");
      } finally {
        setCanceling(false);
      }
    },
    [ride.currentRide, handleReset]
  );

  const handleTabChange = useCallback((tab: "home" | "history" | "wallet" | "profile") => {
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
          <RideStatusCard key="ride-status" status={screen} onAdvance={handleAdvanceStatus} onComplete={handleCompleteRide} onCancel={requestCancel} />
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
        {activeTab === "wallet" && <WalletScreen key="wallet" onBack={() => setActiveTab("home")} />}
        {activeTab === "profile" && <ProfileScreen key="profile" onBack={() => setActiveTab("home")} />}
      </AnimatePresence>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      <CancellationDialog
        open={cancelOpen}
        actor="passenger"
        estimatedFee={estimateCancellationFee(ride.currentRide as any, "passenger", settings)}
        loading={canceling}
        onConfirm={confirmCancel}
        onClose={() => setCancelOpen(false)}
      />
    </div>
  );
};

export default Index;
