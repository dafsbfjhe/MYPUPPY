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
import type { WalkRecord, Walk } from '../types/walk';
import { getStartOfWeek, formatDateKey } from '../utils/time';
import { calculateCalories } from '../utils/walkLogic';

// ---------------------------------------------------------
// [내부 통합 함수] - 데이터 구조를 통일하고 Firestore에 저장
// ---------------------------------------------------------

const _internalSaveWalk = async (userId: string, data: any): Promise<string> => {
  try {
    // 1. 날짜 처리: number(ms)로 통일 후 Firebase용 Timestamp로 변환
    const dateMs = typeof data.date === 'number' ? data.date : (data.date instanceof Timestamp ? data.date.toMillis() : Date.now());
    const dateTimestamp = Timestamp.fromMillis(dateMs);

    // 2. 경로 필드 통일 (routeCoordinates -> route)
    const route = data.route || data.routeCoordinates || [];

    // 3. 필드 누락 방지 (기본값 및 계산)
    const distance = data.distance || 0;
    const duration = data.duration || 0;
    const calories = data.calories ?? calculateCalories(distance);
    const condition = data.condition ?? '';

    // 4. 최종 데이터 구성
    const finalizedData = {
      date: dateTimestamp,
      distance,
      duration,
      route,
      calories,
      condition,
      userId,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, `users/${userId}/walks`), finalizedData);
    return docRef.id;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error("산책 기록 저장 실패: " + message);
  }
};

// ---------------------------------------------------------
// [기존 UI 호환용 함수] UI를 건드리지 않기 위한 서비스 레이어의 Mapper
// ---------------------------------------------------------

const mapToOldWalk = (data: any, id: string): Walk => {
  // 1. 좌표 변환: routeCoordinates 필드 보장 (기존 UI 대응)
  const coords = (data.route || data.routeCoordinates || []).map((p: any) => {
    if (p instanceof GeoPoint) return { lat: p.latitude, lng: p.longitude };
    if (typeof p.lat === 'number' && typeof p.lng === 'number') return { lat: p.lat, lng: p.lng };
    return p;
  });

  // 2. 날짜 변환: UI의 .toDate() 호출을 위해 무조건 Timestamp 객체로 변환
  let dateObj: Timestamp;
  if (data.date instanceof Timestamp) {
    dateObj = data.date;
  } else if (typeof data.date === 'number') {
    dateObj = Timestamp.fromMillis(data.date);
  } else {
    dateObj = Timestamp.now();
  }

  return {
    ...data,
    id,
    date: dateObj,
    routeCoordinates: coords,
    route: coords,
  };
};

// 1. 기존 UI가 사용하는 addWalk (WalkScreen 등)
export const addWalk = async (userId: string, walkData: any): Promise<string> => {
  return _internalSaveWalk(userId, walkData);
};

// 2. 신규 기능용 함수 (HomePage 등)
export const saveWalkRecord = async (record: WalkRecord): Promise<string> => {
  return _internalSaveWalk(record.userId, record);
};

// 3. 기존 UI가 사용하는 getWalks
export const getWalks = async (userId: string): Promise<Walk[]> => {
  try {
    const q = query(collection(db, `users/${userId}/walks`), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => mapToOldWalk(d.data(), d.id));
  } catch (error) {
    console.error("getWalks error:", error);
    return [];
  }
};

// 4. 기존 UI가 사용하는 getWalk (상세 페이지)
export const getWalk = async (userId: string, walkId: string): Promise<Walk | null> => {
  try {
    const docRef = doc(db, `users/${userId}/walks`, walkId);
    const snap = await getDoc(docRef);
    return snap.exists() ? mapToOldWalk(snap.data(), snap.id) : null;
  } catch (error) {
    console.error("getWalk error:", error);
    return null;
  }
};

// 5. 주간 통계 조회
export const getWeeklyStats = async (userId: string) => {
  try {
    const startOfWeek = getStartOfWeek(new Date());
    // 하이브리드 날짜 데이터 대응을 위해 쿼리 조건 완화 또는 로직 처리 필요할 수 있음
    // 여기서는 최신 저장 데이터가 Timestamp임을 가정하거나 number로도 필터링되게 구성
    const q = query(
      collection(db, `users/${userId}/walks`),
      where('date', '>=', Timestamp.fromMillis(startOfWeek.getTime())),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const uniqueDates = new Set<string>();
    let totalCount = 0;

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const duration = data.duration || 0;
      if (duration >= 10) {
        const timestamp = data.date instanceof Timestamp ? data.date.toMillis() : data.date;
        uniqueDates.add(formatDateKey(new Date(timestamp)));
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
