export const watchPosition = (
  onSuccess: (position: GeolocationPosition) => void,
  onError: (error: GeolocationPositionError) => void
): number => {
  return navigator.geolocation.watchPosition(onSuccess, onError, {
    enableHighAccuracy: true, // 고정밀도 시도
    timeout: 20000,           // 20초로 연장 (초기 fix 대비)
    maximumAge: 5000,         // 5초 이내의 캐시된 데이터는 즉시 허용 (로딩 속도 개선)
  });
};

export const clearWatch = (watchId: number): void => {
  navigator.geolocation.clearWatch(watchId);
};

export const getCurrentPosition = (
  onSuccess: (position: GeolocationPosition) => void,
  onError: (error: GeolocationPositionError) => void
): void => {
  navigator.geolocation.getCurrentPosition(onSuccess, onError, {
    enableHighAccuracy: false, // 초기 위치는 빠르게
    timeout: 10000,
    maximumAge: 30000,
  });
};
