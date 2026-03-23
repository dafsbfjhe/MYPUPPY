import React from 'react';
import './WalkControlCard.css';
import { formatDuration } from '../utils/time';

interface WalkControlCardProps {
  distance: number;
  duration: number;
  onEnd: () => void;
}

const WalkControlCard: React.FC<WalkControlCardProps> = ({ distance, duration, onEnd }) => {
  return (
    <div className="walk-control-card">
      <div className="walk-stats">
        <div className="stat-item">
          <span className="stat-label">이동 거리</span>
          <span className="stat-value">{(distance / 1000).toFixed(2)} km</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">산책 시간</span>
          <span className="stat-value">{formatDuration(duration)}</span>
        </div>
      </div>
      <button className="btn-stop-walk" onClick={onEnd}>
        산책 종료
      </button>
    </div>
  );
};

export default WalkControlCard;
