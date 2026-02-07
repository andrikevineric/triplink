import * as THREE from 'three';

const GLOBE_RADIUS = 1;

/**
 * Convert latitude/longitude to 3D position on a sphere
 * Uses standard geographic coordinate system aligned with three-globe textures
 */
export function latLngToVector3(
  lat: number,
  lng: number,
  altitude: number = 0
): THREE.Vector3 {
  // Convert to radians
  const latRad = lat * (Math.PI / 180);
  const lngRad = -lng * (Math.PI / 180); // Negative for correct east/west

  const r = GLOBE_RADIUS + altitude;

  // Spherical to Cartesian conversion
  const x = r * Math.cos(latRad) * Math.cos(lngRad);
  const y = r * Math.sin(latRad);
  const z = r * Math.cos(latRad) * Math.sin(lngRad);

  return new THREE.Vector3(x, y, z);
}

/**
 * Calculate the midpoint between two lat/lng positions, lifted off the surface
 * for creating curved arcs
 */
export function getArcMidpoint(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): THREE.Vector3 {
  const startVec = latLngToVector3(from.lat, from.lng);
  const endVec = latLngToVector3(to.lat, to.lng);

  // Midpoint on the surface
  const midVec = startVec.clone().add(endVec).multiplyScalar(0.5);

  // Lift it off the surface based on distance
  const distance = startVec.distanceTo(endVec);
  const altitude = Math.min(distance * 0.5, 0.4); // Cap arc height
  midVec.normalize().multiplyScalar(GLOBE_RADIUS + altitude);

  return midVec;
}

/**
 * Generate a random pleasing color for trips
 */
export function generateTripColor(): string {
  const colors = [
    '#3B82F6', // blue
    '#10B981', // emerald
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#F97316', // orange
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString()} km`;
}
