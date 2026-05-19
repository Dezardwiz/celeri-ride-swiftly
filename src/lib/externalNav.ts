// External navigation deep links (Waze / Google Maps)
import { Capacitor } from "@capacitor/core";

export type NavApp = "waze" | "google" | "auto";

export function openExternalNavigation(lat: number, lng: number, app: NavApp = "auto") {
  const isNative = Capacitor.isNativePlatform?.() ?? false;
  const platform = Capacitor.getPlatform?.() ?? (isNative ? "android" : "web");

  let url = "";
  if (app === "waze") {
    url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
  } else if (app === "google") {
    if (platform === "ios") {
      url = `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`;
    } else {
      url = `google.navigation:q=${lat},${lng}&mode=d`;
    }
  } else {
    // auto: open Google Maps universal link
    url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  }

  if (isNative && app !== "auto") {
    // Try native scheme first, then fallback
    window.location.href = url;
  } else {
    window.open(url, "_blank", "noopener");
  }
}
