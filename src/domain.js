export const REPORT_STALE_AFTER_MS = 60 * 60 * 1000;
export const REPORT_COOLDOWN_MS = 15 * 60 * 1000;

export function freshness(timestamp, now = Date.now()) {
  if (!timestamp) return { label: 'No report yet', stale: false, unknown: true };
  const age = Math.max(0, now - new Date(timestamp).getTime());
  const minutes = Math.floor(age / 60_000);
  if (age >= REPORT_STALE_AFTER_MS) {
    const hours = Math.floor(minutes / 60);
    return { label: `Last report ${hours}h ago · Stale`, stale: true, unknown: false };
  }
  if (minutes < 1) return { label: 'Just now', stale: false, unknown: false };
  return { label: `${minutes}m ago`, stale: false, unknown: false };
}

export function busynessLabel(value) {
  if (value === null || value === undefined) return 'No crowd report';
  return ['Empty', 'Mostly open', 'Some people', 'Busy', 'Packed'][value - 1] ?? 'No crowd report';
}

export function noiseLabel(value) {
  if (value === null || value === undefined) return 'Noise unknown';
  return ['Quiet', 'Soft', 'Conversational', 'Lively', 'Very loud'][value - 1] ?? 'Noise unknown';
}

export function distanceKm(from, to) {
  if (!from || !to) return null;
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const [lat1, lon1] = from.map(radians);
  const [lat2, lon2] = to.map(radians);
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getMatchingFloors(spot, filters) {
  const query = filters.query.trim().toLocaleLowerCase();
  const matchesQuery = !query || [spot.name, spot.building, spot.description, spot.area, ...spot.floors.flatMap((item) => [item.label, item.area, item.detail, ...item.amenities])]
    .filter(Boolean).some((value) => value.toLocaleLowerCase().includes(query));
  if (!matchesQuery) return [];

  return spot.floors.filter((item) => {
    if (filters.busyness < 5 && (item.busyness === null || item.busyness > filters.busyness)) return false;
    if (filters.noise < 5 && (item.noise === null || item.noise > filters.noise)) return false;
    if (filters.group !== 'any' && !item.groups.includes(filters.group)) return false;
    if (filters.outlets && !item.outlets) return false;
    if (!filters.amenities.every((amenity) => item.amenities.includes(amenity))) return false;
    return true;
  });
}

export function getVisibleSpots(spots, filters, options = {}) {
  const { tab = 'study', sortByDistance = false, userCoordinates = null } = options;
  return spots.flatMap((spot) => {
    if (tab === 'community' && !spot.community) return [];
    if (tab === 'study' && spot.community) return [];
    if (tab === 'study' && filters.category !== 'all' && spot.category !== filters.category) return [];
    if (tab === 'community' && filters.category !== 'all' && spot.category !== filters.category) return [];
    const matchingFloors = getMatchingFloors(spot, filters);
    if (!matchingFloors.length) return [];
    const bestFreshness = Math.min(...matchingFloors.map((item) => item.updatedAt ? Date.now() - new Date(item.updatedAt).getTime() : Infinity));
    const distance = userCoordinates ? distanceKm(userCoordinates, spot.coordinates) : null;
    const bestBusyness = Math.min(...matchingFloors.map((item) => item.busyness ?? 6));
    return [{ spot, matchingFloors, distance, bestFreshness, bestBusyness }];
  }).sort((a, b) => {
    if (sortByDistance && a.distance !== null && b.distance !== null) return a.distance - b.distance;
    if (a.bestBusyness !== b.bestBusyness) return a.bestBusyness - b.bestBusyness;
    return a.bestFreshness - b.bestFreshness;
  });
}

export function formatDistance(km) {
  if (km === null || km === undefined) return '';
  const meters = Math.round(km * 1000);
  return meters < 1000 ? `≈ ${Math.round(meters / 50) * 50} m away` : `≈ ${km.toFixed(1)} km away`;
}
