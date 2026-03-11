import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './screens/HomePage'; // New Main Page
import ProfileScreen from './screens/ProfileScreen'; // New Profile Page
import CalendarPage from './screens/CalendarPage'; // Existing Calendar, now at /calendar
import WalkScreen from './screens/WalkScreen';
import WalkDetailScreen from './screens/WalkDetailScreen';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/walk" element={<WalkScreen />} />
          <Route path="/walk/:walkId" element={<WalkDetailScreen />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;