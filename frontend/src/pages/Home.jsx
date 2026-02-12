import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="home-container">
      <button className="theme-toggle" onClick={toggleTheme}>
        {theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
      </button>

      <div className="home-content">
        <div className="home-hero">
          <h1>Academix</h1>
          <p>
            A modern academic management system built for students, teachers, and club coordinators.
            Manage courses, track performance, and explore campus life in one unified platform.
          </p>
          <div className="home-actions">
            <button className="primary-btn" onClick={() => navigate('/login')}>
              Sign In
            </button>
            <button className="secondary-btn" onClick={() => navigate('/register')}>
              Sign Up
            </button>
          </div>
        </div>

        <div className="home-highlight">
          <div className="highlight-card">
            <h3>For Students</h3>
            <p>View results, attendance, library info, and join campus clubs effortlessly.</p>
          </div>
          <div className="highlight-card">
            <h3>For Teachers</h3>
            <p>Manage courses, assignments, and academic progress with clarity.</p>
          </div>
          <div className="highlight-card">
            <h3>For Club Coordinators</h3>
            <p>Create clubs, manage members, and publish events that reach every member.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

