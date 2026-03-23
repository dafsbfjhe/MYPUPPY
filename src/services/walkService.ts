import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { WalkRecord } from '../types/walk';
import { getStartOfWeek, formatDateKey } from '../utils/time';

const WALKS_COLLECTION = 'walks';

export const saveWalkRecord = async (record: WalkRecord): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, WALKS_COLLECTION), {
      ...record,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Firebase Save Error:", message);
    throw new Error("산책 기록 저장 실패: " + message);
  }
};

/** 
 * [Firestore 인덱스 생성 필요]
 * 컬렉션: walks
 * 필드: userId(ASC), date(DESC) 
 */
export const getWeeklyStats = async (userId: string) => {
  try {
    const startOfWeek = getStartOfWeek(new Date());
    const q = query(
      collection(db, WALKS_COLLECTION),
      where('userId', '==', userId),
      where('date', '>=', startOfWeek.getTime()),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const uniqueDates = new Set<string>();
    let totalCount = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data() as WalkRecord;
      // 테스트용 조건: 10초 이상일 때만 인정
      if (data.duration >= 10) {
        uniqueDates.add(formatDateKey(new Date(data.date)));
        totalCount++;
      }
    });

    const streak = new Array(7).fill(false);
    uniqueDates.forEach((dateStr) => {
      const date = new Date(dateStr);
      // 월요일 시작(0) ~ 일요일(6)로 변환
      const dayIndex = (date.getDay() + 6) % 7;
      streak[dayIndex] = true;
    });

    return { totalCount, streak };
  } catch (error) {
    console.error("Get Weekly Stats Error:", error);
    return { totalCount: 0, streak: new Array(7).fill(false) };
  }
};
