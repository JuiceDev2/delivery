// Calcula la distancia en línea recta entre dos coordenadas (fórmula de Haversine)
export function calcularDistanciaKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Convierte distancia total vs. distancia actual en % de avance (0 = acaba de salir, 100 = llegó)
export function calcularPorcentajeAvance(
  distanciaTotalKm: number,
  distanciaActualKm: number
): number {
  if (distanciaTotalKm <= 0) return 100;
  const avance = 100 - (distanciaActualKm / distanciaTotalKm) * 100;
  return Math.min(100, Math.max(0, avance));
}
