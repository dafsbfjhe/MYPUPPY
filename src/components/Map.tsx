import React from 'react';
import { GoogleMap, useJsApiLoader, Polyline } from '@react-google-maps/api';
import './Map.css';

interface MapProps {
  route: { lat: number; lng: number }[];
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

const Map: React.FC<MapProps> = ({ route }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  if (loadError) {
    return <div>Error loading maps: {loadError.message}</div>;
  }

  if (!isLoaded) {
    return <div>Loading Map...</div>;
  }

  if (route.length === 0) {
    return <div>No route data available.</div>;
  }

  const center = { lat: route[0].lat, lng: route[0].lng };

  return (
    <div className="map-container">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={15}
      >
        <Polyline
          path={route}
          options={{
            strokeColor: '#3B82F6',
            strokeOpacity: 0.8,
            strokeWeight: 4,
          }}
        />
      </GoogleMap>
    </div>
  );
};

export default Map;
