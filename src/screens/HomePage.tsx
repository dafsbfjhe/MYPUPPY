// Cloudflare build trigger: Integrated Walk stats, Streak, and Celebration Overlay.
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { useAuth } from '../context/AuthContext';
import { getWeeklyStats } from '../services/walkService';
import WalkControlCard from '../components/WalkControlCard';
import CelebrationOverlay from '../components/CelebrationOverlay';
import { useWalk } from '../hooks/useWalk';
import './HomePage.css';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const HomePage: React.FC = () => {
  const { user } = useAuth();
  
  // 훅 도입: 모든 산책 로직 위임
  const { 
    status, 
    currentPosition, 
    distance, 
    duration, 
    route, 
    error: geoError, 
    startWalk, 
    stopWalk 
  } = useWalk();

  // 통계 및 오버레이 상태 (UI 전용)
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [streak, setStreak] = useState<boolean[]>(new Array(7).fill(false));
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastCalories, setLastCalories] = useState(0);

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

  const handleEndWalk = async () => {
    // 이벤트 방식: stopWalk 호출 후 결과를 받아 처리
    const result = await stopWalk();
    
    if (result) {
      setLastCalories(result.calories);
      // 통계 즉시 갱신
      await loadStats();

      // 축하 오버레이 조건 (거리 0 이상, 시간 10초 이상)
      if (result.distance >= 0 && result.duration >= 10) {
        setShowCelebration(true);
      }
    }
  };

  if (loadError) return <div>Error loading maps: {loadError.message}</div>;
  if (!isLoaded) return <div>Loading Map...</div>;

  const isWalking = status === 'walking';

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
      
      {/* 축하 오버레이 */}
      {showCelebration && (
        <CelebrationOverlay 
          count={weeklyCount} 
          calories={lastCalories} 
          streak={streak}
          onClose={() => setShowCelebration(false)} 
        />
      )}
      
      {!isWalking ? (
        <button 
          className="btn-start-walk" 
          onClick={startWalk}
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
