import React from 'react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './Map.css';

interface MapProps {
  route: { lat: number; lng: number }[];
}

const Map: React.FC<MapProps> = ({ route }) => {
  if (route.length === 0) {
    return <div>No route data available.</div>;
  }

  const center: [number, number] = [route[0].lat, route[0].lng];

  return (
    <MapContainer center={center} zoom={15} className="map-container">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Polyline positions={route.map(p => [p.lat, p.lng])} color="blue" />
    </MapContainer>
  );
};

export default Map;
