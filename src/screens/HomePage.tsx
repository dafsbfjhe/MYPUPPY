// Cloudflare build trigger: Optimized Geolocation reliability and performance.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { watchPosition, clearWatch, getCurrentPosition } from '../utils/geolocation';
import { calculateDistance } from '../utils/distance';
import WalkControlCard from '../components/WalkControlCard';
import './HomePage.css';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const HomePage: React.FC = () => {
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  
  // 산책 상태 관리
  const [isWalking, setIsWalking] = useState(false);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [route, setRoute] = useState<{ lat: number; lng: number }[]>([]);
  
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const isWalkingRef = useRef(false); // useCallback 내부에서 최신 상태 참조를 위해 사용

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    mapIds: [import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || ''], 
  });

  // isWalking 상태가 변할 때마다 Ref 업데이트 (useCallback 의존성 제거용)
  useEffect(() => {
    isWalkingRef.current = isWalking;
  }, [isWalking]);

  // 위치 추적 및 경로 업데이트 로직 (안정성 강화)
  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude } = position.coords;
    const newPoint = { lat: latitude, lng: longitude };
    
    setCurrentPosition(newPoint);
    setGeoError(null); // 성공 시 에러 초기화

    if (isWalkingRef.current) {
      setRoute(prev => {
        if (prev.length > 0) {
          const lastPoint = prev[prev.length - 1];
          const dist = calculateDistance(lastPoint, newPoint);
          if (dist < 3) return prev; // 3m 미만 이동 무시 (노이즈 제거)
          
          setDistance(d => d + dist);
        }
        return [...prev, newPoint];
      });
    }
  }, []);

  const handleGeoError = useCallback((error: GeolocationPositionError) => {
    console.error("Geolocation error: ", error);
    let message = "위치 정보를 가져올 수 없습니다.";
    if (error.code === 1) message = "위치 권한이 거부되었습니다. 설정에서 허용해 주세요.";
    else if (error.code === 3) message = "위치 신호가 약합니다. 실외로 이동해 보세요.";
    setGeoError(message);
  }, []);

  useEffect(() => {
    // 1. 초기 위치를 빠르게 한 번 가져오기 (UX 개선)
    getCurrentPosition(handlePositionUpdate, handleGeoError);

    // 2. 실시간 위치 추적 시작
    watchIdRef.current = watchPosition(handlePositionUpdate, handleGeoError);

    return () => {
      if (watchIdRef.current !== null) clearWatch(watchIdRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [handlePositionUpdate, handleGeoError]);

  // 타이머 제어
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
                strokeColor: '#5A3E2B',
                strokeOpacity: 1.0,
                strokeWeight: 6,
                geodesic: true,
              }}
            />
          )}
        </GoogleMap>
      ) : (
        <div className="loading-map">
          {geoError ? (
            <div className="geo-error-msg">
              <p>{geoError}</p>
              <button onClick={() => window.location.reload()}>다시 시도</button>
            </div>
          ) : (
            "위치 정보를 가져오는 중..."
          )}
        </div>
      )}
      
      {!isWalking ? (
        <button 
          className="btn-start-walk" 
          onClick={handleStartWalk}
          disabled={!currentPosition}
        >
          {currentPosition ? "산책 시작하기" : "위치 파악 중..."}
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
