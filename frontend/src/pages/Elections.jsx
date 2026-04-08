import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiCheckCircle, FiClock, FiAward, FiUsers, FiUserPlus, FiX } from 'react-icons/fi';
import './Elections.css';

const Elections = () => {
  const navigate = useNavigate();
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVotes, setSelectedVotes] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [nominatingPost, setNominatingPost] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
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
  const [selectedCandidateDropdown, setSelectedCandidateDropdown] = useState({});
  const [showCandidateDetails, setShowCandidateDetails] = useState(null);

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

  const fetchResults = async () => {
    if (!election) return;
    try {
      const response = await axios.get(`/elections/${election._id}/results`);
      setResults(response.data);
      setShowResults(true);
    } catch (err) {
      setError('Failed to fetch results');
      console.error('Fetch results error:', err);
    }
  };

  const handleVoteSelection = (postName, candidateId, maxVotes) => {
    setSelectedVotes((prev) => {
      const currentVotes = prev[postName] || [];

      if (maxVotes === 1) {
        return { ...prev, [postName]: [candidateId] };
      }

      if (currentVotes.includes(candidateId)) {
        return { ...prev, [postName]: currentVotes.filter((id) => id !== candidateId) };
      }

      if (currentVotes.length < maxVotes) {
        return { ...prev, [postName]: [...currentVotes, candidateId] };
      }

      setError(`You can only select up to ${maxVotes} candidates for ${postName}`);
      return prev;
    });
    setError('');
  };

  const handleSubmitVote = async (postName, isNota = false) => {
    let candidateIds = selectedVotes[postName];
    
    // Check if using dropdown selection
    if (selectedCandidateDropdown[postName] && !isNota) {
      candidateIds = [selectedCandidateDropdown[postName]];
    }

    if (!isNota && (!candidateIds || candidateIds.length === 0)) {
      setError('Please select at least one candidate or NOTA');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      await axios.post(`/elections/${election._id}/vote`, {
        postName,
        candidateIds: isNota ? [] : candidateIds,
        isNota
      });

      setMessage(`Vote submitted successfully for ${postName}${isNota ? ' (NOTA)' : ''}`);
      await fetchElection();

      setSelectedVotes((prev) => {
        const updated = { ...prev };
        delete updated[postName];
        return updated;
      });
      
      setSelectedCandidateDropdown((prev) => {
        const updated = { ...prev };
        delete updated[postName];
        return updated;
      });

      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit vote');
      console.error('Submit vote error:', err);
    } finally {
      setSubmitting(false);
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

  const handleNominate = async (postName) => {
    setNominatingPost(postName);
    setError('');
    setMessage('');

    try {
      const response = await axios.post(`/elections/${election._id}/nominate`, { postName });
      setElection(response.data.election);
      setMessage(response.data.message || `You are now nominated for ${postName}`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit nomination');
      console.error('Nomination error:', err);
    } finally {
      setNominatingPost('');
    }
  };

  const isElectionActive = () => {
    if (!election) return false;
    const now = new Date();
    return election.isActive &&
      new Date(election.startDate) <= now &&
      new Date(election.endDate) >= now;
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

  if (showResults && results) {
    return (
      <div className="elections-container">
        <div className="elections-header">
          <button className="btn-back" onClick={() => setShowResults(false)}>
            ← Back to Election
          </button>
          <h1>{results.title} - Results</h1>
          <p className="election-dates">
            {formatDate(results.startDate)} - {formatDate(results.endDate)}
          </p>
        </div>

        <div className="results-grid">
          {results.results.map((postResult) => (
            <div key={postResult.postName} className="result-card">
              <div className="result-header">
                <h3>{postResult.postName}</h3>
                <span className="voter-count">
                  <FiUsers size={16} />
                  {postResult.totalVoters} voters
                </span>
              </div>

              <div className="candidates-results">
                {postResult.candidates.map((candidate, index) => {
                  const isWinner = postResult.winners.some((winner) => winner._id === candidate._id);
                  return (
                    <div
                      key={candidate._id}
                      className={`candidate-result ${isWinner ? 'winner' : ''}`}
                    >
                      <div className="candidate-info">
                        <div className="candidate-rank">#{index + 1}</div>
                        <div className="candidate-details">
                          <h4>{candidate.name}</h4>
                          <p>{candidate.department} • {candidate.year}</p>
                        </div>
                        {isWinner && (
                          <div className="winner-badge">
                            <FiAward size={20} />
                            Winner
                          </div>
                        )}
                      </div>
                      <div className="vote-count">
                        <span className="votes">{candidate.votes}</span>
                        <span className="votes-label">votes</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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
        <h1>{election.title}</h1>
        <p className="election-dates">
          {formatDate(election.startDate)} - {formatDate(election.endDate)}
        </p>
        <div className="election-status">
          {isElectionActive() ? (
            <span className="status-badge active">
              <FiCheckCircle size={16} />
              Active
            </span>
          ) : (
            <span className="status-badge inactive">
              <FiClock size={16} />
              Inactive
            </span>
          )}
        </div>
        <button className="btn-results" onClick={fetchResults}>
          View Results
        </button>
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
              const disableNominate = !isElectionActive() || (studentNominationLocked && !isNominee);

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

          {!isElectionActive() && (
            <p className="election-closed">Nomination is available only while the election is active.</p>
          )}
        </section>

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

        <section className="election-section">
          <div className="section-header">
            <h2>All candidates and posts</h2>
            <p>View all candidates post-wise and vote for the candidate(s) you want.</p>
          </div>

          <div className="posts-grid">
            {election.posts.map((post) => {
              const voted = Boolean(post.hasUserVoted);
              const maxVotes = post.maxVotes || 1;
              const selectedCount = (selectedVotes[post.name] || []).length;

              return (
                <div key={post.name} className={`post-card ${voted ? 'voted' : ''}`}>
                  <div className="post-header">
                    <h3>{post.name}</h3>
                    {voted && (
                      <span className="voted-badge">
                        <FiCheckCircle size={16} />
                        Voted
                      </span>
                    )}
                  </div>

                  {post.candidates.length === 0 ? (
                    <p className="no-candidates">No candidates yet</p>
                  ) : post.candidates.length > 1 && maxVotes === 1 ? (
                    // Dropdown for multiple candidates with single vote
                    <div className="candidate-dropdown-section">
                      <label className="dropdown-label">Select a candidate:</label>
                      <select
                        className="candidate-dropdown"
                        value={selectedCandidateDropdown[post.name] || ''}
                        onChange={(e) => setSelectedCandidateDropdown({...selectedCandidateDropdown, [post.name]: e.target.value})}
                        disabled={voted || !isElectionActive()}
                      >
                        <option value="">-- Choose a candidate --</option>
                        {post.candidates.map((candidate) => (
                          <option key={candidate._id} value={candidate._id}>
                            {candidate.name} ({candidate.department} • {candidate.year})
                          </option>
                        ))}
                      </select>
                      
                      {selectedCandidateDropdown[post.name] && (
                        <button
                          className="btn-view-details"
                          onClick={() => {
                            const candidate = post.candidates.find(c => c._id === selectedCandidateDropdown[post.name]);
                            setShowCandidateDetails({ candidate, postName: post.name });
                          }}
                        >
                          View Details & Vote
                        </button>
                      )}
                    </div>
                  ) : (
                    // Original list view for single candidate or multiple votes
                    <>
                      <p className="vote-instruction">
                        {maxVotes > 1
                          ? `Select up to ${maxVotes} candidates (${selectedCount}/${maxVotes} selected)`
                          : 'Select 1 candidate'}
                      </p>
                      <div className="candidates-list">
                        {post.candidates.map((candidate) => {
                          const isSelected = (selectedVotes[post.name] || []).includes(candidate._id);

                          return (
                            <div
                              key={candidate._id}
                              className={`candidate-item ${isSelected ? 'selected' : ''} ${voted ? 'disabled' : ''}`}
                              onClick={() => !voted && isElectionActive() && handleVoteSelection(post.name, candidate._id, maxVotes)}
                            >
                              <div className="candidate-select">
                                {maxVotes === 1 ? (
                                  <input
                                    type="radio"
                                    name={post.name}
                                    checked={isSelected}
                                    disabled={voted || !isElectionActive()}
                                    onChange={() => {}}
                                  />
                                ) : (
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={voted || !isElectionActive()}
                                    onChange={() => {}}
                                  />
                                )}
                              </div>

                              <div className="candidate-main">
                                <div className="candidate-info-block">
                                  <h4>{candidate.name}</h4>
                                  <p>{candidate.department} • {candidate.year}</p>
                                </div>
                                <div className="candidate-tags">
                                  {candidate.nominatedByStudent && (
                                    <span className="candidate-tag student-nominee">Student Nominee</span>
                                  )}
                                  {post.userNomineeCandidateId === candidate._id && (
                                    <span className="candidate-tag self-tag">You</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {!voted && post.candidates.length > 0 && isElectionActive() && !(post.candidates.length > 1 && maxVotes === 1) && (
                    <div className="vote-actions">
                      <button
                        className="btn-vote"
                        onClick={() => handleSubmitVote(post.name, false)}
                        disabled={submitting || !selectedVotes[post.name] || selectedVotes[post.name].length === 0}
                      >
                        {submitting ? 'Submitting...' : 'Submit Vote'}
                      </button>
                      <button
                        className="btn-nota"
                        onClick={() => handleSubmitVote(post.name, true)}
                        disabled={submitting}
                      >
                        Vote NOTA
                      </button>
                    </div>
                  )}

                  {!isElectionActive() && (
                    <p className="election-closed">Election is not active</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Candidate Details Modal */}
      {showCandidateDetails && (
        <div className="modal-overlay" onClick={() => setShowCandidateDetails(null)}>
          <div className="modal-content candidate-details-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCandidateDetails(null)}>
              <FiX size={24} />
            </button>
            
            <h2>Candidate Details</h2>
            <div className="candidate-details-content">
              <div className="detail-item">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{showCandidateDetails.candidate.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Department:</span>
                <span className="detail-value">{showCandidateDetails.candidate.department}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Year:</span>
                <span className="detail-value">{showCandidateDetails.candidate.year}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Post:</span>
                <span className="detail-value">{showCandidateDetails.postName}</span>
              </div>
              {showCandidateDetails.candidate.nominatedByStudent && (
                <div className="detail-item">
                  <span className="detail-badge student-nominee-badge">Student Nominee</span>
                </div>
              )}
            </div>

            <div className="candidate-vote-actions">
              <button
                className="btn-vote-candidate"
                onClick={async () => {
                  await handleSubmitVote(showCandidateDetails.postName, false);
                  setShowCandidateDetails(null);
                  setSelectedCandidateDropdown({...selectedCandidateDropdown, [showCandidateDetails.postName]: ''});
                }}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Vote for this Candidate'}
              </button>
              <button
                className="btn-nota-candidate"
                onClick={async () => {
                  await handleSubmitVote(showCandidateDetails.postName, true);
                  setShowCandidateDetails(null);
                  setSelectedCandidateDropdown({...selectedCandidateDropdown, [showCandidateDetails.postName]: ''});
                }}
                disabled={submitting}
              >
                Vote NOTA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Elections;

// Made with Bob
