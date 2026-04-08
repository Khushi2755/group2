import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FiPlus, FiTrash2, FiEdit, FiPlay, FiPause, FiEye, FiUserPlus, FiUserMinus, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import './ElectionManagement.css';

const ElectionManagement = () => {
  const { user } = useAuth();
  const [elections, setElections] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [showNominationRequestsModal, setShowNominationRequestsModal] = useState(false);
  const [nominationRequests, setNominationRequests] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [selectedPost, setSelectedPost] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');

  useEffect(() => {
    fetchElections();
    fetchStudents();
  }, []);

  const fetchElections = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/elections');
      setElections(response.data);
    } catch (err) {
      setError('Failed to fetch elections');
      console.error('Fetch elections error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/auth/students');
      setStudents(response.data);
    } catch (err) {
      console.error('Fetch students error:', err);
    }
  };

  const handleCreateElection = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!title || !startDate || !endDate) {
      setError('Please fill all fields');
      return;
    }

    try {
      await axios.post('/elections', {
        title,
        startDate,
        endDate
      });

      setMessage('Election created successfully!');
      setShowCreateModal(false);
      setTitle('');
      setStartDate('');
      setEndDate('');
      await fetchElections();
      
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create election');
    }
  };

  const handleStartElection = async (electionId) => {
    try {
      await axios.patch(`/elections/${electionId}/start`);
      setMessage('Election started successfully!');
      await fetchElections();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start election');
    }
  };

  const handleEndElection = async (electionId) => {
    try {
      await axios.patch(`/elections/${electionId}/end`);
      setMessage('Election ended successfully!');
      await fetchElections();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to end election');
    }
  };

  const handleDeleteElection = async (electionId) => {
    if (!window.confirm('Are you sure you want to delete this election? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/elections/${electionId}`);
      setMessage('Election deleted successfully!');
      await fetchElections();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete election');
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!selectedStudent || !selectedPost) {
      setError('Please select a student and post');
      return;
    }

    try {
      await axios.post(`/elections/${selectedElection._id}/candidates`, {
        postName: selectedPost,
        userId: selectedStudent
      });

      setMessage('Candidate added successfully!');
      setShowCandidateModal(false);
      setSelectedStudent('');
      setSelectedPost('');
      await fetchElections();
      
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add candidate');
    }
  };

  const handleRemoveCandidate = async (electionId, postName, candidateId) => {
    if (!window.confirm('Are you sure you want to remove this candidate?')) {
      return;
    }

    try {
      await axios.delete(`/elections/${electionId}/candidates`, {
        data: { postName, candidateId }
      });

      setMessage('Candidate removed successfully!');
      await fetchElections();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove candidate');
    }
  };

  const openCandidateModal = (election) => {
    setSelectedElection(election);
    setShowCandidateModal(true);
    setSelectedPost(election.posts[0]?.name || '');
  };

  const fetchNominationRequests = async (electionId) => {
    try {
      const response = await axios.get(`/elections/${electionId}/nomination-requests`);
      setNominationRequests(response.data);
      setShowNominationRequestsModal(true);
    } catch (err) {
      setError('Failed to fetch nomination requests');
      console.error('Fetch nomination requests error:', err);
    }
  };

  const handleReviewRequest = async (electionId, requestId, action) => {
    try {
      await axios.patch(`/elections/${electionId}/nomination-requests/${requestId}`, { action });
      setMessage(`Nomination request ${action}d successfully!`);
      
      // Refresh nomination requests
      await fetchNominationRequests(electionId);
      await fetchElections();
      
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} nomination request`);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="election-management">
      <div className="management-header">
        <h2>Election Management</h2>
        <button className="btn-create" onClick={() => setShowCreateModal(true)}>
          <FiPlus size={20} />
          Create Election
        </button>
      </div>

      {message && (
        <div className="success-message">
          {message}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading elections...</p>
        </div>
      ) : elections.length === 0 ? (
        <div className="empty-state">
          <p>No elections created yet. Create your first election!</p>
        </div>
      ) : (
        <div className="elections-list">
          {elections.map((election) => (
            <div key={election._id} className={`election-item ${election.isActive ? 'active' : ''}`}>
              <div className="election-header">
                <div>
                  <h3>{election.title}</h3>
                  <p className="election-dates">
                    {formatDate(election.startDate)} - {formatDate(election.endDate)}
                  </p>
                </div>
                <div className="election-actions">
                  {election.isActive ? (
                    <button
                      className="btn-action btn-pause"
                      onClick={() => handleEndElection(election._id)}
                      title="End Election"
                    >
                      <FiPause size={18} />
                    </button>
                  ) : (
                    <button
                      className="btn-action btn-start"
                      onClick={() => handleStartElection(election._id)}
                      title="Start Election"
                    >
                      <FiPlay size={18} />
                    </button>
                  )}
                  <button
                    className="btn-action btn-requests"
                    onClick={() => {
                      setSelectedElection(election);
                      fetchNominationRequests(election._id);
                    }}
                    title="View Nomination Requests"
                  >
                    <FiClock size={18} />
                  </button>
                  <button
                    className="btn-action btn-add"
                    onClick={() => openCandidateModal(election)}
                    title="Add Candidate"
                  >
                    <FiUserPlus size={18} />
                  </button>
                  <button
                    className="btn-action btn-delete"
                    onClick={() => handleDeleteElection(election._id)}
                    title="Delete Election"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="posts-grid">
                {election.posts.map((post) => (
                  <div key={post.name} className="post-section">
                    <div className="post-title">
                      <h4>{post.name}</h4>
                      <span className="max-votes-badge">
                        Max {post.maxVotes} {post.maxVotes === 1 ? 'vote' : 'votes'}
                      </span>
                    </div>
                    <div className="candidates-grid">
                      {post.candidates.length === 0 ? (
                        <p className="no-candidates">No candidates yet</p>
                      ) : (
                        post.candidates.map((candidate) => (
                          <div key={candidate._id} className="candidate-card">
                            <div className="candidate-info">
                              <strong>{candidate.name}</strong>
                              <span>{candidate.department} • {candidate.year}</span>
                            </div>
                            <button
                              className="btn-remove"
                              onClick={() => handleRemoveCandidate(election._id, post.name, candidate._id)}
                              title="Remove Candidate"
                            >
                              <FiUserMinus size={16} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="post-stats">
                      <span>{post.candidates.length} candidates</span>
                      <span>{post.voters.length} voters</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Election Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Election</h3>
            <form onSubmit={handleCreateElection}>
              <div className="form-group">
                <label>Election Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Student Council Election 2024"
                  required
                />
              </div>

              <div className="form-group">
                <label>Start Date & Time *</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={getMinDateTime()}
                  required
                />
              </div>

              <div className="form-group">
                <label>End Date & Time *</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || getMinDateTime()}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Create Election
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      {showCandidateModal && selectedElection && (
        <div className="modal-overlay" onClick={() => setShowCandidateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add Candidate to {selectedElection.title}</h3>
            <form onSubmit={handleAddCandidate}>
              <div className="form-group">
                <label>Select Post *</label>
                <select
                  value={selectedPost}
                  onChange={(e) => setSelectedPost(e.target.value)}
                  required
                >
                  {selectedElection.posts.map((post) => (
                    <option key={post.name} value={post.name}>
                      {post.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Select Student *</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  required
                >
                  <option value="">-- Select a student --</option>
                  {students.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.name} ({student.studentId}) - {student.department} - {student.year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowCandidateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Add Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Nomination Requests Modal */}
      {showNominationRequestsModal && selectedElection && (
        <div className="modal-overlay" onClick={() => setShowNominationRequestsModal(false)}>
          <div className="modal-content nomination-requests-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Nomination Requests - {selectedElection.title}</h3>
            
            {nominationRequests.length === 0 ? (
              <p className="no-requests">No nomination requests yet</p>
            ) : (
              <div className="requests-list">
                {nominationRequests.map((request) => (
                  <div key={request._id} className={`request-card ${request.status}`}>
                    <div className="request-header">
                      <h4>{request.name}</h4>
                      <span className={`status-badge ${request.status}`}>
                        {request.status === 'pending' && <FiClock size={14} />}
                        {request.status === 'approved' && <FiCheckCircle size={14} />}
                        {request.status === 'rejected' && <FiXCircle size={14} />}
                        {request.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="request-details">
                      <div className="detail-row">
                        <span className="label">Post:</span>
                        <span className="value">{request.postName}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Year:</span>
                        <span className="value">{request.year}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Branch:</span>
                        <span className="value">{request.branch}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Roll No:</span>
                        <span className="value">{request.rollNo}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">CGPA:</span>
                        <span className="value">{request.cgpa}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Active Backlogs:</span>
                        <span className={`value ${request.hasActiveBacklog ? 'warning' : 'success'}`}>
                          {request.hasActiveBacklog ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Submitted:</span>
                        <span className="value">{formatDate(request.submittedAt)}</span>
                      </div>
                    </div>

                    {request.status === 'pending' && (
                      <div className="request-actions">
                        <button
                          className="btn-approve"
                          onClick={() => handleReviewRequest(selectedElection._id, request._id, 'approve')}
                        >
                          <FiCheckCircle size={16} />
                          Approve
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => handleReviewRequest(selectedElection._id, request._id, 'reject')}
                        >
                          <FiXCircle size={16} />
                          Reject
                        </button>
                      </div>
                    )}

                    {request.status !== 'pending' && request.reviewedAt && (
                      <div className="review-info">
                        <small>Reviewed on {formatDate(request.reviewedAt)}</small>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowNominationRequestsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElectionManagement;

// Made with Bob
