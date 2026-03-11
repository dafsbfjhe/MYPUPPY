import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import { addWalk } from '../services/walkService';
import { watchPosition, clearWatch } from '../utils/geolocation';
import { calculateDistance } from '../utils/distance';
import { formatDuration } from '../utils/time';
import './WalkScreen.css';

type WalkStatus = 'idle' | 'walking' | 'paused' | 'ended';

const WalkScreen: React.FC = () => {
  const [status, setStatus] = useState<WalkStatus>('idle');
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);
  const [route, setRoute] = useState<{ lat: number; lng: number }[]>([]);
  
  const timerRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const navigate = useNavigate();
  const userId = 'test-user'; // Hardcoded user for now

  useEffect(() => {
    if (status === 'walking') {
      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      // Start GPS tracking
      watchIdRef.current = watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newPoint = { lat: latitude, lng: longitude };
          setRoute(prevRoute => {
            if (prevRoute.length > 0) {
              const lastPoint = prevRoute[prevRoute.length - 1];
              setDistance(prevDist => prevDist + calculateDistance(lastPoint, newPoint));
            }
            return [...prevRoute, newPoint];
          });
        },
        (error) => {
          console.error("GPS Error: ", error);
          alert("GPS error occurred. Please ensure location services are enabled.");
          setStatus('paused');
        }
      );
    } else {
      // Clean up timers and watchers
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchIdRef.current) clearWatch(watchIdRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchIdRef.current) clearWatch(watchIdRef.current);
    };
  }, [status]);

  const handleStart = () => setStatus('walking');
  const handlePause = () => setStatus('paused');
  const handleResume = () => setStatus('walking');

  const handleEnd = async () => {
    setStatus('ended');
    const note = prompt("How was your dog's condition during the walk?");

    if (route.length === 0) {
        alert("No walk data recorded. Returning to home.");
        navigate('/');
        return;
    }

    try {
      await addWalk(userId, {
        date: Timestamp.now(),
        duration,
        distance,
        routeCoordinates: route,
        condition: note || '',
      });
      alert('Walk saved successfully!');
      navigate('/');
    } catch (error) {
      console.error('Failed to save walk', error);
      alert('Failed to save walk. Please try again.');
      setStatus('paused'); // Allow user to try saving again
    }
  };

  return (
    <div className="walk-screen">
      <h1 className="title">Record Walk</h1>
      <div className="metrics-container">
        <div className="metric">
          <span className="metric-label">Duration</span>
          <span className="metric-value">{formatDuration(duration)}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Distance</span>
          <span className="metric-value">{(distance / 1000).toFixed(2)} km</span>
        </div>
      </div>
      <div className="controls">
        {status === 'idle' && <button className="btn-start" onClick={handleStart}>Start Walk</button>}
        {status === 'walking' && <button className="btn-pause" onClick={handlePause}>Pause</button>}
        {status === 'paused' && <button className="btn-resume" onClick={handleResume}>Resume</button>}
        {(status === 'walking' || status === 'paused') && (
          <button className="btn-end" onClick={handleEnd}>End Walk</button>
        )}
      </div>
       {status === 'ended' && (
        <div className="condition-note">
            <p>Saving walk...</p>
        </div>
       )}
    </div>
  );
};

export default WalkScreen;
