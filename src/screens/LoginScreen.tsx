import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import './LoginScreen.css';

const LoginScreen: React.FC = () => {
  const { loginWithKakao } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await initializeUserData(userCredential.user.uid);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await initializeUserData(result.user.uid);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleKakaoLogin = async () => {
    setError('');
    try {
      await loginWithKakao();
      // AuthContext handles the Firebase sign-in, but we need to ensure user data is initialized
      if (auth.currentUser) {
        await initializeUserData(auth.currentUser.uid);
      }
    } catch (err: any) {
      setError(err.message || '카카오 로그인 중 오류가 발생했습니다.');
      console.error('Kakao login failed:', err);
    }
  };

  const initializeUserData = async (uid: string) => {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        profile: {
          nickname: '신규 사용자',
          profileImage: 'https://via.placeholder.com/150/d3d3d3/ffffff?text=User',
        },
        dog: {
          name: '강아지 이름',
          age: '0살',
          breed: '품종',
          image: 'https://via.placeholder.com/150/a9a9a9/ffffff?text=Dog',
        }
      });
    }
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        <h1 className="login-title">My Puppy</h1>
        <p className="login-subtitle">반겨주는 친구와 함께하는 산책</p>
        
        <form className="login-form" onSubmit={handleEmailAuth}>
          <input 
            type="email" 
            placeholder="이메일" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="비밀번호" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <button type="submit" className="btn-primary">
            {isSignUp ? '회원가입' : '로그인'}
          </button>
        </form>

        <div className="auth-switch">
          <button onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? '이미 계정이 있으신가요? 로그인' : '처음이신가요? 회원가입'}
          </button>
        </div>

        <div className="divider">
          <span>또는</span>
        </div>

        <div className="social-login">
          <button className="btn-google" onClick={handleGoogleLogin}>
            Google로 로그인
          </button>
          <button className="btn-kakao" onClick={handleKakaoLogin}>
            카카오톡으로 로그인
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default LoginScreen;
