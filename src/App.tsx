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
import { db } from './firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import './App.css';

const SEED_MISSIONS = [
  { id: 'walk_1km', title: '1km 산책하기', description: '누적 1km 산책을 달성하세요.', type: 'distance', target: 1000, rewardExp: 50 },
  { id: 'walk_5km', title: '5km 산책하기', description: '누적 5km 산책을 달성하세요.', type: 'distance', target: 5000, rewardExp: 200 },
  { id: 'walk_10times', title: '산책 10회 달성', description: '산책을 총 10회 완료하세요.', type: 'count', target: 10, rewardExp: 150 },
];

const AppContent = () => {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const seedMissions = async () => {
      if (!user) return; // Wait for authentication
      
      const missionsCol = collection(db, 'missions');
      const snapshot = await getDocs(missionsCol);
      if (snapshot.empty) {
        for (const mission of SEED_MISSIONS) {
          const { id, ...data } = mission;
          await setDoc(doc(db, 'missions', id), data);
        }
        console.log('Missions seeded');
      }
    };
    seedMissions();

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500); // 2.5 seconds

    return () => clearTimeout(timer);
  }, [user]); // Add user as a dependency

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