import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

export interface GeoPosition {
  lat: number;
  lng: number;
}

/**
 * Request location permissions (native only).
 * On web, permissions are handled by the browser automatically.
 */
export async function requestLocationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;
  try {
    let status = await Geolocation.checkPermissions();
    if (status.location === "denied") return false;
    if (status.location === "prompt" || status.location === "prompt-with-rationale") {
      status = await Geolocation.requestPermissions();
    }
    return status.location === "granted";
  } catch {
    return false;
  }
}

/**
 * Get current position using native or web API.
 */
export async function getCurrentPosition(): Promise<GeoPosition | null> {
  try {
    if (Capacitor.isNativePlatform()) {
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    }
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true }
      );
    });
  } catch {
    return null;
  }
}

/**
 * Watch position continuously. Returns a cleanup function.
 */
export function watchPosition(
  onUpdate: (pos: GeoPosition) => void,
  onError?: () => void
): () => void {
  if (Capacitor.isNativePlatform()) {
    let watchId: string | null = null;
    Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 15000 },
      (position, err) => {
        if (err || !position) { onError?.(); return; }
        onUpdate({ lat: position.coords.latitude, lng: position.coords.longitude });
      }
    ).then((id) => { watchId = id; });
    return () => { if (watchId) Geolocation.clearWatch({ id: watchId }); };
  }

  // Web fallback
  if (!navigator.geolocation) return () => {};
  const id = navigator.geolocation.watchPosition(
    (p) => onUpdate({ lat: p.coords.latitude, lng: p.coords.longitude }),
    () => onError?.(),
    { enableHighAccuracy: true, maximumAge: 10000 }
  );
  return () => navigator.geolocation.clearWatch(id);
}
