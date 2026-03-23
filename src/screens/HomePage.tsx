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
  });

  // 위치 추적 및 경로 업데이트 로직
  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude } = position.coords;
    const newPoint = { lat: latitude, lng: longitude };
    
    setCurrentPosition(newPoint);

    if (isWalking) {
      setRoute(prev => {
        // 중복 위치 업데이트 방지 (최소 2m 이상 이동 시 추가)
        if (prev.length > 0) {
          const lastPoint = prev[prev.length - 1];
          const dist = calculateDistance(lastPoint, newPoint);
          if (dist < 2) return prev;
          
          setDistance(d => d + dist);
        }
        return [...prev, newPoint];
      });
    }
  }, [isWalking]);

  useEffect(() => {
    // 앱 진입 시 기본 위치 추적 시작
    watchIdRef.current = watchPosition(
      handlePositionUpdate,
      (error) => console.error("Geolocation error: ", error)
    );

    return () => {
      if (watchIdRef.current !== null) clearWatch(watchIdRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [handlePositionUpdate]);

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
    // TODO: Firestore 저장 로직 연결 지점
    alert(`산책 종료!\n총 거리: ${(distance / 1000).toFixed(2)}km\n시간: ${Math.floor(duration / 60)}분 ${duration % 60}초`);
    
    // 산책 완료 후 데이터 초기화 (필요시 상세 페이지로 이동)
    // navigate('/walk-summary', { state: { distance, duration, route } });
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
          }}
        >
          {/* 사용자/강아지 커스텀 마커 */}
          <Marker 
            position={currentPosition} 
            icon={{
              // TODO: 실제 강아지 캐릭터 이미지 경로로 교체하세요.
              url: 'https://cdn-icons-png.flaticon.com/512/616/616408.png', 
              scaledSize: new window.google.maps.Size(45, 45),
              anchor: new window.google.maps.Point(22, 22)
            }}
          />

          {/* 산책 경로 표시 */}
          {isWalking && (
            <Polyline
              path={route}
              options={{
                strokeColor: '#FF8A65',
                strokeOpacity: 0.8,
                strokeWeight: 6,
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
