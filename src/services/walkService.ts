import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, getDoc, Timestamp, GeoPoint } from 'firebase/firestore';

export interface Walk {
  id?: string;
  date: Timestamp;
  distance: number; // in meters
  duration: number; // in seconds
  condition: string;
  routeCoordinates: { lat: number; lng: number; }[];
  createdAt: Timestamp;
}

const getWalksCollection = (userId: string) => {
  return collection(db, `users/${userId}/walks`);
};

export const addWalk = async (userId: string, walkData: Omit<Walk, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(getWalksCollection(userId), {
      ...walkData,
      routeCoordinates: walkData.routeCoordinates.map(coord => new GeoPoint(coord.lat, coord.lng)),
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding walk: ", error);
    throw new Error("Failed to save walk.");
  }
};

export const getWalks = async (userId: string): Promise<Walk[]> => {
  try {
    const querySnapshot = await getDocs(getWalksCollection(userId));
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date as Timestamp,
        createdAt: data.createdAt as Timestamp,
        routeCoordinates: data.routeCoordinates.map((gp: GeoPoint) => ({ lat: gp.latitude, lng: gp.longitude }))
      } as Walk;
    });
  } catch (error) {
    console.error("Error getting walks: ", error);
    throw new Error("Failed to fetch walks.");
  }
};

export const getWalk = async (userId: string, walkId: string): Promise<Walk | null> => {
    try {
      const docRef = doc(db, `users/${userId}/walks`, walkId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          date: data.date as Timestamp,
          createdAt: data.createdAt as Timestamp,
          routeCoordinates: data.routeCoordinates.map((gp: GeoPoint) => ({ lat: gp.latitude, lng: gp.longitude }))
        } as Walk;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting walk: ", error);
      throw new Error("Failed to fetch walk.");
    }
  };
