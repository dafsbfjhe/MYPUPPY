import { watchPosition, clearWatch } from './geolocation';
import { calculateDistance } from './distance';

interface Position {
  lat: number;
  lng: number;
}

/**
 * 산책 데이터를 기반으로 소모 칼로리를 계산하는 함수
 * (표준: 1km당 50kcal)
 */
export const calculateCalories = (distance: number): number => {
  return (distance / 1000) * 50;
};

/**
 * GPS 트래킹을 시작하고 필터링 로직을 수행하는 함수
... (기존 함수들) ...
 * @param onLocationUpdate 위치가 업데이트될 때 호출되는 콜백 (새 좌표, 추가된 거리)
 * @param onError 에러 발생 시 호출되는 콜백
 * @returns watchId (트래킹 중단 시 필요)
 */
export const startGpsTracking = (
  onLocationUpdate: (newPoint: Position, distanceDelta: number) => void,
  onError: (error: GeolocationPositionError) => void
) => {
  let lastPos: Position | null = null;
  let lastUpdateTime = 0;

  return watchPosition((position) => {
    const { latitude, longitude } = position.coords;
    const newPoint = { lat: latitude, lng: longitude };
    const currentTime = Date.now();

    // 첫 위치 정보인 경우 바로 업데이트
    if (!lastPos) {
      lastPos = newPoint;
      lastUpdateTime = currentTime;
      onLocationUpdate(newPoint, 0);
      return;
    }

    const dist = calculateDistance(lastPos, newPoint);
    const timeDiff = (currentTime - lastUpdateTime) / 1000; // 초 단위

    // 보완된 필터링 기준: 거리 5m 이상 AND 시간 2초 이상 만족 시에만 기록
    if (dist >= 5 && timeDiff >= 2) {
      onLocationUpdate(newPoint, dist);
      lastPos = newPoint;
      lastUpdateTime = currentTime;
    }
  }, onError);
};

/**
 * GPS 트래킹을 중단하는 함수
 */
export const stopGpsTracking = (watchId: number) => {
  clearWatch(watchId);
};

/**
 * 타이머를 시작하는 함수 (1초마다 콜백 실행)
 */
export const startTimer = (onTick: () => void) => {
  return window.setInterval(onTick, 1000);
};

/**
 * 타이머를 중단하는 함수
 */
export const stopTimer = (intervalId: number) => {
  window.clearInterval(intervalId);
};
