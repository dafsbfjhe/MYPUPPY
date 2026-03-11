import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import CalendarScreen from './screens/CalendarScreen';
import WalkScreen from './screens/WalkScreen';
import WalkDetailScreen from './screens/WalkDetailScreen';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<CalendarScreen />} />
          <Route path="/walk" element={<WalkScreen />} />
          <Route path="/walk/:walkId" element={<WalkDetailScreen />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;