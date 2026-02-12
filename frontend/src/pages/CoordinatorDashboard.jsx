import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiSun, FiMoon, FiLogOut, FiPlus, FiTrash2, FiUsers, FiCalendar, FiX } from 'react-icons/fi';
import './CoordinatorDashboard.css';

const CoordinatorDashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddClubModal, setShowAddClubModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [newClub, setNewClub] = useState({ name: '', description: '' });
  const [newMember, setNewMember] = useState({ studentId: '' });
  const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', location: '' });

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const response = await axios.get('/clubs');
      // Filter clubs where current user is the coordinator
      const myClubs = response.data.filter(club => 
        club.coordinator._id === user?._id || club.coordinator.coordinatorId === user?.coordinatorId
      );
      setClubs(myClubs);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAddClub = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/clubs', newClub);
      setClubs([...clubs, response.data]);
      setNewClub({ name: '', description: '' });
      setShowAddClubModal(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create club');
    }
  };

  const handleDeleteClub = async (clubId) => {
    if (!window.confirm('Are you sure you want to delete this club?')) return;
    
    try {
      await axios.delete(`/clubs/${clubId}`);
      setClubs(clubs.filter(club => club._id !== clubId));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete club');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/clubs/${selectedClub._id}/members`, newMember);
      await fetchClubs();
      setNewMember({ studentId: '' });
      setShowAddMemberModal(false);
      setSelectedClub(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add member');
    }
  };

  const handleDeleteMember = async (clubId, memberId) => {
    try {
      await axios.delete(`/clubs/${clubId}/members/${memberId}`);
      await fetchClubs();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/clubs/${selectedClub._id}/events`, newEvent);
      await fetchClubs();
      setNewEvent({ title: '', description: '', date: '', location: '' });
      setShowAddEventModal(false);
      setSelectedClub(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add event');
    }
  };

  const handleDeleteEvent = async (clubId, eventIndex) => {
    try {
      await axios.delete(`/clubs/${clubId}/events/${eventIndex}`);
      await fetchClubs();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete event');
    }
  };

  return (
    <div className="coordinator-dashboard">
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

      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Welcome, {user?.name}!</h1>
          <p className="role-badge">Club Coordinator • ID: {user?.coordinatorId}</p>
        </div>

        <div className="clubs-header">
          <h2>My Clubs</h2>
          <button className="add-club-button" onClick={() => setShowAddClubModal(true)}>
            <FiPlus size={20} />
            Add New Club
          </button>
        </div>

        {loading ? (
          <p>Loading clubs...</p>
        ) : clubs.length === 0 ? (
          <div className="no-clubs">
            <p>You haven't created any clubs yet. Create your first club!</p>
          </div>
        ) : (
          <div className="clubs-grid">
            {clubs.map(club => (
              <div key={club._id} className="club-card">
                <div className="club-header">
                  <h3>{club.name}</h3>
                  <button 
                    className="delete-club-btn"
                    onClick={() => handleDeleteClub(club._id)}
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
                <p className="club-description">{club.description || 'No description'}</p>
                
                <div className="club-section">
                  <div className="section-header">
                    <FiUsers size={18} />
                    <span>Members ({club.members?.length || 0})</span>
                  </div>
                  <div className="members-list">
                    {club.members && club.members.length > 0 ? (
                      club.members.map(member => (
                        <div key={member._id} className="member-item">
                          <span>{member.name} ({member.studentId})</span>
                          <button 
                            onClick={() => handleDeleteMember(club._id, member._id)}
                            className="remove-btn"
                          >
                            <FiX size={16} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="empty-state">No members yet</p>
                    )}
                  </div>
                  <button 
                    className="action-btn"
                    onClick={() => {
                      setSelectedClub(club);
                      setShowAddMemberModal(true);
                    }}
                  >
                    <FiPlus size={16} />
                    Add Member
                  </button>
                </div>

                <div className="club-section">
                  <div className="section-header">
                    <FiCalendar size={18} />
                    <span>Events ({club.events?.length || 0})</span>
                  </div>
                  <div className="events-list">
                    {club.events && club.events.length > 0 ? (
                      club.events.map((event, index) => (
                        <div key={index} className="event-item">
                          <div>
                            <strong>{event.title}</strong>
                            <p>{new Date(event.date).toLocaleDateString()} • {event.location}</p>
                          </div>
                          <button 
                            onClick={() => handleDeleteEvent(club._id, index)}
                            className="remove-btn"
                          >
                            <FiX size={16} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="empty-state">No events yet</p>
                    )}
                  </div>
                  <button 
                    className="action-btn"
                    onClick={() => {
                      setSelectedClub(club);
                      setShowAddEventModal(true);
                    }}
                  >
                    <FiPlus size={16} />
                    Add Event
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Club Modal */}
      {showAddClubModal && (
        <div className="modal-overlay" onClick={() => setShowAddClubModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Club</h2>
            <form onSubmit={handleAddClub}>
              <div className="form-group">
                <label>Club Name *</label>
                <input
                  type="text"
                  value={newClub.name}
                  onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                  required
                  placeholder="e.g., Basketball Club"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newClub.description}
                  onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                  placeholder="Club description..."
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddClubModal(false)}>Cancel</button>
                <button type="submit">Create Club</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && selectedClub && (
        <div className="modal-overlay" onClick={() => setShowAddMemberModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add Member to {selectedClub.name}</h2>
            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label>Student ID *</label>
                <input
                  type="text"
                  value={newMember.studentId}
                  onChange={(e) => setNewMember({ studentId: e.target.value })}
                  required
                  placeholder="Enter student ID"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddMemberModal(false)}>Cancel</button>
                <button type="submit">Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEventModal && selectedClub && (
        <div className="modal-overlay" onClick={() => setShowAddEventModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add Event to {selectedClub.name}</h2>
            <form onSubmit={handleAddEvent}>
              <div className="form-group">
                <label>Event Title *</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  required
                  placeholder="e.g., Practice Session"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Event description..."
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Date & Time *</label>
                <input
                  type="datetime-local"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="e.g., Main Court"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddEventModal(false)}>Cancel</button>
                <button type="submit">Add Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorDashboard;
