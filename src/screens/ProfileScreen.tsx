import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { uploadImage } from '../utils/storage';
import './ProfileScreen.css';

interface UserProfile {
  nickname: string;
  profileImage: string;
}

interface DogInfo {
  name: string;
  age: string;
  breed: string;
  image: string;
}

interface WalkStats {
  totalWalks: number;
  totalDistance: number;
}

const ProfileScreen: React.FC = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dogInfo, setDogInfo] = useState<DogInfo | null>(null);
  const [walkStats, setWalkStats] = useState<WalkStats>({ totalWalks: 0, totalDistance: 0 });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingDog, setIsEditingDog] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newNickname, setNewNickname] = useState('');
  const [newDogName, setNewDogName] = useState('');
  const [newDogAge, setNewDogAge] = useState('');
  const [newDogBreed, setNewDogBreed] = useState('');

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchWalkStats();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserProfile(data.profile);
        setDogInfo(data.dog);
        setNewNickname(data.profile.nickname);
        setNewDogName(data.dog.name);
        setNewDogAge(data.dog.age);
        setNewDogBreed(data.dog.breed);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWalkStats = async () => {
    if (!user) return;
    try {
      const walksSnapshot = await getDocs(collection(db, `users/${user.uid}/walks`));
      let totalDistance = 0;
      walksSnapshot.forEach(doc => {
        totalDistance += doc.data().distance || 0;
      });
      setWalkStats({
        totalWalks: walksSnapshot.size,
        totalDistance: Math.round((totalDistance / 1000) * 10) / 10 // Convert meters to km and round
      });
    } catch (error) {
      console.error("Error fetching walk stats:", error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        'profile.nickname': newNickname
      });
      setUserProfile(prev => prev ? { ...prev, nickname: newNickname } : null);
      setIsEditingProfile(false);
    } catch (error) {
      alert("프로필 수정 실패");
    }
  };

  const handleUpdateDog = async () => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        'dog.name': newDogName,
        'dog.age': newDogAge,
        'dog.breed': newDogBreed
      });
      setDogInfo(prev => prev ? { ...prev, name: newDogName, age: newDogAge, breed: newDogBreed } : null);
      setIsEditingDog(false);
    } catch (error) {
      alert("강아지 정보 수정 실패");
    }
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      try {
        const url = await uploadImage(`users/${user.uid}/profile_${Date.now()}`, file);
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { 'profile.profileImage': url });
        setUserProfile(prev => prev ? { ...prev, profileImage: url } : null);
      } catch (error) {
        alert("이미지 업로드 실패");
      }
    }
  };

  const handleDogImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      try {
        const url = await uploadImage(`users/${user.uid}/dog_${Date.now()}`, file);
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { 'dog.image': url });
        setDogInfo(prev => prev ? { ...prev, image: url } : null);
      } catch (error) {
        alert("이미지 업로드 실패");
      }
    }
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  if (loading) return <div className="loading">Loading profile...</div>;

  return (
    <div className="profile-screen">
      <div className="profile-header">
        <h1 className="title">My Profile</h1>
        <button className="btn-signout" onClick={handleSignOut}>로그아웃</button>
      </div>

      <div className="profile-card user-profile-section">
        <div className="image-container">
          <img src={userProfile?.profileImage} alt="User Profile" className="profile-image large" />
          <label className="image-upload-label">
            <input type="file" accept="image/*" onChange={handleProfileImageChange} hidden />
            <span>📷</span>
          </label>
        </div>
        {isEditingProfile ? (
          <div className="edit-form">
            <input 
              type="text" 
              value={newNickname} 
              onChange={(e) => setNewNickname(e.target.value)} 
              className="edit-input"
            />
            <div className="btn-group">
              <button onClick={handleUpdateProfile} className="btn-save">저장</button>
              <button onClick={() => setIsEditingProfile(false)} className="btn-cancel">취소</button>
            </div>
          </div>
        ) : (
          <div className="info-display">
            <h2 className="nickname">{userProfile?.nickname}</h2>
            <button className="btn-edit-small" onClick={() => setIsEditingProfile(true)}>수정</button>
          </div>
        )}
      </div>

      <div className="profile-card dog-profile-section">
        <h2 className="section-title">Dog's Information</h2>
        <div className="image-container">
          <img src={dogInfo?.image} alt="Dog Profile" className="profile-image medium" />
          <label className="image-upload-label">
            <input type="file" accept="image/*" onChange={handleDogImageChange} hidden />
            <span>📷</span>
          </label>
        </div>
        
        {isEditingDog ? (
          <div className="edit-form">
            <input type="text" placeholder="이름" value={newDogName} onChange={(e) => setNewDogName(e.target.value)} className="edit-input" />
            <input type="text" placeholder="나이" value={newDogAge} onChange={(e) => setNewDogAge(e.target.value)} className="edit-input" />
            <input type="text" placeholder="품종" value={newDogBreed} onChange={(e) => setNewDogBreed(e.target.value)} className="edit-input" />
            <div className="btn-group">
              <button onClick={handleUpdateDog} className="btn-save">저장</button>
              <button onClick={() => setIsEditingDog(false)} className="btn-cancel">취소</button>
            </div>
          </div>
        ) : (
          <div className="info-display-vertical">
            <p><strong>이름:</strong> {dogInfo?.name}</p>
            <p><strong>나이:</strong> {dogInfo?.age}</p>
            <p><strong>품종:</strong> {dogInfo?.breed}</p>
            <button className="btn-edit-small" onClick={() => setIsEditingDog(true)}>수정</button>
          </div>
        )}
      </div>

      <div className="profile-card stats-section">
        <h2 className="section-title">Walk Statistics</h2>
        <div className="stats-grid">
            <div className="stat-item">
                <span className="stat-label">총 산책 횟수</span>
                <span className="stat-value">{walkStats.totalWalks} 회</span>
            </div>
            <div className="stat-item">
                <span className="stat-label">총 산책 거리</span>
                <span className="stat-value">{walkStats.totalDistance} km</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
