import { Timestamp } from 'firebase/firestore';

export interface RoutePoint {
  lat: number;
  lng: number;
}

// 신규 기능용 데이터 구조
export interface WalkRecord {
  id?: string;
  userId: string;
  date: number; // 타임스탬프 (ms)
  duration: number;
  distance: number;
  calories: number;
  route: RoutePoint[];
  createdAt?: number;
}

// 기존 UI 호환용 타입 (UI 코드를 수정하지 않기 위한 전략)
export interface Walk {
  id?: string;
  userId?: string;
  date: Timestamp; // UI의 .toDate() 호출을 위해 Timestamp로 고정
  duration: number;
  distance: number;
  calories?: number;
  condition?: string;
  routeCoordinates: RoutePoint[]; 
  route?: RoutePoint[];
  createdAt?: Timestamp;
}
