import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getWalk } from '../services/walkService';
import type { Walk } from '../services/walkService';
import { formatDuration } from '../utils/time';
import Map from '../components/Map';
import './WalkDetailScreen.css';

const WalkDetailScreen: React.FC = () => {
  const { walkId } = useParams<{ walkId: string }>();
  const [walk, setWalk] = useState<Walk | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const userId = 'test-user'; // Hardcoded user for now

  useEffect(() => {
    if (!walkId) {
      setLoading(false);
      return;
    }

    const fetchWalk = async () => {
      try {
        setLoading(true);
        const fetchedWalk = await getWalk(userId, walkId);
        setWalk(fetchedWalk);
      } catch (error) {
        console.error("Failed to fetch walk", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWalk();
  }, [walkId]);

  if (loading) {
    return <p>Loading walk details...</p>;
  }

  if (!walk) {
    return (
      <div>
        <h2>Walk not found</h2>
        <button onClick={() => navigate('/')}>Back to Calendar</button>
      </div>
    );
  }

  return (
    <div className="walk-detail-screen">
      <h1 className="title">Walk Details</h1>
      <div className="detail-grid">
        <div className="detail-item">
          <span className="detail-label">Date</span>
          <span className="detail-value">{walk.date.toDate().toLocaleDateString()}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Duration</span>
          <span className="detail-value">{formatDuration(walk.duration)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Distance</span>
          <span className="detail-value">{(walk.distance / 1000).toFixed(2)} km</span>
        </div>
        {walk.condition && (
            <div className="detail-item full-width">
                <span className="detail-label">Condition Note</span>
                <p className="condition-text">"{walk.condition}"</p>
            </div>
        )}
      </div>
      
      <h2 className='subtitle'>Route Map</h2>
      <Map route={walk.routeCoordinates} />

      <button className="btn-secondary" onClick={() => navigate('/')}>
        Back to Calendar
      </button>
    </div>
  );
};

export default WalkDetailScreen;
