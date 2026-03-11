import React from 'react';
import { NavLink } from 'react-router-dom';
import './BottomNavigation.css';

const BottomNavigation: React.FC = () => {
  return (
    <nav className="bottom-navigation">
      <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
        <i className="icon-map"></i> {/* Placeholder for map icon */}
        <span>Map</span>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
        <i className="icon-profile"></i> {/* Placeholder for profile icon */}
        <span>Profile</span>
      </NavLink>
      <NavLink to="/calendar" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
        <i className="icon-calendar"></i> {/* Placeholder for calendar icon */}
        <span>Calendar</span>
      </NavLink>
    </nav>
  );
};

export default BottomNavigation;
