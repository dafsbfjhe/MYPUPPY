import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { getWalks } from '../services/walkService';
import type { Walk } from '../services/walkService';
import './CalendarPage.css'; // Updated CSS import

const CalendarPage: React.FC = () => { // Updated component name
  const [walks, setWalks] = useState<Walk[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Hardcoded user for now
  const userId = 'test-user';

  useEffect(() => {
    const fetchWalks = async () => {
      try {
        setLoading(true);
        const fetchedWalks = await getWalks(userId);
        setWalks(fetchedWalks);
      } catch (error) {
        console.error("Failed to fetch walks", error);
        // Handle error display
      } finally {
        setLoading(false);
      }
    };
    fetchWalks();
  }, []);

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
      // For simplicity, navigate to the first walk of the day
      navigate(`/walk/${walksOnDate[0].id}`);
    } else {
        // Optionally navigate to a page to add a walk for this date
        // navigate(`/walk/new?date=${date.toISOString()}`);
    }
  };
  
  return (
    <div className="calendar-page"> {/* Updated class name */}
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
