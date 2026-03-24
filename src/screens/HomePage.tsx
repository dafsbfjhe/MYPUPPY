// Cloudflare build trigger: Integrated Walk stats, Streak, and Celebration Overlay.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { watchPosition, clearWatch, getCurrentPosition } from '../utils/geolocation';
import { calculateDistance } from '../utils/distance';
import { useAuth } from '../context/AuthContext';
import { saveWalkRecord, getWeeklyStats } from '../services/walkService';
import WalkControlCard from '../components/WalkControlCard';
import CelebrationOverlay from '../components/CelebrationOverlay';
import FireStreak from '../components/FireStreak';
import './HomePage.css';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  
  // 산책 실시간 상태
  const [isWalking, setIsWalking] = useState(false);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [route, setRoute] = useState<{ lat: number; lng: number }[]>([]);
  
  // 통계 및 오버레이 상태
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [streak, setStreak] = useState<boolean[]>(new Array(7).fill(false));
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastCalories, setLastCalories] = useState(0);

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const isWalkingRef = useRef(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    mapIds: [import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || ''], 
  });

  // 데이터 로드
  const loadStats = useCallback(async () => {
    if (user) {
      const stats = await getWeeklyStats(user.uid);
      setWeeklyCount(stats.totalCount);
      setStreak(stats.streak);
    }
  }, [user]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    isWalkingRef.current = isWalking;
  }, [isWalking]);

  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude } = position.coords;
    const newPoint = { lat: latitude, lng: longitude };
    
    setCurrentPosition(newPoint);
    setGeoError(null);

    if (isWalkingRef.current) {
      setRoute(prev => {
        if (prev.length > 0) {
          const lastPoint = prev[prev.length - 1];
          const dist = calculateDistance(lastPoint, newPoint);
          if (dist < 3) return prev;
          setDistance(d => d + dist);
        }
        return [...prev, newPoint];
      });
    }
  }, []);

  const handleGeoError = useCallback((error: GeolocationPositionError) => {
    console.error("Geolocation error: ", error);
    let message = "위치 정보를 가져올 수 없습니다.";
    if (error.code === 1) message = "위치 권한이 거부되었습니다.";
    else if (error.code === 3) message = "위치 신호가 약합니다.";
    setGeoError(message);
  }, []);

  useEffect(() => {
    getCurrentPosition(handlePositionUpdate, handleGeoError);
    watchIdRef.current = watchPosition(handlePositionUpdate, handleGeoError);
    return () => {
      if (watchIdRef.current !== null) clearWatch(watchIdRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [handlePositionUpdate, handleGeoError]);

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

  const handleEndWalk = async () => {
    if (!user) return;

    // 1. 칼로리 계산 및 보존 (0kcal 버그 방지)
    const currentCalories = (distance / 1000) * 50;
    setLastCalories(currentCalories);
    
    setIsWalking(false);

    if (distance >= 0) {
      try {
        await saveWalkRecord({
          userId: user.uid,
          date: Date.now(),
          duration,
          distance,
          calories: currentCalories,
          route,
        });

        // 2. 통계 즉시 갱신
        await loadStats();

        // 3. 축하 오버레이 조건 (거리 0 이상, 시간 10초 이상)
        if (distance >= 0 && duration >= 10) {
          setShowCelebration(true);
        }
      } catch (e) {
        console.error("Save walk failed:", e);
      }
    }

    setRoute([]);
    setDistance(0);
    setDuration(0);
  };

  if (loadError) return <div>Error loading maps: {loadError.message}</div>;
  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div className="home-page">
      {/* 불꽃 스트릭 UI 레이어 */}
      <div className="streak-overlay-layer">
        <FireStreak streak={streak} />
      </div>

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
      
      {/* 축하 오버레이 */}
      {showCelebration && (
        <CelebrationOverlay 
          count={weeklyCount} 
          calories={lastCalories} 
          onClose={() => setShowCelebration(false)} 
        />
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
