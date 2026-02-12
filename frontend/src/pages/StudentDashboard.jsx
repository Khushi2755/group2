import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiSun, FiMoon, FiLogOut, FiBook, FiUsers, FiCalendar, FiAward, FiPlus, FiBell } from 'react-icons/fi';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [availableClubs, setAvailableClubs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  useEffect(() => {
    fetchClubs();
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const fetchClubs = async () => {
    try {
      const response = await axios.get('/clubs');
      setClubs(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      setLoading(false);
    }
  };

  const myClubs = clubs.filter(club => 
    club.members.some(member => member._id === user?._id || member.studentId === user?.studentId)
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleEnrollClick = () => {
    setAvailableClubs(clubs.filter(club => 
      !club.members.some(member => member._id === user?._id || member.studentId === user?.studentId)
    ));
    setShowEnrollModal(true);
  };

  const handleEnroll = async (clubId) => {
    try {
      await axios.post(`/clubs/${clubId}/enroll`);
      await fetchClubs();
      setShowEnrollModal(false);
      alert('Enrolled into club successfully!');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to enroll into club';
      alert(message);
      console.error('Enrollment error:', error);
    }
  };

  return (
    <div className="student-dashboard">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <h2>Academix</h2>
        </div>
        <div className="nav-actions">
          <button className="theme-toggle-nav" onClick={toggleTheme}>
            {theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
          </button>
          <button className="logout-button" onClick={handleLogout}>
            <FiLogOut size={18} />
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-layout">
        <div className="dashboard-main">
          <div className="welcome-section">
            <h1>Welcome, {user?.name}!</h1>
            <p className="role-badge">Student • {user?.year || 'N/A'}</p>
          </div>

          <div className="dashboard-cards-row">
          <div className="dashboard-cards">
          {/* Results Card */}
          <div className="dashboard-card">
            <div className="card-icon results">
              <FiAward size={32} />
            </div>
            <h3>Results</h3>
            <p>View your academic results and grades</p>
            <button className="card-button">View Results</button>
          </div>

          {/* Attendance Card */}
          <div className="dashboard-card">
            <div className="card-icon attendance">
              <FiCalendar size={32} />
            </div>
            <h3>Attendance</h3>
            <p>Check your attendance records</p>
            <button className="card-button">View Attendance</button>
          </div>

          {/* Library Card */}
          <div className="dashboard-card">
            <div className="card-icon library">
              <FiBook size={32} />
            </div>
            <h3>Library</h3>
            <p>Browse and manage library resources</p>
            <button className="card-button">Visit Library</button>
          </div>

          {/* Clubs Card */}
          <div className="dashboard-card clubs-card">
            <div className="card-icon clubs">
              <FiUsers size={32} />
            </div>
            <h3>My Clubs</h3>
            <div className="clubs-list">
              {loading ? (
                <p>Loading clubs...</p>
              ) : myClubs.length > 0 ? (
                <ul>
                  {myClubs.map(club => (
                    <li key={club._id}>{club.name}</li>
                  ))}
                </ul>
              ) : (
                <p>No clubs enrolled yet</p>
              )}
            </div>
            <div className="clubs-actions">
              <button className="card-button" onClick={handleEnrollClick}>
                <FiPlus size={18} />
                Enroll in Clubs
              </button>
            </div>
          </div>
          </div>
        <aside className="notifications-panel">
          <div className="notifications-header">
            <FiBell size={22} />
            <span>Notifications</span>
            {notifications.some((n) => !n.read) && (
              <button type="button" className="mark-all-read" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>
          <div className="notifications-list">
            {notificationsLoading ? (
              <p className="notifications-placeholder">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="notifications-placeholder">No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`notification-item ${n.read ? 'read' : ''}`}
                  onClick={() => !n.read && markAsRead(n._id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && !n.read && markAsRead(n._id)}
                >
                  <div className="notification-title">{n.title}</div>
                  <div className="notification-message">{n.message}</div>
                  <div className="notification-time">
                    {new Date(n.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
          </div>
        </div>
      </div>

      {showEnrollModal && (
        <div className="modal-overlay" onClick={() => setShowEnrollModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Available Clubs</h2>
            {availableClubs.length > 0 ? (
              <ul className="available-clubs-list">
                {availableClubs.map(club => (
                  <li key={club._id}>
                    <span>{club.name}</span>
                    <button onClick={() => handleEnroll(club._id)}>Enroll</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No available clubs at the moment</p>
            )}
            <button className="close-button" onClick={() => setShowEnrollModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
