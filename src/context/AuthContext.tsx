import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithCustomToken, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, Timestamp, onSnapshot } from 'firebase/firestore';

interface UserData {
  level: number;
  exp: number;
  totalWalkCount: number;
  totalWalkDistance: number;
  createdAt: Timestamp;
  profile?: {
    nickname: string;
  };
  dog?: {
    name: string;
    age: string;
    breed: string;
    image: string;
  };
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  loginWithKakao: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  userData: null,
  loading: true,
  loginWithKakao: async () => {},
  logout: async () => {}
});

const KAKAO_JS_KEY = 'ad12ac82fb30028a0ca2fcf93756c20c';
const CLOUD_FUNCTION_URL = 'https://createkakaocustomtoken-uflxxq5u5q-uc.a.run.app';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize Kakao SDK
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_JS_KEY);
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Initial user data setup/fetch
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          const initialData: UserData = {
            level: 1,
            exp: 0,
            totalWalkCount: 0,
            totalWalkDistance: 0,
            createdAt: Timestamp.now(),
            profile: {
              nickname: firebaseUser.displayName || '신규 사용자',
            },
            dog: {
              name: '강아지 이름',
              age: '0살',
              breed: '품종',
              image: 'https://img.icons8.com/color/192/000000/dog.png',
            }
          };
          await setDoc(userDocRef, initialData);
          setUserData(initialData);
        }

        // Real-time listener for user data
        const unsubscribeData = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setUserData(doc.data() as UserData);
          }
        });

        setLoading(false);
        return () => {
          unsubscribeData();
        };
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return unsubscribeAuth;
  }, []);

  const loginWithKakao = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const Kakao = window.Kakao;

      if (!Kakao) {
        reject(new Error('카카오 SDK가 로드되지 않았습니다. 잠시 후 다시 시도해주세요.'));
        return;
      }

      if (!Kakao.isInitialized()) {
        Kakao.init(KAKAO_JS_KEY);
      }

      Kakao.Auth.login({
        success: () => {
          Kakao.API.request({
            url: '/v2/user/me',
            success: async (response) => {
              try {
                const kakaoUserId = response.id;
                
                const tokenResponse = await fetch(CLOUD_FUNCTION_URL, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ kakaoUserId }),
                });

                if (!tokenResponse.ok) {
                  throw new Error('Failed to fetch custom token');
                }

                const { token: customToken } = await tokenResponse.json();
                await signInWithCustomToken(auth, customToken);
                resolve();
              } catch (err) {
                console.error('Kakao login error:', err);
                reject(err);
              }
            },
            fail: (err) => {
              console.error('Kakao user request failed:', err);
              reject(err);
            },
          });
        },
        fail: (err) => {
          console.error('Kakao login failed:', err);
          reject(err);
        },
      });
    });
  };

  const logout = async () => {
    try {
      await signOut(auth);
      if (window.Kakao && window.Kakao.Auth.logout) {
        window.Kakao.Auth.logout();
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, loginWithKakao, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
