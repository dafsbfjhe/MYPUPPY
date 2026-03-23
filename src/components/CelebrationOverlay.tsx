import React, { useEffect, useState } from 'react';
import './CelebrationOverlay.css';

interface CelebrationOverlayProps {
  count: number;
  calories: number;
  onClose: () => void;
}

const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({ count, calories, onClose }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // 2초(등장) + 3초(유지) 후 페이드 아웃 시작
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      // 페이드 아웃 애니메이션(1.5초) 후 실제 컴포넌트 종료
      setTimeout(onClose, 1500);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`celebration-overlay-root ${isFadingOut ? 'exit' : 'enter'}`}>
      <div className="celebration-card">
        <div className="celebration-emoji">🐶</div>
        <h1 className="celebration-title">대단해요!! 🎉</h1>
        <p className="celebration-text">
          벌써 이번주에 <span className="text-highlight">{count}번</span>만큼 산책했어요!! 🔥
        </p>
        <div className="calorie-badge-large">
          오늘 소모 칼로리: <span className="calorie-value">{calories.toFixed(1)}</span> kcal
        </div>
      </div>
    </div>
  );
};

export default CelebrationOverlay;
