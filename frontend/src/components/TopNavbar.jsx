import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FiSun, FiMoon, FiLogOut } from 'react-icons/fi';
import './TopNavbar.css';

const TopNavbar = () => {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="dashboard-nav">
      <div className="nav-brand">
        <h2>Academix</h2>
      </div>
      <div className="nav-actions">
        <span className="nav-user">{user?.name || 'Guest'} ({user?.role || 'Unauthenticated'})</span>
        <button className="theme-toggle-nav" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
        </button>
        <button className="logout-button" onClick={handleLogout}>
          <FiLogOut size={18} />
          Logout
        </button>
      </div>
    </nav>
  );
};

export default TopNavbar;
