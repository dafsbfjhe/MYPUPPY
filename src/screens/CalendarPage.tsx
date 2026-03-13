import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { getWalks } from '../services/walkService';
import type { Walk } from '../services/walkService';
import { useAuth } from '../context/AuthContext';
import './CalendarPage.css';

const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const [walks, setWalks] = useState<Walk[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWalks = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const fetchedWalks = await getWalks(user.uid);
        setWalks(fetchedWalks);
      } catch (error) {
        console.error("Failed to fetch walks", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWalks();
  }, [user]);

  const getWalksForDate = (date: Date) => {
    return walks.filter(walk => {
      const walkDate = walk.date.toDate();
      return (
        walkDate.getFullYear() === date.getFullYear() &&
        walkDate.getMonth() === date.getMonth() &&
        walkDate.getDate() === date.getDate()
      );
    });
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const walksOnDate = getWalksForDate(date);
      if (walksOnDate.length > 0) {
        return <div className="walk-marker"></div>;
      }
    }
    return null;
  };

  const onDateClick = (date: Date) => {
    const walksOnDate = getWalksForDate(date);
    if (walksOnDate.length > 0) {
      navigate(`/walk/${walksOnDate[0].id}`);
    }
  };
  
  return (
    <div className="calendar-page">
      <h1 className="title">Dog Walk Calendar</h1>
      {loading ? (
        <p>Loading walks...</p>
      ) : (
        <Calendar
          onClickDay={onDateClick}
          tileContent={tileContent}
          className="custom-calendar"
        />
      )}
      <button className="btn-primary" onClick={() => navigate('/walk')}>
        Start a New Walk
      </button>
    </div>
  );
};

export default CalendarPage;
