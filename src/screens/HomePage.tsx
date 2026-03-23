import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { watchPosition, clearWatch } from '../utils/geolocation';
import { calculateDistance } from '../utils/distance';
import WalkControlCard from '../components/WalkControlCard';
import './HomePage.css';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const HomePage: React.FC = () => {
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  
  // 산책 상태 관리
  const [isWalking, setIsWalking] = useState(false);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [route, setRoute] = useState<{ lat: number; lng: number }[]>([]);
  
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    // Google Cloud Console에서 생성한 Map ID를 여기에 넣으세요.
    // .env 파일에 VITE_GOOGLE_MAPS_MAP_ID로 관리하는 것을 추천합니다.
    mapIds: [import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || ''], 
  });

  // 위치 추적 및 경로 업데이트 로직
  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude } = position.coords;
    const newPoint = { lat: latitude, lng: longitude };
    
    setCurrentPosition(newPoint);

    if (isWalking) {
      setRoute(prev => {
        if (prev.length > 0) {
          const lastPoint = prev[prev.length - 1];
          const dist = calculateDistance(lastPoint, newPoint);
          if (dist < 3) return prev; // 3m 미만 이동 무시 (경로 부드럽게 처리)
          
          setDistance(d => d + dist);
        }
        return [...prev, newPoint];
      });
    }
  }, [isWalking]);

  useEffect(() => {
    watchIdRef.current = watchPosition(
      handlePositionUpdate,
      (error) => console.error("Geolocation error: ", error)
    );

    return () => {
      if (watchIdRef.current !== null) clearWatch(watchIdRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [handlePositionUpdate]);

  useEffect(() => {
    if (isWalking) {
      timerRef.current = window.setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isWalking]);

  const handleStartWalk = () => {
    setIsWalking(true);
    setDistance(0);
    setDuration(0);
    if (currentPosition) {
      setRoute([currentPosition]);
    }
  };

  const handleEndWalk = () => {
    setIsWalking(false);
    alert(`산책 종료!\n거리: ${(distance / 1000).toFixed(2)}km\n시간: ${Math.floor(duration / 60)}분 ${duration % 60}초`);
    setRoute([]);
    setDistance(0);
    setDuration(0);
  };

  if (loadError) return <div>Error loading maps: {loadError.message}</div>;
  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div className="home-page">
      {currentPosition ? (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={currentPosition}
          zoom={17}
          options={{
            disableDefaultUI: true,
            zoomControl: false,
            // Map ID를 적용하여 클라우드 스타일을 불러옵니다.
            mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
          }}
        >
          <Marker 
            position={currentPosition} 
            icon={{
              url: 'https://cdn-icons-png.flaticon.com/512/616/616408.png', 
              scaledSize: new window.google.maps.Size(48, 48),
              anchor: new window.google.maps.Point(24, 24)
            }}
          />

          {isWalking && (
            <Polyline
              path={route}
              options={{
                strokeColor: '#5A3E2B', // 진한 갈색
                strokeOpacity: 1.0,
                strokeWeight: 6, // 명확한 두께
                geodesic: true,
              }}
            />
          )}
        </GoogleMap>
      ) : (
        <div className="loading-map">위치 정보를 가져오는 중...</div>
      )}
      
      {!isWalking ? (
        <button className="btn-start-walk" onClick={handleStartWalk}>
          산책 시작하기
        </button>
      ) : (
        <WalkControlCard 
          distance={distance} 
          duration={duration} 
          onEnd={handleEndWalk} 
        />
      )}
    </div>
  );
};

export default HomePage;
