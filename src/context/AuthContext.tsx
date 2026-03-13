import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithCustomToken, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithKakao: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  loginWithKakao: async () => {},
  logout: async () => {}
});

const KAKAO_JS_KEY = 'ad12ac82fb30028a0ca2fcf93756c20c'; // Replace with your real Kakao JS Key
const CLOUD_FUNCTION_URL = 'https://createkakaocustomtoken-uflxxq5u5q-uc.a.run.app';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize Kakao SDK
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_JS_KEY);
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithKakao = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const Kakao = window.Kakao;

      if (!Kakao) {
        reject(new Error('카카오 SDK가 로드되지 않았습니다. 잠시 후 다시 시도해주세요.'));
        return;
      }

      // Check if initialized before calling login
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
                
                // 1. Call Cloud Function to get Firebase Custom Token
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

                // 2. Sign in to Firebase with Custom Token
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
    <AuthContext.Provider value={{ user, loading, loginWithKakao, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
