import React from 'react';
import './FireStreak.css';

interface FireStreakProps {
  streak: boolean[];
}

const FireStreak: React.FC<FireStreakProps> = ({ streak }) => {
  // 이번 주 성공 횟수 (최대 5개 표시)
  const completedCount = streak.filter(Boolean).length;
  const isPerfect = completedCount >= 5;

  return (
    <div className={`streak-wrapper ${isPerfect ? 'perfect-glow' : ''}`}>
      {[...Array(5)].map((_, i) => (
        <div 
          key={i} 
          className={`streak-fire ${i < completedCount ? 'active' : 'inactive'}`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C12 2 7 8.5 7 13C7 15.76 9.24 18 12 18C14.76 18 17 15.76 17 13C17 8.5 12 2M12 16C10.34 16 9 14.66 9 13C9 10.33 12 6.5 12 6.5C12 6.5 15 10.33 15 13C15 14.66 13.66 16 12 16Z" />
          </svg>
        </div>
      ))}
    </div>
  );
};

export default FireStreak;
