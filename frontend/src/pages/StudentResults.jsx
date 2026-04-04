import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TopNavbar from '../components/TopNavbar';
import './Result.css';

const StudentResults = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [availableCourses, setAvailableCourses] = useState([]);
  const [enrolledResults, setEnrolledResults] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchAvailableCourses();
    fetchEnrolledResults();
  }, [user]);

  const fetchAvailableCourses = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/results/student/available');
      setAvailableCourses(res.data);
    } catch (err) {
      console.error('Failed to load available courses:', err);
      setError('Unable to load available courses.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledResults = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/results/student');
      setEnrolledResults(res.data);
    } catch (err) {
      console.error('Failed to load enrolled results:', err);
      setError('Unable to load your enrolled courses.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    setEnrollLoading(true);
    setError('');
    setMessage('');
    try {
      await axios.post('/results/enroll', { courseId });
      setMessage('Enrolled in the course successfully.');
      await fetchAvailableCourses();
      await fetchEnrolledResults();
    } catch (err) {
      setError(err.response?.data?.message || 'Enrollment failed.');
    } finally {
      setEnrollLoading(false);
    }
  };

  const selectedResult = enrolledResults.find((item) => item.course?._id === selectedCourseId);

  return (
    <div className="dashboard-container results-page">
      <TopNavbar />
      <div className="dashboard-content">
        <div className="welcome-card">
          <h1 style={{ color : 'black' }}>Results</h1>
          <p className="role-badge" style={{ color : 'black' }}>{user?.name} • {user?.role}</p>
          <p style={{ color : 'black' }}>View your enrolled courses, enroll in your branch/year courses, and check marks.</p>
        </div>

        <div className="results-grid">
          <section className="result-card">
            <div className="section-header">
              <h2>Available Courses</h2>
            </div>
            {loading ? (
              <p>Loading courses...</p>
            ) : availableCourses.length === 0 ? (
              <p>No new courses available for enrollment.</p>
            ) : (
              <div className="table-wrapper">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Name</th>
                      <th>Year</th>
                      <th>Semester</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableCourses.map((course) => (
                      <tr key={course._id}>
                        <td>{course.courseCode}</td>
                        <td>{course.courseName}</td>
                        <td>{course.year}</td>
                        <td>{course.semester}</td>
                        <td>
                          <button
                            disabled={enrollLoading}
                            className="action-button"
                            onClick={() => handleEnroll(course._id)}
                          >
                            Enroll
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="result-card">
            <div className="section-header">
              <h2>My Enrolled Courses</h2>
            </div>
            {loading ? (
              <p>Loading enrolled courses...</p>
            ) : enrolledResults.length === 0 ? (
              <p>You haven&apos;t enrolled in any course yet.</p>
            ) : (
              <>
                <div className="select-group">
                  <label htmlFor="selectedCourse">Select a course</label>
                  <select
                    id="selectedCourse"
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                  >
                    <option value="">Choose a course</option>
                    {enrolledResults.map((item) => (
                      <option key={item._id} value={item.course?._id || item._id}>
                        {item.course?.courseName || 'Unknown Course'} ({item.course?.courseCode || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>
                {selectedResult ? (
                  <div className="marks-panel">
                    <div className="marks-card">
                      <span className="marks-label">CT1</span>
                      <strong>{selectedResult.ct1 ?? 'Pending'}</strong>
                    </div>
                    <div className="marks-card">
                      <span className="marks-label">CT2</span>
                      <strong>{selectedResult.ct2 ?? 'Pending'}</strong>
                    </div>
                    <div className="marks-card">
                      <span className="marks-label">EndSem</span>
                      <strong>{selectedResult.endsem ?? 'Pending'}</strong>
                    </div>
                  </div>
                ) : (
                  <p>Select an enrolled course to view marks.</p>
                )}
              </>
            )}
          </section>
        </div>

        {(message || error) && (
          <div className={`submit-feedback ${error ? 'error' : 'success'}`}>
            {error || message}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentResults;
