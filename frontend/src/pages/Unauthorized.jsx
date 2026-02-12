import { Link } from 'react-router-dom';
import { FiAlertCircle } from 'react-icons/fi';
import './Unauthorized.css';

const Unauthorized = () => {
  return (
    <div className="unauthorized-container">
      <div className="unauthorized-content">
        <FiAlertCircle className="unauthorized-icon" />
        <h1>403 - Unauthorized Access</h1>
        <p>You don't have permission to access this page.</p>
        <Link to="/dashboard" className="back-button">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
