import React from 'react';
import './ProfileScreen.css';

const ProfileScreen: React.FC = () => {
  // Placeholder data - to be replaced with actual user and dog data from Firestore
  const userProfile = {
    nickname: '산책대장',
    profileImage: 'https://via.placeholder.com/150/d3d3d3/ffffff?text=User', // Light gray placeholder
  };

  const dogInfo = {
    name: '바둑이',
    age: '3살',
    breed: '진돗개',
    profileImage: 'https://via.placeholder.com/150/a9a9a9/ffffff?text=Dog', // Darker gray placeholder
  };

  const walkStats = {
    totalWalks: 150,
    totalDistance: 1200, // km
  };

  const handleEditProfile = () => {
    alert('프로필 수정 기능은 개발 예정입니다.');
    // navigate('/edit-profile'); // Future implementation
  };

  return (
    <div className="profile-screen">
      <h1 className="title">My Profile</h1>

      <div className="profile-card user-profile-section">
        <img src={userProfile.profileImage} alt="User Profile" className="profile-image large" />
        <h2 className="nickname">{userProfile.nickname}</h2>
      </div>

      <div className="profile-card dog-profile-section">
        <h2 className="section-title">Dog's Information</h2>
        <img src={dogInfo.profileImage} alt="Dog Profile" className="profile-image medium" />
        <p><strong>이름:</strong> {dogInfo.name}</p>
        <p><strong>나이:</strong> {dogInfo.age}</p>
        <p><strong>품종:</strong> {dogInfo.breed}</p>
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

      <button className="btn-edit-profile" onClick={handleEditProfile}>
        프로필 수정
      </button>
    </div>
  );
};

export default ProfileScreen;
