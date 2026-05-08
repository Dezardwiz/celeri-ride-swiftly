import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MapView from "@/components/MapView";
import { MapPin, Navigation, Star, User, Loader2, ShieldCheck } from "lucide-react";
import geleriLogo from "@/assets/geleri-logo.jpeg";

interface SharedRide {
  id: string;
  status: string;
  closed?: boolean;
  origin_address?: string;
  destination_address?: string;
  origin_lat?: number;
  origin_lng?: number;
  destination_lat?: number;
  destination_lng?: number;
  driver?: {
    name: string;
    plate: string;
    moto_model: string;
    photo_url: string | null;
    rating: number;
    lat: number | null;
    lng: number | null;
  } | null;
}

const STATUS_LABEL: Record<string, string> = {
  ACCEPTED: "Mototaxista a caminho",
  ARRIVING: "Aproximando-se",
  ARRIVED: "Mototaxista no local",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Corrida finalizada",
  CANCELED: "Corrida cancelada",
};

const SharedRide = () => {
  const { rideId } = useParams<{ rideId: string }>();
  const [data, setData] = useState<SharedRide | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!rideId) return;
    let active = true;
    const fetchData = async () => {
      const { data: res, error } = await supabase.rpc("get_shared_ride", { _ride_id: rideId });
      if (!active) return;
      if (error || !res) { setNotFound(true); setLoading(false); return; }
      setData(res as any);
      setLoading(false);
    };
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => { active = false; clearInterval(interval); };
  }, [rideId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center">
        <div>
          <p className="font-display text-lg">Link inválido</p>
          <p className="text-sm text-muted-foreground mt-2">Esta corrida não está disponível.</p>
        </div>
      </div>
    );
  }

  const isClosed = data.closed || ["COMPLETED", "CANCELED"].includes(data.status);

  return (
    <div className="relative min-h-screen w-full bg-background">
      <div className="relative h-[60vh] w-full">
        <MapView
          showRoute={!isClosed}
          driverLocation={data.driver?.lat && data.driver?.lng ? { lat: data.driver.lat, lng: data.driver.lng } : undefined}
          pickupLocation={data.origin_lat && data.origin_lng ? { lat: data.origin_lat, lng: data.origin_lng } : undefined}
          dropoffLocation={data.destination_lat && data.destination_lng ? { lat: data.destination_lat, lng: data.destination_lng } : undefined}
        />
        <div className="absolute left-4 top-4 z-30 flex items-center gap-2 rounded-lg bg-background/90 px-3 py-2 backdrop-blur-sm">
          <img src={geleriLogo} alt="Celeri" className="h-6 w-6 rounded" />
          <span className="font-display text-sm font-bold uppercase tracking-widest">CELERI</span>
        </div>
      </div>

      <div className="relative z-10 -mt-8 rounded-t-3xl border-t border-border bg-background p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-primary" />
          <span className="font-display text-xs uppercase tracking-wider text-primary">{STATUS_LABEL[data.status] ?? data.status}</span>
        </div>

        {isClosed ? (
          <p className="text-sm text-muted-foreground">A viagem foi encerrada. Este link não exibe mais a localização ao vivo.</p>
        ) : (
          <>
            {data.driver && (
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                {data.driver.photo_url ? (
                  <img src={data.driver.photo_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{data.driver.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Star size={10} className="fill-warning text-warning" />
                    <span>{(data.driver.rating ?? 0).toFixed(1)}</span>
                    <span>·</span>
                    <span className="truncate">{data.driver.moto_model}</span>
                  </div>
                  <p className="text-xs font-medium mt-0.5">{data.driver.plate}</p>
                </div>
              </div>
            )}

            <div className="space-y-3 rounded-lg border border-border p-3">
              <div className="flex items-start gap-3">
                <Navigation size={14} className="mt-0.5 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Origem</p>
                  <p className="text-sm truncate">{data.origin_address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={14} className="mt-0.5 text-destructive" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Destino</p>
                  <p className="text-sm truncate">{data.destination_address}</p>
                </div>
              </div>
            </div>
          </>
        )}

        <p className="pt-4 text-center text-[11px] text-muted-foreground">
          Acompanhamento em tempo real via Celeri · desenvolvido por payn
        </p>
      </div>
    </div>
  );
};

export default SharedRide;