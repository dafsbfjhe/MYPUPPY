import { Timestamp } from 'firebase/firestore';

export interface RoutePoint {
  lat: number;
  lng: number;
}

/**
 * [Raw Data] DB 저장 및 원본 조회용 (WalkRecord)
 * DB에는 필드가 없을 수 있으므로 Optional(?)로 정의
 */
export interface WalkRecord {
  id?: string;
  userId: string;
  date: number; // ms
  duration: number;
  distance: number;
  calories?: number;
  condition?: string;
  route?: RoutePoint[];
  routeCoordinates?: RoutePoint[];
  createdAt?: number;
}

/**
 * [Normalized Data] 서비스 정규화 이후 UI에서 사용하는 타입 (Walk)
 * 정규화 로직을 거쳤으므로 모든 필수 데이터가 존재함을 보장(Required)
 */
export interface Walk {
  id: string; // 조회된 데이터는 ID가 반드시 있음
  userId: string;
  date: Timestamp; // UI 호환용 (toDate() 사용)
  duration: number;
  distance: number;
  calories: number;  // 정규화 보장
  condition: string; // 정규화 보장
  route: RoutePoint[]; // 정규화 보장
  routeCoordinates: RoutePoint[]; // 레거시 UI 호환 보장
  createdAt?: Timestamp;
}
