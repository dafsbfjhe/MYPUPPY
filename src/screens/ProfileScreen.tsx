import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { uploadImage } from '../utils/storage';
import './ProfileScreen.css';

interface UserProfile {
  nickname: string;
  // profileImage is now deprecated/removed in favor of dog.image
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

const DEFAULT_DOG_IMAGE = "https://img.icons8.com/color/192/000000/dog.png";

const ProfileScreen: React.FC = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dogInfo, setDogInfo] = useState<DogInfo | null>(null);
  const [walkStats, setWalkStats] = useState<WalkStats>({ totalWalks: 0, totalDistance: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // Form states
  const [newNickname, setNewNickname] = useState('');
  const [newDogName, setNewDogName] = useState('');
  const [newDogAge, setNewDogAge] = useState('');
  const [newDogBreed, setNewDogBreed] = useState('');

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    try {
      // Parallelize Firestore calls for speed
      const userDocRef = doc(db, 'users', user.uid);
      const walksCollectionRef = collection(db, `users/${user.uid}/walks`);
      
      const [userDoc, walksSnapshot] = await Promise.all([
        getDoc(userDocRef),
        getDocs(walksCollectionRef)
      ]);

      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserProfile(data.profile);
        setDogInfo(data.dog);
        
        // Sync form states
        setNewNickname(data.profile?.nickname || '');
        setNewDogName(data.dog?.name || '');
        setNewDogAge(data.dog?.age || '');
        setNewDogBreed(data.dog?.breed || '');
      }

      // Calculate stats
      let totalDistance = 0;
      walksSnapshot.forEach(doc => {
        totalDistance += doc.data().distance || 0;
      });
      
      setWalkStats({
        totalWalks: walksSnapshot.size,
        totalDistance: Math.round((totalDistance / 1000) * 10) / 10
      });

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const updatedData = {
        'profile.nickname': newNickname,
        'dog.name': newDogName,
        'dog.age': newDogAge,
        'dog.breed': newDogBreed
      };
      
      await updateDoc(userDocRef, updatedData);
      
      setUserProfile(prev => prev ? { ...prev, nickname: newNickname } : null);
      setDogInfo(prev => prev ? { ...prev, name: newDogName, age: newDogAge, breed: newDogBreed } : null);
      setIsEditing(false);
    } catch (error) {
      alert("정보 수정 실패");
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!user) return;
    try {
      setLoading(true);
      const url = await uploadImage(`users/${user.uid}/dog_${Date.now()}`, file);
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { 'dog.image': url });
      setDogInfo(prev => prev ? { ...prev, image: url } : { name: '', age: '', breed: '', image: url });
    } catch (error) {
      alert("이미지 업로드 실패");
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  if (loading && !dogInfo) return <div className="loading">프로필 정보를 불러오는 중...</div>;

  return (
    <div className="profile-screen">
      <div className="profile-header">
        <h1 className="title">프로필</h1>
        <button className="btn-signout" onClick={handleSignOut}>로그아웃</button>
      </div>

      <div className={`profile-card main-profile-section ${isDragging ? 'dragging' : ''}`}
           onDragOver={onDragOver}
           onDragLeave={onDragLeave}
           onDrop={onDrop}>
        
        <div className="profile-image-wrapper">
          <div className="image-container" onClick={() => document.getElementById('dog-image-input')?.click()}>
            <img 
              src={dogInfo?.image || DEFAULT_DOG_IMAGE} 
              alt="Dog Profile" 
              className="profile-image large"
              loading="lazy"
            />
            <div className="image-overlay">
              <span>📷</span>
            </div>
          </div>
          <input 
            id="dog-image-input"
            type="file" 
            accept="image/*" 
            onChange={onFileChange} 
            hidden 
          />
          <p className="upload-hint">이미지를 클릭하거나 파일을 끌어다 놓으세요</p>
        </div>

        {isEditing ? (
          <div className="edit-form">
            <div className="input-group">
              <label>닉네임</label>
              <input 
                type="text" 
                value={newNickname} 
                onChange={(e) => setNewNickname(e.target.value)} 
                className="edit-input"
                placeholder="보호자 닉네임"
              />
            </div>
            <div className="input-group">
              <label>강아지 이름</label>
              <input type="text" placeholder="이름" value={newDogName} onChange={(e) => setNewDogName(e.target.value)} className="edit-input" />
            </div>
            <div className="input-group">
              <label>나이</label>
              <input type="text" placeholder="나이" value={newDogAge} onChange={(e) => setNewDogAge(e.target.value)} className="edit-input" />
            </div>
            <div className="input-group">
              <label>품종</label>
              <input type="text" placeholder="품종" value={newDogBreed} onChange={(e) => setNewDogBreed(e.target.value)} className="edit-input" />
            </div>
            <div className="btn-group">
              <button onClick={handleUpdateProfile} className="btn-save">저장</button>
              <button onClick={() => setIsEditing(false)} className="btn-cancel">취소</button>
            </div>
          </div>
        ) : (
          <div className="info-display-combined">
            <h2 className="nickname">{userProfile?.nickname || '사용자'}</h2>
            <div className="dog-details">
              <p><strong>반려견:</strong> {dogInfo?.name || '미등록'}</p>
              <p><strong>나이:</strong> {dogInfo?.age || '-'}</p>
              <p><strong>품종:</strong> {dogInfo?.breed || '-'}</p>
            </div>
            <button className="btn-edit-small" onClick={() => setIsEditing(true)}>정보 수정</button>
          </div>
        )}
      </div>

      <div className="profile-card stats-section">
        <h2 className="section-title">산책 통계</h2>
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
