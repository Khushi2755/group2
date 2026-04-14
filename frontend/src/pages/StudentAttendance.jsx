import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import TopNavbar from '../components/TopNavbar';
import './Result.css';

const StudentAttendance = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [attendanceData, setAttendanceData] = useState(null);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchCourses();
  }, [user]);

  useEffect(() => {
    if (!selectedCourseId) {
      setAttendanceData(null);
      return;
    }
    fetchAttendance(selectedCourseId);
  }, [selectedCourseId]);

  const fetchCourses = async () => {
    setCoursesLoading(true);
    setError('');

    try {
      const res = await axios.get('/attendance/student/courses');
      setCourses(res.data);
      if (res.data.length > 0) {
        setSelectedCourseId(res.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to load enrolled attendance courses:', err);
      setError(err.response?.data?.message || 'Unable to load enrolled courses.');
    } finally {
      setCoursesLoading(false);
    }
  };

  const fetchAttendance = async (courseId) => {
    setAttendanceLoading(true);
    setError('');
    setAttendanceData(null);

    try {
      const res = await axios.get(`/attendance/student/course/${courseId}`);
      setAttendanceData(res.data);
    } catch (err) {
      console.error('Failed to load attendance details:', err);
      setError(err.response?.data?.message || 'Unable to load attendance details.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  return (
    <div className="dashboard-container results-page">
      <TopNavbar />
      <div className="dashboard-content">
        <div className="welcome-card">
          <h1 style={{ color: 'black' }}>Attendance</h1>
          <p className="role-badge" style={{ color: 'black' }}>{user?.name} • {user?.role}</p>
          <p style={{ color: 'black' }}>Select one of your enrolled courses to review attendance history, monthly breakdown, and overall percentage.</p>
        </div>

        <div className="results-grid">
          <section className="result-card">
            <div className="section-header">
              <h2>Enrolled Courses</h2>
            </div>

            {coursesLoading ? (
              <p>Loading courses...</p>
            ) : courses.length === 0 ? (
              <p>You have no enrolled courses. Please enroll using the Results page first.</p>
            ) : (
              <>
                <div className="select-group">
                  <label htmlFor="selectedCourse">Select a course</label>
                  <select
                    id="selectedCourse"
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                  >
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.courseName} ({course.courseCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="table-wrapper">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>Course Code</th>
                        <th>Course Name</th>
                        <th>Year</th>
                        <th>Semester</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course) => (
                        <tr
                          key={course._id}
                          className={selectedCourseId === course._id ? 'selected-row' : ''}
                        >
                          <td>{course.courseCode}</td>
                          <td>{course.courseName}</td>
                          <td>{course.year}</td>
                          <td>{course.semester}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>

          <section className="result-card">
            <div className="section-header">
              <h2>Attendance Summary</h2>
            </div>

            {error && <p className="error-text">{error}</p>}

            {attendanceLoading ? (
              <p>Loading attendance details...</p>
            ) : !selectedCourseId ? (
              <p>Select a course to display attendance data.</p>
            ) : !attendanceData ? (
              <p>No attendance records available yet for this course.</p>
            ) : (
              <>
                <div className="marks-panel">
                  <div className="marks-card">
                    <span className="marks-label">Total Classes</span>
                    <strong>{attendanceData.stats.total}</strong>
                  </div>
                  <div className="marks-card">
                    <span className="marks-label">Present</span>
                    <strong>{attendanceData.stats.present}</strong>
                  </div>
                  <div className="marks-card">
                    <span className="marks-label">Absent</span>
                    <strong>{attendanceData.stats.absent}</strong>
                  </div>
                  <div className="marks-card">
                    <span className="marks-label">Attendance %</span>
                    <strong>{attendanceData.stats.percent}%</strong>
                  </div>
                </div>

                <div className="attendance-chart-section">
                  <h3>Monthly Attendance Trend</h3>
                  {attendanceData.monthlySummary.length === 0 ? (
                    <p>No chart data available yet.</p>
                  ) : (
                    <div className="attendance-chart">
                      {attendanceData.monthlySummary.map((month) => (
                        <div className="attendance-bar-row" key={month.month}>
                          <span className="attendance-bar-label">{month.month}</span>
                          <div className="attendance-bar-track">
                            <div
                              className="attendance-bar-fill"
                              style={{ width: `${month.percent}%` }}
                            />
                          </div>
                          <span className="attendance-bar-value">{month.percent}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="course-summary">
                  <h3 style={{ marginTop: '1.5rem' }}>Monthly Breakdown</h3>
                  {attendanceData.monthlySummary.length === 0 ? (
                    <p>No monthly attendance data available yet.</p>
                  ) : (
                    <div className="table-wrapper">
                      <table className="results-table">
                        <thead>
                          <tr>
                            <th>Month</th>
                            <th>Present</th>
                            <th>Absent</th>
                            <th>Total</th>
                            <th>%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceData.monthlySummary.map((month) => (
                            <tr key={month.month}>
                              <td>{month.month}</td>
                              <td>{month.present}</td>
                              <td>{month.absent}</td>
                              <td>{month.total}</td>
                              <td>{month.percent}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="course-summary" style={{ marginTop: '1.5rem' }}>
                  <h3>Date-wise Attendance</h3>
                  {attendanceData.datewise.length === 0 ? (
                    <p>No date-wise attendance records found.</p>
                  ) : (
                    <div className="table-wrapper">
                      <table className="results-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceData.datewise.map((record) => (
                            <tr key={`${record.date}-${record.status}`}> 
                              <td>{record.date}</td>
                              <td style={{ textTransform: 'capitalize' }}>{record.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendance;
