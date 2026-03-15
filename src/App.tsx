import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './screens/HomePage'; // New Main Page
import ProfileScreen from './screens/ProfileScreen'; // New Profile Page
import CalendarPage from './screens/CalendarPage'; // Existing Calendar, now at /calendar
import WalkScreen from './screens/WalkScreen';
import WalkDetailScreen from './screens/WalkDetailScreen';
import LoginScreen from './screens/LoginScreen';
import SplashScreen from './screens/SplashScreen';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500); // 2.5 seconds

    return () => clearTimeout(timer);
  }, []);

  // Show splash screen for at least 2.5 seconds or while loading auth state
  if (showSplash || loading) {
    return <SplashScreen />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/walk" element={<WalkScreen />} />
          <Route path="/walk/:walkId" element={<WalkDetailScreen />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;