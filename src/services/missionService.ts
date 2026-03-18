import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  onSnapshot,
  increment
} from 'firebase/firestore';

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'count' | 'distance' | 'streak';
  target: number;
  rewardExp: number;
}

export interface UserMission {
  uid: string;
  missionId: string;
  progress: number;
  completed: boolean;
  rewarded: boolean;
}

// Strategy for mission progress
const missionStrategies: Record<string, (current: number, incrementValue: number) => number> = {
  count: (current, inc) => current + inc,
  distance: (current, inc) => current + inc,
  streak: (current, inc) => inc, // For streak, we might replace or increment depending on logic, but for simplicity, let's say it's updated directly
};

export const getMissions = async (): Promise<Mission[]> => {
  const querySnapshot = await getDocs(collection(db, 'missions'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mission));
};

export const getUserMissions = async (userId: string): Promise<UserMission[]> => {
  const q = query(collection(db, 'userMissions'), where('uid', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as UserMission);
};

export const subscribeToUserMissions = (userId: string, callback: (missions: UserMission[]) => void) => {
  const q = query(collection(db, 'userMissions'), where('uid', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const missions = snapshot.docs.map(doc => doc.data() as UserMission);
    callback(missions);
  });
};

export const updateMissionProgress = async (
  userId: string, 
  missionId: string, 
  incrementValue: number,
  missionType: string,
  target: number
): Promise<{ completed: boolean; alreadyCompleted: boolean }> => {
  const userMissionId = `${userId}_${missionId}`;
  const userMissionRef = doc(db, 'userMissions', userMissionId);
  const userMissionSnap = await getDoc(userMissionRef);

  if (!userMissionSnap.exists()) {
    // Initialize if not exists
    const initialProgress = missionStrategies[missionType] ? missionStrategies[missionType](0, incrementValue) : incrementValue;
    const completed = initialProgress >= target;
    await setDoc(userMissionRef, {
      uid: userId,
      missionId,
      progress: initialProgress,
      completed,
      rewarded: false
    });
    return { completed, alreadyCompleted: false };
  }

  const data = userMissionSnap.data() as UserMission;
  if (data.completed) {
    return { completed: true, alreadyCompleted: true };
  }

  const newProgress = missionStrategies[missionType] ? missionStrategies[missionType](data.progress, incrementValue) : data.progress + incrementValue;
  const completed = newProgress >= target;

  await updateDoc(userMissionRef, {
    progress: newProgress,
    completed: completed
  });

  return { completed, alreadyCompleted: false };
};

export const claimMissionReward = async (userId: string, missionId: string): Promise<number> => {
    const userMissionId = `${userId}_${missionId}`;
    const userMissionRef = doc(db, 'userMissions', userMissionId);
    const userMissionSnap = await getDoc(userMissionRef);

    if (!userMissionSnap.exists()) throw new Error("Mission not found");
    const data = userMissionSnap.data() as UserMission;

    if (!data.completed || data.rewarded) return 0;

    const missionSnap = await getDoc(doc(db, 'missions', missionId));
    if (!missionSnap.exists()) throw new Error("Mission definition not found");
    const mission = missionSnap.data() as Mission;

    await updateDoc(userMissionRef, { rewarded: true });
    return mission.rewardExp;
}
