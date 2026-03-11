import haversine from 'haversine-distance';

interface Coord {
  lat: number;
  lng: number;
}

export const calculateDistance = (point1: Coord, point2: Coord): number => {
  const a = { latitude: point1.lat, longitude: point1.lng };
  const b = { latitude: point2.lat, longitude: point2.lng };
  return haversine(a, b); // Returns distance in meters
};
