import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiCheckCircle, FiClock, FiUserPlus, FiX } from 'react-icons/fi';
import './Nominations.css';

const Nominations = () => {
  const navigate = useNavigate();
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showNominationForm, setShowNominationForm] = useState(false);
  const [nominationFormData, setNominationFormData] = useState({
    postName: '',
    name: '',
    year: '',
    branch: '',
    rollNo: '',
    cgpa: '',
    hasActiveBacklog: false
  });

  useEffect(() => {
    fetchElection();
  }, []);

  const fetchElection = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/elections/student-dashboard');
      if (response.data?.hasElection && response.data?.election) {
        setElection(response.data.election);
      } else {
        setElection(null);
        setError('No election is available right now');
      }
    } catch (err) {
      setElection(null);
      setError('Failed to fetch election details');
      console.error('Fetch election error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNominateClick = (postName) => {
    setNominationFormData({
      postName,
      name: '',
      year: '',
      branch: '',
      rollNo: '',
      cgpa: '',
      hasActiveBacklog: false
    });
    setShowNominationForm(true);
    setError('');
    setMessage('');
  };

  const handleNominationFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post(`/elections/${election._id}/nominate-request`, nominationFormData);
      setMessage(response.data.message || 'Nomination request submitted successfully');
      setShowNominationForm(false);
      await fetchElection();
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit nomination request');
      console.error('Nomination request error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const isNominationPhaseActive = () => {
    if (!election) return false;
    const now = new Date();
    return election.isActive &&
      new Date(election.nominationStartDate) <= now &&
      new Date(election.nominationEndDate) >= now;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const studentNominationLocked = election?.posts.some((post) => post.userNomineeCandidateId);

  if (loading) {
    return (
      <div className="elections-container">
        <div className="elections-loading">
          <div className="spinner"></div>
          <p>Loading election details...</p>
        </div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="elections-container">
        <div className="elections-empty">
          <FiClock size={64} />
          <h2>No Election Available</h2>
          <p>{error || 'There are no elections available at the moment.'}</p>
          <button className="btn-primary" onClick={() => navigate('/student')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="elections-container">
      <div className="elections-header">
        <button className="btn-back" onClick={() => navigate('/student')}>
          ← Back to Dashboard
        </button>
        <h1>{election.title} - Nominations</h1>
        <p className="election-dates">
          Nomination Period: {formatDate(election.nominationStartDate)} - {formatDate(election.nominationEndDate)}
        </p>
        <div className="election-status">
          {isNominationPhaseActive() ? (
            <span className="status-badge active">
              <FiCheckCircle size={16} />
              Nomination Active
            </span>
          ) : (
            <span className="status-badge inactive">
              <FiClock size={16} />
              Nomination Closed
            </span>
          )}
        </div>
      </div>

      {message && (
        <div className="success-message">
          <FiCheckCircle size={20} />
          {message}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="election-sections">
        <section className="election-section">
          <div className="section-header">
            <h2>I want to be a nominee</h2>
            <p>Choose one post to nominate yourself for this election.</p>
          </div>

          <div className="nominee-grid">
            {election.posts.map((post) => {
              const isNominee = Boolean(post.userNomineeCandidateId);
              const disableNominate = !isNominationPhaseActive() || (studentNominationLocked && !isNominee);

              return (
                <div key={`nominee-${post.name}`} className={`nominee-card ${isNominee ? 'selected' : ''}`}>
                  <div>
                    <h3>{post.name}</h3>
                    <p>{post.candidates.length} candidate(s) currently nominated</p>
                  </div>

                  {isNominee ? (
                    <span className="nominee-status-badge">You are nominated</span>
                  ) : (
                    <button
                      className="btn-nominate"
                      onClick={() => handleNominateClick(post.name)}
                      disabled={disableNominate}
                    >
                      <FiUserPlus size={16} />
                      Nominate
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {!isNominationPhaseActive() && (
            <p className="election-closed">Nomination is available only during the nomination phase.</p>
          )}
        </section>
      </div>

      {/* Nomination Form Modal */}
      {showNominationForm && (
        <div className="modal-overlay" onClick={() => setShowNominationForm(false)}>
          <div className="modal-content nomination-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowNominationForm(false)}>
              <FiX size={24} />
            </button>
            <h2>Nomination Form - {nominationFormData.postName}</h2>
            <p>Fill in your details to submit your nomination request</p>
            
            <form onSubmit={handleNominationFormSubmit} className="nomination-form">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={nominationFormData.name}
                  onChange={(e) => setNominationFormData({...nominationFormData, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Year *</label>
                  <select
                    value={nominationFormData.year}
                    onChange={(e) => setNominationFormData({...nominationFormData, year: e.target.value})}
                    required
                  >
                    <option value="">Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Branch *</label>
                  <select
                    value={nominationFormData.branch}
                    onChange={(e) => setNominationFormData({...nominationFormData, branch: e.target.value})}
                    required
                  >
                    <option value="">Select Branch</option>
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Roll No *</label>
                  <input
                    type="text"
                    value={nominationFormData.rollNo}
                    onChange={(e) => setNominationFormData({...nominationFormData, rollNo: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>CGPA *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={nominationFormData.cgpa}
                    onChange={(e) => setNominationFormData({...nominationFormData, cgpa: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={nominationFormData.hasActiveBacklog}
                    onChange={(e) => setNominationFormData({...nominationFormData, hasActiveBacklog: e.target.checked})}
                  />
                  <span>I have active backlogs</span>
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowNominationForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Nomination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Nominations;

// Made with Bob
