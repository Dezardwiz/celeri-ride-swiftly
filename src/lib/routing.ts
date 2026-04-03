// OSRM routing API for real road directions
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

export interface RouteResult {
  coordinates: [number, number][]; // [lat, lng][]
  distanceKm: number;
  durationMin: number;
}

export async function fetchRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<RouteResult | null> {
  try {
    const url = `${OSRM_URL}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.routes?.length) return null;

    const route = data.routes[0];
    // GeoJSON coordinates are [lng, lat], convert to [lat, lng] for Leaflet
    const coordinates: [number, number][] = route.geometry.coordinates.map(
      (c: [number, number]) => [c[1], c[0]]
    );

    return {
      coordinates,
      distanceKm: route.distance / 1000,
      durationMin: Math.round(route.duration / 60),
    };
  } catch {
    return null;
  }
}
