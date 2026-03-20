// Montes Claros, MG - center and bounds
export const MONTES_CLAROS = {
  center: { lat: -16.735, lng: -43.8617 },
  bounds: {
    north: -16.62,
    south: -16.85,
    west: -43.97,
    east: -43.75,
  },
};

export function isWithinMontesclaros(lat: number, lng: number): boolean {
  const { bounds } = MONTES_CLAROS;
  return lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east;
}
