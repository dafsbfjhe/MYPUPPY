export const watchPosition = (
    onSuccess: (position: GeolocationPosition) => void,
    onError: (error: GeolocationPositionError) => void
  ): number => {
    return navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  };
  
  export const clearWatch = (watchId: number): void => {
    navigator.geolocation.clearWatch(watchId);
  };
  