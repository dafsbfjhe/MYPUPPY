import { useState, useEffect, useRef, useCallback } from 'react';
import { startGpsTracking, stopGpsTracking, startTimer, stopTimer, calculateCalories } from '../utils/walkLogic';
import { getCurrentPosition } from '../utils/geolocation';
import { saveWalkRecord } from '../services/walkService';
import { useAuth } from '../context/AuthContext';

export type WalkStatus = 'idle' | 'walking' | 'paused';

export const useWalk = () => {
  const { user } = useAuth();
  
  // 1. 핵심 상태 (선언적 관리)
  const [status, setStatus] = useState<WalkStatus>('idle');
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [route, setRoute] = useState<{ lat: number; lng: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 2. 내부 참조용 Ref (클로저 문제 방지 및 타이머/GPS 관리)
  const watchIdRef = useRef<number | null>(null);
  const alwaysWatchIdRef = useRef<number | null>(null);
  const timerIdRef = useRef<number | null>(null);

  // 3. 상시 위치 추적 (지도의 강아지 아이콘 업데이트용)
  useEffect(() => {
    getCurrentPosition((pos) => {
      setCurrentPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    }, (err) => setError(err.message));

    // 저전력/낮은 빈도로 현재 위치만 추적
    alwaysWatchIdRef.current = startGpsTracking((newPoint) => {
      setCurrentPosition(newPoint);
    }, (err) => setError(err.message));

    return () => {
      if (alwaysWatchIdRef.current !== null) stopGpsTracking(alwaysWatchIdRef.current);
    };
  }, []);

  // 4. 산책 중 타이머 및 상세 GPS 기록 (status 기반 구독)
  useEffect(() => {
    if (status === 'walking') {
      // 타이머 시작
      timerIdRef.current = startTimer(() => {
        setDuration(prev => prev + 1);
      });

      // 산책용 GPS 트래킹 시작 (필터링 적용)
      watchIdRef.current = startGpsTracking((newPoint, distanceDelta) => {
        setCurrentPosition(newPoint);
        setRoute(prev => [...prev, newPoint]);
        setDistance(prev => prev + distanceDelta);
      }, (err) => {
        setError(err.message);
        setStatus('paused');
      });
    } else {
      // 정지 또는 일시정지 시 정리
      if (timerIdRef.current !== null) stopTimer(timerIdRef.current);
      if (watchIdRef.current !== null) stopGpsTracking(watchIdRef.current);
      timerIdRef.current = null;
      watchIdRef.current = null;
    }

    return () => {
      if (timerIdRef.current !== null) stopTimer(timerIdRef.current);
      if (watchIdRef.current !== null) stopGpsTracking(watchIdRef.current);
    };
  }, [status]);

  // 5. 액션 함수들
  const startWalk = useCallback(() => {
    setDistance(0);
    setDuration(0);
    setRoute(currentPosition ? [currentPosition] : []);
    setStatus('walking');
    setError(null);
  }, [currentPosition]);

  const pauseWalk = useCallback(() => setStatus('paused'), []);
  const resumeWalk = useCallback(() => setStatus('walking'), []);

  /**
   * 산책 종료 및 데이터 저장
   * @returns 저장된 산책 데이터 (이벤트 방식으로 UI에서 활용)
   */
  const stopWalk = useCallback(async (note?: string) => {
    if (!user) return null;

    const finalDistance = distance;
    const finalDuration = duration;
    const finalRoute = [...route];
    const finalCalories = calculateCalories(finalDistance);

    setStatus('idle'); // 즉시 상태 초기화

    try {
      const walkId = await saveWalkRecord({
        userId: user.uid,
        date: Date.now(),
        duration: finalDuration,
        distance: finalDistance,
        calories: finalCalories,
        route: finalRoute,
        condition: note || '',
      });

      // 상태 초기화
      setDistance(0);
      setDuration(0);
      setRoute([]);

      return {
        walkId,
        distance: finalDistance,
        duration: finalDuration,
        calories: finalCalories
      };
    } catch (err) {
      console.error("Failed to save walk:", err);
      setError("기록 저장 중 오류가 발생했습니다.");
      return null;
    }
  }, [user, distance, duration, route]);

  return {
    status,
    currentPosition,
    distance,
    duration,
    route,
    error,
    startWalk,
    pauseWalk,
    resumeWalk,
    stopWalk
  };
};
