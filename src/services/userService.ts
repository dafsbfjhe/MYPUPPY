import { db } from '../firebase';
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';

export interface LevelUpdate {
  leveledUp: boolean;
  newLevel: number;
  newExp: number;
  earnedExp: number;
}

export const calculateExpForNextLevel = (level: number) => {
  return level * 100;
};

export const addExperience = async (userId: string, expToAdd: number): Promise<LevelUpdate> => {
  const userDocRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userDocRef);

  if (!userSnap.exists()) {
    throw new Error("User document does not exist");
  }

  const userData = userSnap.data();
  let currentLevel = userData.level || 1;
  let currentExp = userData.exp || 0;
  
  let newExp = currentExp + expToAdd;
  let newLevel = currentLevel;
  let leveledUp = false;

  while (newExp >= calculateExpForNextLevel(newLevel)) {
    newExp -= calculateExpForNextLevel(newLevel);
    newLevel++;
    leveledUp = true;
  }

  await updateDoc(userDocRef, {
    level: newLevel,
    exp: newExp,
  });

  return {
    leveledUp,
    newLevel,
    newExp,
    earnedExp: expToAdd
  };
};

export const updateWalkStats = async (userId: string, distance: number) => {
  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, {
    totalWalkCount: increment(1),
    totalWalkDistance: increment(distance),
  });
};
