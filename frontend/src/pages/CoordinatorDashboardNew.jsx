import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TopNavbar from '../components/TopNavbar';
import './CoordinatorDashboard.css';

const CoordinatorDashboardNew = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const response = await axios.get('/clubs');
        const myClubs = response.data.filter(club =>
          club.coordinator._id === user?._id || club.coordinator.coordinatorId === user?.coordinatorId
        );
        setClubs(myClubs);
      } catch (error) {
        console.error('Error fetching clubs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, [user]);

  const clubTypes = [
    { name: 'Technical', icon: '💻', color: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' },
    { name: 'Cultural', icon: '🎭', color: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)' },
    { name: 'Sports', icon: '⚽', color: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' }
  ];

  const getClubCountByType = (type) => clubs.filter(club => (club.type || 'Sports') === type).length;

  const handleClubTypeClick = (type) => {
    navigate(`/clubs/${type}`);
  };

  return (
    <div className="coordinator-dashboard">
      <TopNavbar />
      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Welcome, {user?.name}!</h1>
          <p className="role-badge">Club Coordinator • ID: {user?.coordinatorId}</p>
          <p className="dashboard-subtitle">Choose a club category to view and manage clubs</p>
        </div>

        <div className="clubs-header">
          <h2>Club Categories</h2>
        </div>

        {loading ? (
          <p className="loading-message">Loading club categories...</p>
        ) : (
          <div className="club-types-grid">
            {clubTypes.map((type) => (
              <div key={type.name} className="club-type-card" onClick={() => handleClubTypeClick(type.name)}>
                <div className="type-card-gradient" style={{ background: type.color }}>
                  <span className="type-icon">{type.icon}</span>
                </div>
                <div className="type-card-content">
                  <h3>{type.name} Clubs</h3>
                  <p className="type-count">{getClubCountByType(type.name)} club(s) managed by you</p>
                  <p className="type-hint">Click to manage {type.name.toLowerCase()} clubs</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoordinatorDashboardNew;
