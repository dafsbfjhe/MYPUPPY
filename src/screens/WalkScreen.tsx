import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import { addWalk } from '../services/walkService';
import { watchPosition, clearWatch } from '../utils/geolocation';
import { calculateDistance } from '../utils/distance';
import { formatDuration } from '../utils/time';
import { useAuth } from '../context/AuthContext';
import { getMissions, updateMissionProgress } from '../services/missionService';
import { addExperience, updateWalkStats } from '../services/userService';
import './WalkScreen.css';

type WalkStatus = 'idle' | 'walking' | 'paused' | 'ended';

const WalkScreen: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<WalkStatus>('idle');
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);
  const [route, setRoute] = useState<{ lat: number; lng: number }[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  
  const timerRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateDistanceRef = useRef(0);

  const navigate = useNavigate();

  // Load missions on mount
  useEffect(() => {
    const fetchMissions = async () => {
      const data = await getMissions();
      setMissions(data);
    };
    fetchMissions();
  }, []);

  const updateMissions = useCallback(async (currentDistance: number, isFinal = false) => {
    if (!user) return;

    // Throttle: Update only if distance changed by more than 10 meters, or if it's the final update
    const diff = currentDistance - lastUpdateDistanceRef.current;
    if (diff < 10 && !isFinal) return;

    lastUpdateDistanceRef.current = currentDistance;

    const distanceMissions = missions.filter(m => m.type === 'distance');
    for (const mission of distanceMissions) {
      if (completedMissions.includes(mission.id)) continue;

      const result = await updateMissionProgress(user.uid, mission.id, diff, 'distance', mission.target);
      if (result.completed && !result.alreadyCompleted) {
        setCompletedMissions(prev => [...prev, mission.id]);
        alert(`🎉 미션 완료! (${mission.title})`);
      }
    }
  }, [user, missions, completedMissions]);

  useEffect(() => {
    if (status === 'walking') {
      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      // Start GPS tracking
      watchIdRef.current = watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newPoint = { lat: latitude, lng: longitude };
          setRoute(prevRoute => {
            let newDist = distance;
            if (prevRoute.length > 0) {
              const lastPoint = prevRoute[prevRoute.length - 1];
              const d = calculateDistance(lastPoint, newPoint);
              newDist += d;
              setDistance(newDist);
              // Update missions in background
              updateMissions(newDist);
            }
            return [...prevRoute, newPoint];
          });
        },
        (error) => {
          console.error("GPS Error: ", error);
          alert("GPS error occurred. Please ensure location services are enabled.");
          setStatus('paused');
        }
      );
    } else {
      // Clean up timers and watchers
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchIdRef.current) clearWatch(watchIdRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchIdRef.current) clearWatch(watchIdRef.current);
    };
  }, [status, updateMissions]);

  const handleStart = () => setStatus('walking');
  const handlePause = () => setStatus('paused');
  const handleResume = () => setStatus('walking');

  const handleEnd = async () => {
    setStatus('ended');
    const note = prompt("오늘 산책은 어땠나요? 강아지 상태를 기록해주세요.");

    if (route.length === 0 && distance === 0) {
        alert("산책 데이터가 없습니다.");
        navigate('/');
        return;
    }

    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      // 1. Save Walk Record
      const walkId = await addWalk(user.uid, {
        date: Timestamp.now(),
        duration,
        distance,
        routeCoordinates: route,
        condition: note || '',
      });

      // 2. Update Stats (Count + Distance)
      await updateWalkStats(user.uid, distance);

      // 3. Final Mission Update for Count type
      const countMissions = missions.filter(m => m.type === 'count');
      const newlyCompleted: string[] = [];
      for (const mission of countMissions) {
          const result = await updateMissionProgress(user.uid, mission.id, 1, 'count', mission.target);
          if (result.completed && !result.alreadyCompleted) {
              newlyCompleted.push(mission.title);
          }
      }

      // 4. Calculate EXP (Basic: 10 exp per 100m + 50 bonus for finishing)
      const earnedExp = Math.floor(distance / 10) + 50;
      const levelResult = await addExperience(user.uid, earnedExp);

      let summaryMessage = `산책이 저장되었습니다!\n획득 경험치: ${earnedExp} XP`;
      if (newlyCompleted.length > 0) {
          summaryMessage += `\n완료된 미션: ${newlyCompleted.join(', ')}`;
      }
      if (levelResult.leveledUp) {
          summaryMessage += `\n🎊 레벨업! Lv.${levelResult.newLevel}이 되었습니다!`;
      }

      alert(summaryMessage);
      navigate(`/walk/${walkId}`);
    } catch (error) {
      console.error('Failed to save walk', error);
      alert('산책 기록 저장 중 오류가 발생했습니다.');
      setStatus('paused');
    }
  };

  return (
    <div className="walk-screen">
      <h1 className="title">산책 기록</h1>
      <div className="metrics-container">
        <div className="metric">
          <span className="metric-label">시간</span>
          <span className="metric-value">{formatDuration(duration)}</span>
        </div>
        <div className="metric">
          <span className="metric-label">거리</span>
          <span className="metric-value">{(distance / 1000).toFixed(2)} km</span>
        </div>
      </div>
      <div className="controls">
        {status === 'idle' && <button className="btn-start" onClick={handleStart}>산책 시작</button>}
        {status === 'walking' && <button className="btn-pause" onClick={handlePause}>일시 정지</button>}
        {status === 'paused' && <button className="btn-resume" onClick={handleResume}>다시 시작</button>}
        {(status === 'walking' || status === 'paused') && (
          <button className="btn-end" onClick={handleEnd}>산책 종료</button>
        )}
      </div>
       {status === 'ended' && (
        <div className="condition-note">
            <p>산책 기록을 저장 중입니다...</p>
        </div>
       )}
    </div>
  );
};

export default WalkScreen;
