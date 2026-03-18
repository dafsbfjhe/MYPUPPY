import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
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
        await createUserWithEmailAndPassword(auth, email, password);
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
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleKakaoLogin = async () => {
    setError('');
    try {
      await loginWithKakao();
    } catch (err: any) {
      setError(err.message || '카카오 로그인 중 오류가 발생했습니다.');
      console.error('Kakao login failed:', err);
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
