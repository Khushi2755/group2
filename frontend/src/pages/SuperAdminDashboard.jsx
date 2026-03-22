import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TopNavbar from '../components/TopNavbar';
import './Dashboard.css';

const roleCards = [
  { role: 'Teacher', label: 'Add Teacher' },
  { role: 'Club Coordinator', label: 'Add Club Coordinator' },
  { role: 'Librarian', label: 'Add Librarian' }
];

const SuperAdminDashboard = () => {
  const [activeRole, setActiveRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('ECE');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('superadmin_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveHistory = (newHistory) => {
    setHistory(newHistory);
    localStorage.setItem('superadmin_history', JSON.stringify(newHistory));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!email || !password) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/auth/create-user', {
        name: name || `${activeRole} Account`,
        email,
        password,
        role: activeRole,
        department: activeRole === 'Teacher' ? department : 'N/A'
      });

      setMessage(`Created ${activeRole} successfully. Reset link: ${response.data.resetLink}`);

      const entry = {
        id: Date.now(),
        role: activeRole,
        name: name || `${activeRole} Account`,
        email,
        department: activeRole === 'Teacher' ? department : 'N/A',
        createdAt: new Date().toLocaleString()
      };

      saveHistory([entry, ...history]);
      setEmail('');
      setPassword('');
      setName('');
      setDepartment('ECE');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = (id) => {
    const updated = history.filter((item) => item.id !== id);
    saveHistory(updated);
  };

  return (
    <div className="dashboard-container">
      <TopNavbar />
      <div className="dashboard-content">
        <div className="welcome-card">
          <h1>Super Admin Panel</h1>
          <p className="role-badge">Super Admin</p>
          <p>Use this panel to create teacher, coordinator and librarian accounts.</p>
        </div>

        <div className="card-grid" style={{ margin: '15px 0' }}>
          {roleCards.map((card) => (
            <button
              key={card.role}
              className={`role-card ${activeRole === card.role ? 'active' : ''}`}
              type="button"
              onClick={() => {
                setActiveRole(card.role);
                setMessage('');
                setError('');
              }}
              onDoubleClick={() => {
                setActiveRole(null);
                setMessage('');
                setError('');
              }}
            >
              {card.label}
            </button>
          ))}
        </div>

        {!activeRole ? (
          <div className="dashboard-message" style={{ textAlign: 'center' }}>
            Select a card above to open the create-user form.
          </div>
        ) : (
          <div className="popup-overlay" onClick={() => setActiveRole(null)}>
            <div className="popup-content" onClick={(e) => e.stopPropagation()}>
              <button className="popup-close" onClick={() => setActiveRole(null)}>
                ✕
              </button>
              <h2>Create {activeRole}</h2>
              <p>Double-click any card to close, or click the X.</p>

              <form className="auth-form" onSubmit={handleSubmit} style={{ maxWidth: 520, overflowY: 'auto', maxHeight: '460px' }}>
                <div className="form-group">
                  <label>Role</label>
                  <input type="text" value={activeRole} disabled />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label>Name (optional)</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                {activeRole === 'Teacher' && (
                  <div className="form-group">
                    <label>Department</label>
                    <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                      <option value="ECE">ECE</option>
                      <option value="CSE">CSE</option>
                    </select>
                  </div>
                )}

                <button type="submit" className="auth-button" disabled={loading}>
                  {loading ? 'Creating...' : `Create ${activeRole}`}
                </button>

                {message && <div className="success-message" style={{ marginTop: 12 }}>{message}</div>}
                {error && <div className="error-message" style={{ marginTop: 12 }}>{error}</div>}
              </form>
            </div>
          </div>
        )}

        <div className="info-cards" style={{ marginTop: '2rem' }}>
          <div className="info-card">
            <div className="info-content">
              <h3>Total Entries</h3>
              <p>{history.length}</p>
            </div>
          </div>
          <div className="info-card">
            <div className="info-content">
              <h3>Last Added</h3>
              <p>{history[0]?.name || 'None'}</p>
            </div>
          </div>
        </div>

        <div className="dashboard-table-wrapper">
          <h3>History Table</h3>
          <div className="scroll-table">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Created At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '12px' }}>No entries yet</td></tr>
                ) : (
                  history.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.name}</td>
                      <td>{entry.email}</td>
                      <td>{entry.role}</td>
                      <td>{entry.department}</td>
                      <td>{entry.createdAt}</td>
                      <td>
                        <button className="remove-button" onClick={() => deleteEntry(entry.id)}>Remove</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
