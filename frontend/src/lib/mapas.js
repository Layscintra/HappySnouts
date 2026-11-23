export const CHAVE_MAPS = (import.meta.env.VITE_GOOGLE_MAPS_KEY || "").trim();

// Map ID de demonstração do Google: libera os marcadores personalizados (AdvancedMarker)
export const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

const RAIO_TERRA = 6371000; // metros
const rad = g => (g * Math.PI) / 180;

export function metrosEntre(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RAIO_TERRA * Math.asin(Math.sqrt(h));
}

export const kmDoTrajeto = pts => pts.reduce((s, p, i) => (i ? s + metrosEntre(pts[i - 1], p) : 0), 0) / 1000;

export const entre = (a, b, t) => ({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t });
