import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiPlus, FiTrash2, FiUsers, FiCalendar, FiX, FiArrowLeft } from 'react-icons/fi';
import TopNavbar from '../components/TopNavbar';
import './ClubTypeDetails.css';

const ClubTypeDetails = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { type } = useParams();
  
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddClubModal, setShowAddClubModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [newClub, setNewClub] = useState({ name: '', description: '' });
  const [newMember, setNewMember] = useState({ studentId: '' });
  const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', location: '' });

  const typeIcons = {
    'Technical': '💻',
    'Cultural': '🎭',
    'Sports': '⚽'
  };

  const typeColors = {
    'Technical': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    'Cultural': 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
    'Sports': 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)'
  };

  useEffect(() => {
    fetchClubsByType();
  }, [type]);

  const fetchClubsByType = async () => {
    try {
      const response = await axios.get('/clubs');
      const typeClubs = response.data.filter(club => 
        (club.type || 'Sports') === type && (club.coordinator._id === user?._id || club.coordinator.coordinatorId === user?.coordinatorId)
      );
      setClubs(typeClubs);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      setLoading(false);
    }
  };

  const handleAddClub = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/clubs', {
        ...newClub,
        type: type
      });
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
      await fetchClubsByType();
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
      await fetchClubsByType();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/clubs/${selectedClub._id}/events`, newEvent);
      await fetchClubsByType();
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
      await fetchClubsByType();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete event');
    }
  };

  return (
    <div className="club-type-details">
      <TopNavbar />
      <div className="details-content">
        <div style={{ margin: '10px 0' }}>
          <button className="back-btn" onClick={() => navigate('/clubs')}>
            <FiArrowLeft size={20} /> Back to Club Categories
          </button>
        </div>
        <div className="type-header" style={{ background: typeColors[type] }}>
          <div className="type-header-content">
            <span className="type-header-icon">{typeIcons[type]}</span>
            <div>
              <h1>{type} Clubs</h1>
              <p>{clubs.length} club{clubs.length !== 1 ? 's' : ''} managed by you</p>
            </div>
          </div>
        </div>

        <div className="clubs-management">
          <div className="clubs-toolbar">
            <h2>{type} Clubs Management</h2>
            <button 
              className="btn-add-club"
              onClick={() => setShowAddClubModal(true)}
            >
              <FiPlus size={18} />
              Add New {type} Club
            </button>
          </div>

          {loading ? (
            <div className="loading-message">
              <p>Loading clubs...</p>
            </div>
          ) : clubs.length === 0 ? (
            <div className="empty-state">
              <p>No {type} clubs yet</p>
              <button 
                className="btn-create-first"
                onClick={() => setShowAddClubModal(true)}
              >
                Create Your First {type} Club
              </button>
            </div>
          ) : (
            <div className="clubs-container">
              {clubs.map(club => (
                <div key={club._id} className="club-card-detail">
                  <div className="club-header-detail">
                    <div className="club-title-section">
                      <h3>{club.name}</h3>
                      {club.description && <p className="club-desc-detail">{club.description}</p>}
                    </div>
                    <button 
                      className="delete-club-btn"
                      onClick={() => handleDeleteClub(club._id)}
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>

                  <div className="club-sections">
                    <div className="club-section-detail">
                      <div className="section-title">
                        <FiUsers size={18} />
                        <span>Members ({club.members?.length || 0})</span>
                      </div>
                      <div className="section-content">
                        {club.members && club.members.length > 0 ? (
                          <div className="members-list-detail">
                            {club.members.map(member => (
                              <div key={member._id} className="member-item-detail">
                                <div className="member-info">
                                  <span className="member-name">{member.name}</span>
                                  <span className="member-id">({member.studentId})</span>
                                </div>
                                <button 
                                  onClick={() => handleDeleteMember(club._id, member._id)}
                                  className="remove-btn-detail"
                                >
                                  <FiX size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="empty-message">No members yet</p>
                        )}
                        <button 
                          className="action-btn-detail"
                          onClick={() => {
                            setSelectedClub(club);
                            setShowAddMemberModal(true);
                          }}
                        >
                          <FiPlus size={16} />
                          Add Member
                        </button>
                      </div>
                    </div>

                    <div className="club-section-detail">
                      <div className="section-title">
                        <FiCalendar size={18} />
                        <span>Events ({club.events?.length || 0})</span>
                      </div>
                      <div className="section-content">
                        {club.events && club.events.length > 0 ? (
                          <div className="events-list-detail">
                            {club.events.map((event, index) => (
                              <div key={index} className="event-item-detail">
                                <div className="event-info">
                                  <strong>{event.title}</strong>
                                  <div className="event-meta">
                                    <span>{new Date(event.date).toLocaleDateString()}</span>
                                    {event.location && <span>• {event.location}</span>}
                                  </div>
                                </div>
                                <button 
                                  onClick={() => handleDeleteEvent(club._id, index)}
                                  className="remove-btn-detail"
                                >
                                  <FiX size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="empty-message">No events yet</p>
                        )}
                        <button 
                          className="action-btn-detail"
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Club Modal */}
      {showAddClubModal && (
        <div className="modal-overlay" onClick={() => setShowAddClubModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New {type} Club</h2>
            <form onSubmit={handleAddClub}>
              <div className="form-group">
                <label>Club Name *</label>
                <input
                  type="text"
                  value={newClub.name}
                  onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                  required
                  placeholder={`e.g., ${type} Club Name`}
                  autoFocus
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
                  autoFocus
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
                  autoFocus
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

export default ClubTypeDetails;
