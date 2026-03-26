import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TopNavbar from '../components/TopNavbar';
import './Dashboard.css';

const TeacherAttendance = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [year, setYear] = useState('');
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState('');
  const [attendanceError, setAttendanceError] = useState('');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Course-related states
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [coursesLoading, setCoursesLoading] = useState(false);

  useEffect(() => {
    setHistory([]);
    fetchAssignedCourses();
  }, []);

  const fetchAssignedCourses = async () => {
    setCoursesLoading(true);
    try {
      const response = await axios.get(`/course-registration/faculty/${user._id}`);
      setAssignedCourses(response.data);
    } catch (error) {
      console.error('Failed to fetch assigned courses:', error);
    } finally {
      setCoursesLoading(false);
    }
  };

  // Auto-fill filters when course is selected
  const handleCourseChange = (courseId) => {
    setSelectedCourse(courseId);
    
    if (courseId) {
      const course = assignedCourses.find(c => c._id === courseId);
      if (course) {
        // Auto-fill year, semester, and branch based on selected course
        const yearMap = {
          1: '1st Year',
          2: '2nd Year',
          3: '3rd Year',
          4: '4th Year'
        };
        setYear(yearMap[course.year] || '');
        setSemester(course.semester.toString());
        setBranch(course.department || '');
      }
    }
  };

  const fetchClassStudents = async () => {
    setLoadingStudents(true);
    setAttendanceError('');
    setAttendanceMessage('');
    try {
      const res = await axios.get('/attendance/students', { params: { year, branch, semester } });
      setStudents(res.data.map((s) => ({ ...s, selectedStatus: 'present' })));
      if (res.data.length === 0) {
        setAttendanceMessage('No students found for selected filters.');
      } else {
        setAttendanceMessage(`${res.data.length} students loaded.`);
      }
    } catch (error) {
      setAttendanceError(error.response?.data?.message || 'Failed to load students.');
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const submitAttendance = async (e) => {
    e.preventDefault();
    setAttendanceError('');
    setAttendanceMessage('');

    if (students.length === 0) {
      setAttendanceError('Please load students before marking attendance.');
      return;
    }

    if (!selectedCourse) {
      setAttendanceError('Please select a course.');
      return;
    }

    setAttendanceLoading(true);
    try {
      const payload = {
        date,
        year,
        branch,
        semester,
        course: selectedCourse,
        records: students.map((stu) => ({ studentId: stu._id, status: stu.selectedStatus }))
      };
      const res = await axios.post('/attendance/mark', payload);
      setAttendanceMessage(res.data.message || 'Attendance submitted successfully.');
      if (res.data.absentCount >= 5) {
        setAttendanceMessage(`${res.data.message} (High absent count: ${res.data.absentCount})`);
      }
      await fetchAttendanceHistory();
    } catch (error) {
      setAttendanceError(error.response?.data?.message || 'Failed to submit attendance.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const toggleStatus = (studentId, status) => {
    setStudents((prev) => prev.map((s) => (s._id === studentId ? { ...s, selectedStatus: status } : s)));
  };

  const fetchAttendanceHistory = async () => {
    setHistoryLoading(true);
    try {
      if (!year && !branch && !dateFrom && !dateTo && !selectedCourse) {
        setHistory([]);
        return;
      }
      const params = {
        year: year || undefined,
        branch: branch?.trim() || undefined,
        semester: semester || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        course: selectedCourse || undefined
      };
      const res = await axios.get('/attendance/history', { params });
      setHistory(res.data);
    } catch (error) {
      console.error('Failed to fetch history', error);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <TopNavbar />
      <div className="dashboard-content">
        <div className="welcome-card">
          <h1>Teacher Attendance</h1>
          <p className="role-badge">{user?.name} • {user?.role}</p>
          <p>Mark student attendance and review attendance history.</p>
        </div>

        <div className="attendance-section">
          <h2>Attendance Filters</h2>
          <form className="attendance-form" onSubmit={submitAttendance}>
            <div className="form-row">
              <label>Course *</label>
              <select value={selectedCourse} onChange={(e) => handleCourseChange(e.target.value)} required>
                <option value="">Select Course</option>
                {coursesLoading ? (
                  <option disabled>Loading courses...</option>
                ) : assignedCourses.length === 0 ? (
                  <option disabled>No courses assigned</option>
                ) : (
                  assignedCourses.map(course => (
                    <option key={course._id} value={course._id}>
                      {course.courseName} ({course.courseCode}) - Year {course.year}, Sem {course.semester}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="form-row">
              <label>Year (auto-filled)</label>
              <select value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="">Select year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>

            <div className="form-row">
              <label>Semester (auto-filled)</label>
              <select value={semester} onChange={(e) => setSemester(e.target.value)}>
                <option value="">Select Semester</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
                <option value="4">Semester 4</option>
                <option value="5">Semester 5</option>
                <option value="6">Semester 6</option>
                <option value="7">Semester 7</option>
                <option value="8">Semester 8</option>
              </select>
            </div>

            <div className="form-row">
              <label>Branch (auto-filled)</label>
              <input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="e.g., CSE" />
            </div>

            <div className="form-row">
              <label>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div className="form-row" style={{ gridColumn: 'span 2' }}>
              <button type="button" onClick={fetchClassStudents} disabled={loadingStudents}>Load Students</button>
              <button type="submit" disabled={attendanceLoading || loadingStudents}>Save Attendance</button>
              <button type="button" onClick={() => setStudents([])}>Clear</button>
            </div>

            {attendanceError && <p className="error-message">{attendanceError}</p>}
            {attendanceMessage && <p className="success-message">{attendanceMessage}</p>}
          </form>

          <div className="attendance-table-wrapper" style={{ marginTop: 18 }}>
            <h3>Student Attendance Marker</h3>
            {loadingStudents ? (
              <p>Loading students...</p>
            ) : students.length === 0 ? (
              <p>No students loaded.</p>
            ) : (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>ID</th>
                    <th>Present %</th>
                    <th>Present</th>
                    <th>Absent</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((stu) => (
                    <tr key={stu._id}>
                      <td>{stu.name}</td>
                      <td>{stu.studentId}</td>
                      <td>{stu.attendance?.percent?.toFixed(1) ?? 'N/A'}</td>
                      <td>
                        <input type="radio" checked={stu.selectedStatus === 'present'} onChange={() => toggleStatus(stu._id, 'present')} />
                      </td>
                      <td>
                        <input type="radio" checked={stu.selectedStatus === 'absent'} onChange={() => toggleStatus(stu._id, 'absent')} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="attendance-section" style={{ marginTop: 34 }}>
          <h2>Attendance History</h2>
          <div className="form-row">
            <label>Date From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Date To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="form-row" style={{ gridColumn: 'span 2' }}>
            <button onClick={fetchAttendanceHistory} disabled={historyLoading}>Apply History Filter</button>
            <button onClick={() => { setDateFrom(''); setDateTo(''); fetchAttendanceHistory(); }} disabled={historyLoading}>Reset History</button>
            <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
          </div>

          {historyLoading ? (
            <p>Loading history...</p>
          ) : (
            <div className="scroll-table">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Student Name</th>
                    <th>Student ID</th>
                    <th>Year</th>
                    <th>Semester</th>
                    <th>Branch</th>
                    <th>Course</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center' }}>No history records found.</td></tr>
                  ) : (
                    history.map((row) => (
                      <tr key={row.id}>
                        <td>{row.date}</td>
                        <td>{row.studentName}</td>
                        <td>{row.studentId}</td>
                        <td>{row.year}</td>
                        <td>{row.semester || 'N/A'}</td>
                        <td>{row.branch}</td>
                        <td>{row.courseName || 'N/A'}</td>
                        <td>{row.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherAttendance;
