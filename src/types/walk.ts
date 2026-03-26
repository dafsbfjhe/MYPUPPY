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
 * [Internal Normalized Data] 훅과 내부 로직에서 사용하는 표준 타입
 * 모든 필드가 존재함을 보장(Required)하며, 날짜는 number(ms)로 관리
 */
export interface NormalizedWalk {
  id: string;
  userId: string;
  date: number;
  duration: number;
  distance: number;
  calories: number;
  condition: string;
  route: RoutePoint[];
  createdAt: number;
}

/**
 * [Service Data] 서비스 이후 데이터 (모든 필드 Required)
 * date와 createdAt은 number(ms)로 통일
 */
export interface Walk {
  id: string;
  userId: string;
  date: number; // ms
  duration: number;
  distance: number;
  calories: number;
  condition: string;
  route: RoutePoint[];
  routeCoordinates: RoutePoint[];
  createdAt: number;
}
