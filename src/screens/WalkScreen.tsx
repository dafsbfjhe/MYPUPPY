import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDuration } from '../utils/time';
import { useAuth } from '../context/AuthContext';
import { getMissions, updateMissionProgress } from '../services/missionService';
import { addExperience, updateWalkStats } from '../services/userService';
import { useWalk } from '../hooks/useWalk';
import './WalkScreen.css';

const WalkScreen: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // 훅 도입: 산책 로직 위임
  const { 
    status, 
    distance, 
    duration, 
    route, 
    startWalk, 
    pauseWalk, 
    resumeWalk, 
    stopWalk 
  } = useWalk();

  // 미션 관련 상태 (UI 전용)
  const [missions, setMissions] = useState<any[]>([]);
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Load missions on mount
  useEffect(() => {
    const fetchMissions = async () => {
      const data = await getMissions();
      setMissions(data);
    };
    fetchMissions();
  }, []);

  // 미션 업데이트 로직 (상태 구독 방식)
  const updateMissions = useCallback(async () => {
    if (!user || missions.length === 0) return;

    const distanceMissions = missions.filter(m => m.type === 'distance');
    for (const mission of distanceMissions) {
      if (completedMissions.includes(mission.id)) continue;

      // 거리 차이만큼 업데이트 (여기서는 단순화를 위해 현재 거리 기반으로 체크하는 서비스 로직이라 가정)
      const result = await updateMissionProgress(user.uid, mission.id, 0, 'distance', mission.target); 
      if (result.completed && !result.alreadyCompleted) {
        setCompletedMissions(prev => [...prev, mission.id]);
        alert(`🎉 미션 완료! (${mission.title})`);
      }
    }
  }, [user, missions, completedMissions]);

  // 거리 변화 감지하여 미션 체크
  useEffect(() => {
    if (status === 'walking') {
      updateMissions();
    }
  }, [distance, status, updateMissions]);

  const handleEnd = async () => {
    const note = prompt("오늘 산책은 어땠나요? 강아지 상태를 기록해주세요.");

    const finalRoute = route ?? [];
    if (finalRoute.length === 0 && distance === 0) {
        alert("산책 데이터가 없습니다.");
        navigate('/');
        return;
    }

    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    setIsSaving(true);

    try {
      // 이벤트 방식: stopWalk 호출 후 결과 정산
      const result = await stopWalk(note || '');

      if (result) {
        // 2. 통계 업데이트 (누적 거리 등)
        await updateWalkStats(user.uid, result.distance);

        // 3. 횟수 기반 미션 업데이트
        const countMissions = missions.filter(m => m.type === 'count');
        const newlyCompleted: string[] = [];
        for (const mission of countMissions) {
            const missionResult = await updateMissionProgress(user.uid, mission.id, 1, 'count', mission.target);
            if (missionResult.completed && !missionResult.alreadyCompleted) {
                newlyCompleted.push(mission.title);
            }
        }

        // 4. 경험치 계산 (10 exp per 100m + 50 bonus)
        const earnedExp = Math.floor(result.distance / 10) + 50;
        const levelResult = await addExperience(user.uid, earnedExp);

        let summaryMessage = `산책이 저장되었습니다!\n획득 경험치: ${earnedExp} XP`;
        if (newlyCompleted.length > 0) {
            summaryMessage += `\n완료된 미션: ${newlyCompleted.join(', ')}`;
        }
        if (levelResult.leveledUp) {
            summaryMessage += `\n🎊 레벨업! Lv.${levelResult.newLevel}이 되었습니다!`;
        }

        alert(summaryMessage);
        navigate(`/walk/${result.walkId}`);
      }
    } catch (error) {
      console.error('Failed to save walk', error);
      alert('산책 기록 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="walk-screen">
      <h1 className="title">산책 기록</h1>
      <div className="metrics-container">
        <div className="metric">
          <span className="metric-label">시간</span>
          <span className="metric-value">{formatDuration(duration)}</span>
        </div>
        <div className="metric">
          <span className="metric-label">거리</span>
          <span className="metric-value">{(distance / 1000).toFixed(2)} km</span>
        </div>
      </div>
      <div className="controls">
        {status === 'idle' && <button className="btn-start" onClick={startWalk}>산책 시작</button>}
        {status === 'walking' && <button className="btn-pause" onClick={pauseWalk}>일시 정지</button>}
        {status === 'paused' && <button className="btn-resume" onClick={resumeWalk}>다시 시작</button>}
        {(status === 'walking' || status === 'paused') && (
          <button className="btn-end" onClick={handleEnd}>산책 종료</button>
        )}
      </div>
       {isSaving && (
        <div className="condition-note">
            <p>산책 기록을 저장 중입니다...</p>
        </div>
       )}
    </div>
  );
};

export default WalkScreen;
