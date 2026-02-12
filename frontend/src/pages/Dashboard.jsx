import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StudentDashboard from './StudentDashboard';
import CoordinatorDashboard from './CoordinatorDashboard';
import './Dashboard.css';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'Student') {
        // Already showing StudentDashboard, no redirect needed
      } else if (user.role === 'Club Coordinator') {
        // Already showing CoordinatorDashboard, no redirect needed
      }
      // Teacher stays on default dashboard
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'var(--bg-primary)'
      }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  // Route to appropriate dashboard based on role
  if (user.role === 'Student') {
    return <StudentDashboard />;
  }

  if (user.role === 'Club Coordinator') {
    return <CoordinatorDashboard />;
  }

  // Default dashboard for Teacher and others
  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="welcome-card">
          <h1>Welcome back, {user?.name}!</h1>
          <p className="role-badge">{user?.role}</p>
        </div>
        <div className="dashboard-message">
          <p>Teacher dashboard coming soon!</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
