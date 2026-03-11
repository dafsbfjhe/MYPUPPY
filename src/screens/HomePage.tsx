import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { watchPosition, clearWatch } from '../utils/geolocation';
import './HomePage.css';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // TODO: Replace with your Google Maps API Key.
  // It's recommended to load this from an environment variable (e.g., process.env.REACT_APP_GOOGLE_MAPS_API_KEY)
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY, 
  });

  useEffect(() => {
    // Start watching position when component mounts
    watchIdRef.current = watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentPosition({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error("Geolocation error: ", error);
        alert("Unable to retrieve your location. Please enable location services.");
      }
    );

    // Clear watch when component unmounts
    return () => {
      if (watchIdRef.current !== null) {
        clearWatch(watchIdRef.current);
      }
    };
  }, []);

  if (loadError) {
    return <div>Error loading maps: {loadError.message}</div>;
  }

  if (!isLoaded) {
    return <div>Loading Map...</div>;
  }

  const handleStartWalk = () => {
    navigate('/walk');
  };

  return (
    <div className="home-page">
      {currentPosition ? (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={currentPosition}
          zoom={15}
        >
          <Marker position={currentPosition} />
        </GoogleMap>
      ) : (
        <div className="loading-map">Getting your location...</div>
      )}
      
      <button className="btn-start-walk" onClick={handleStartWalk}>
        Start Walk
      </button>
    </div>
  );
};

export default HomePage;
