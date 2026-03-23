import React, { memo } from 'react';
import './WalkControlCard.css';
import { formatDuration } from '../utils/time';

interface WalkControlCardProps {
  distance: number;
  duration: number;
  onEnd: () => void;
}

// React.memo를 사용하여 부모 컴포넌트 리렌더링 시 불필요한 카드 리렌더링 방지
const WalkControlCard: React.FC<WalkControlCardProps> = memo(({ distance, duration, onEnd }) => {
  return (
    <div className="walk-control-card-container">
      <div className="walk-control-card">
        <div className="walk-header">
          <div className="walking-indicator">
            <span className="dot"></span>
            산책 중
          </div>
        </div>
        
        <div className="walk-stats-grid">
          <div className="stat-box">
            <span className="stat-label">이동 거리</span>
            <div className="stat-value-group">
              <span className="stat-value">{(distance / 1000).toFixed(2)}</span>
              <span className="stat-unit">km</span>
            </div>
          </div>
          
          <div className="stat-box">
            <span className="stat-label">산책 시간</span>
            <div className="stat-value-group">
              <span className="stat-value">{formatDuration(duration)}</span>
            </div>
          </div>
        </div>
        
        <button className="btn-stop-walk" onClick={onEnd}>
          산책 종료
        </button>
      </div>
    </div>
  );
});

export default WalkControlCard;
