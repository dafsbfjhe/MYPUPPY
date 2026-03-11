import React from 'react';
import BottomNavigation from './BottomNavigation'; // Import the new navigation component
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout">
      <div className="content">
        {children}
      </div>
      <BottomNavigation /> {/* Render the navigation component */}
    </div>
  );
};

export default Layout;
