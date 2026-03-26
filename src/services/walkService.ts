import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  Timestamp, 
  orderBy, 
  GeoPoint 
} from 'firebase/firestore';
import type { WalkRecord, Walk, RoutePoint } from '../types/walk';
import { getStartOfWeek, formatDateKey } from '../utils/time';
import { calculateCalories } from '../utils/walkLogic';

// ---------------------------------------------------------
// [1단계: 정규화 전담 함수] - Clean Data (number 날짜 기반)
// ---------------------------------------------------------

/**
 * 어떤 형태의 산책 데이터가 들어오든 표준 Walk 형식으로 정규화합니다.
 * 모든 필드가 존재함을 보장하며, 날짜는 number(ms)로 통일합니다.
 */
const normalizeWalkData = (data: any, id: string): Walk => {
  const distance = data.distance || 0;
  
  // 1. 날짜 정규화 (Timestamp or number -> number)
  const dateMs = data.date instanceof Timestamp 
    ? data.date.toMillis() 
    : (typeof data.date === 'number' ? data.date : Date.now());

  // 2. 경로 정규화 (GeoPoint or {lat, lng} -> RoutePoint[])
  const rawRoute = data.route || data.routeCoordinates || [];
  const normalizedRoute: RoutePoint[] = Array.isArray(rawRoute) 
    ? rawRoute.map((p: any) => {
        if (p instanceof GeoPoint) return { lat: p.latitude, lng: p.longitude };
        if (p && typeof p.lat === 'number' && typeof p.lng === 'number') return { lat: p.lat, lng: p.lng };
        return p;
      })
    : [];

  // 3. 필드 보정 및 모든 필드 필수(Required) 보장
  return {
    id,
    userId: data.userId || '',
    date: dateMs,
    duration: data.duration || 0,
    distance,
    calories: data.calories ?? calculateCalories(distance),
    condition: data.condition ?? '',
    route: normalizedRoute,
    routeCoordinates: normalizedRoute,
    createdAt: data.createdAt instanceof Timestamp 
      ? data.createdAt.toMillis() 
      : (typeof data.createdAt === 'number' ? data.createdAt : dateMs),
  };
};

// ---------------------------------------------------------
// [2단계: 서비스 매퍼] - Internal/UI 레이어용 변환
// ---------------------------------------------------------

/**
 * 정규화된 데이터를 그대로 반환하되, ID를 명시적으로 보장합니다.
 */
const mapToOldWalk = (data: any, id: string): Walk => {
  const clean = normalizeWalkData(data, id);
  
  return {
    ...clean,
    id, // 명시적으로 ID 지정
  };
};

// ---------------------------------------------------------
// [입력 로직] - 저장 직전에만 Timestamp 변환
// ---------------------------------------------------------

const _internalSaveWalk = async (userId: string, data: any): Promise<string> => {
  try {
    // 1. 먼저 정규화하여 깨끗한 데이터를 얻음
    const clean = normalizeWalkData(data, '');

    // 2. Firestore 저장용 데이터 구성 (날짜만 Timestamp로 변환)
    const firestoreData = {
      ...clean,
      date: Timestamp.fromMillis(clean.date),
      createdAt: Timestamp.now(),
      userId, // ID 강제 지정
    };
    
    // id 필드는 문서 자체 ID로 생성되므로 제거
    delete (firestoreData as any).id;

    const docRef = await addDoc(collection(db, `users/${userId}/walks`), firestoreData);
    return docRef.id;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error("산책 기록 저장 실패: " + message);
  }
};

// ---------------------------------------------------------
// [공개 API]
// ---------------------------------------------------------

export const addWalk = async (userId: string, walkData: any): Promise<string> => {
  return _internalSaveWalk(userId, walkData);
};

export const saveWalkRecord = async (record: WalkRecord): Promise<string> => {
  return _internalSaveWalk(record.userId, record);
};

// 1. 기존 UI가 사용하는 getWalks (WalkScreen 등)
export const getWalks = async (userId: string): Promise<Walk[]> => {
  try {
    const q = query(collection(db, `users/${userId}/walks`), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    // mapToOldWalk를 거치면 이제 필수 필드가 모두 채워진 Walk 타입이 됨
    return snapshot.docs.map(d => mapToOldWalk(d.data(), d.id)) as Walk[];
  } catch (error) {
    console.error("getWalks error:", error);
    return [];
  }
};

// 2. 기존 UI가 사용하는 getWalk (상세 페이지)
export const getWalk = async (userId: string, walkId: string): Promise<Walk | null> => {
  try {
    const docRef = doc(db, `users/${userId}/walks`, walkId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    
    // 정규화 매퍼를 거쳐 확실한 Walk 타입을 반환
    return mapToOldWalk(snap.data(), snap.id) as Walk;
  } catch (error) {
    console.error("getWalk error:", error);
    return null;
  }
};

export const getWeeklyStats = async (userId: string) => {
  try {
    const startOfWeek = getStartOfWeek(new Date());
    const q = query(
      collection(db, `users/${userId}/walks`),
      where('date', '>=', Timestamp.fromMillis(startOfWeek.getTime())),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const uniqueDates = new Set<string>();
    let totalCount = 0;

    querySnapshot.forEach((docSnap) => {
      const clean = normalizeWalkData(docSnap.data(), docSnap.id);
      if (clean.duration >= 10) {
        uniqueDates.add(formatDateKey(new Date(clean.date)));
        totalCount++;
      }
    });

    const streak = new Array(7).fill(false);
    uniqueDates.forEach((dateStr) => {
      const date = new Date(dateStr);
      const dayIndex = (date.getDay() + 6) % 7;
      streak[dayIndex] = true;
    });

    return { totalCount, streak };
  } catch (error) {
    console.error("Stats Error:", error);
    return { totalCount: 0, streak: new Array(7).fill(false) };
  }
};

export type { Walk };
