export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface WalkRecord {
  id?: string;
  userId: string;
  date: number; // 밀리초 단위 타임스탬프
  duration: number; // 초 단위
  distance: number; // 미터 단위
  calories: number;
  route: RoutePoint[];
}

export interface WalkStat {
  userId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}
