import { Timestamp } from 'firebase/firestore';

export interface RoutePoint {
  lat: number;
  lng: number;
}

/**
 * 신규 기능 및 저장용 데이터 구조 (WalkRecord)
 * 하이브리드 데이터 대응을 위해 신규 필드는 Optional(?)로 정의
 */
export interface WalkRecord {
  id?: string;
  userId: string;
  date: number; // 타임스탬프 (ms)
  duration: number;
  distance: number;
  calories?: number;
  condition?: string;
  route?: RoutePoint[];
  routeCoordinates?: RoutePoint[];
  createdAt?: number;
}

/**
 * 기존 UI 호환 및 조회용 타입 (Walk)
 * UI 코드를 수정하지 않기 위해 route와 routeCoordinates를 모두 허용
 */
export interface Walk {
  id?: string;
  userId?: string;
  date: Timestamp; // UI의 .toDate() 호출을 위해 Timestamp 고정
  duration: number;
  distance: number;
  calories?: number;
  condition?: string;
  routeCoordinates?: RoutePoint[]; 
  route?: RoutePoint[];
  createdAt?: Timestamp;
}
