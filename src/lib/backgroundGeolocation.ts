import { Capacitor, registerPlugin } from "@capacitor/core";

/**
 * Background Geolocation wrapper.
 *
 * Uses @capacitor-community/background-geolocation on native platforms to
 * keep tracking the driver even when the app is in background / screen off:
 *   - Android: starts a foreground service with a persistent notification
 *   - iOS: enables background location updates (requires "Always" permission
 *     and the `location` UIBackgroundMode, configured in Xcode by the user)
 *
 * On web, this is a no-op — the foreground `watchPosition` in
 * `src/lib/geolocation.ts` keeps working while the tab is visible.
 */

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  time: number;
}

interface WatcherOptions {
  backgroundMessage?: string;
  backgroundTitle?: string;
  requestPermissions?: boolean;
  stale?: boolean;
  distanceFilter?: number;
}

interface BackgroundGeolocationPlugin {
  addWatcher(
    options: WatcherOptions,
    callback: (location: Location | null, error?: { code: string; message: string }) => void
  ): Promise<string>;
  removeWatcher(options: { id: string }): Promise<void>;
  openSettings(): Promise<void>;
}

const BackgroundGeolocation =
  Capacitor.isNativePlatform()
    ? registerPlugin<BackgroundGeolocationPlugin>("BackgroundGeolocation")
    : null;

let watcherId: string | null = null;

export async function startBackgroundTracking(
  onUpdate: (pos: { lat: number; lng: number }) => void
): Promise<void> {
  if (!BackgroundGeolocation) return; // web no-op
  if (watcherId) return; // already running

  try {
    watcherId = await BackgroundGeolocation.addWatcher(
      {
        backgroundTitle: "CELERI ativo",
        backgroundMessage: "Compartilhando localização para receber corridas",
        requestPermissions: true,
        stale: false,
        distanceFilter: 25, // meters between updates
      },
      (location, error) => {
        if (error) {
          // eslint-disable-next-line no-console
          console.warn("[bg-geo]", error.code, error.message);
          return;
        }
        if (location) {
          onUpdate({ lat: location.latitude, lng: location.longitude });
        }
      }
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[bg-geo] failed to start", e);
  }
}

export async function stopBackgroundTracking(): Promise<void> {
  if (!BackgroundGeolocation || !watcherId) return;
  try {
    await BackgroundGeolocation.removeWatcher({ id: watcherId });
  } catch {
    // ignore
  }
  watcherId = null;
}

export function isBackgroundTrackingActive(): boolean {
  return watcherId !== null;
}