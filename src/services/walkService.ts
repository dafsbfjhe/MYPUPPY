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

// ---------------------------------------------------------
// [기존 UI 호환용 함수] UI를 건드리지 않기 위한 서비스 레이어의 Mapper
// ---------------------------------------------------------

const mapToOldWalk = (data: any, id: string): Walk => {
  // 1. 좌표 변환: routeCoordinates 필드 보장
  const coords = (data.routeCoordinates || data.route || []).map((p: any) => {
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
    date: dateObj, // 이제 UI에서 walk.date.toDate()가 에러 없이 작동함
    routeCoordinates: coords,
    route: coords,
  };
};

// 1. 기존 UI가 사용하는 addWalk
export const addWalk = async (userId: string, walkData: any): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, `users/${userId}/walks`), {
      ...walkData,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    throw new Error("addWalk failed: " + (error instanceof Error ? error.message : "Unknown error"));
  }
};

// 2. 기존 UI가 사용하는 getWalks
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

// 3. 기존 UI가 사용하는 getWalk (상세 페이지)
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

// ---------------------------------------------------------
// [신규 기능용 함수] - HomePage에서 사용
// ---------------------------------------------------------

export const saveWalkRecord = async (record: WalkRecord): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, `users/${record.userId}/walks`), {
      ...record,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error("기록 저장 실패: " + message);
  }
};

export const getWeeklyStats = async (userId: string) => {
  try {
    const startOfWeek = getStartOfWeek(new Date());
    const q = query(
      collection(db, `users/${userId}/walks`),
      where('date', '>=', startOfWeek.getTime()),
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
