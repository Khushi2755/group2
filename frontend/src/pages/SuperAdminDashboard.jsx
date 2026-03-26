import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TopNavbar from '../components/TopNavbar';
import './Dashboard.css';

const roleCards = [
  { role: 'Teacher', label: 'Add Teacher' },
  { role: 'Club Coordinator', label: 'Add Club Coordinator' },
  { role: 'Librarian', label: 'Add Librarian' },
  { role: 'Course Registration', label: 'Course Registration' }
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
  const [history, setHistory] = useState([]);
  
  // Course Registration states
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseYear, setCourseYear] = useState(1);
  const [courseSemester, setCourseSemester] = useState(1);
  const [courseDepartment, setCourseDepartment] = useState('ECE');
  const [courseCredits, setCourseCredits] = useState(3);
  const [courseDescription, setCourseDescription] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [facultySearch, setFacultySearch] = useState('');
  const [facultyDeptFilter, setFacultyDeptFilter] = useState('');

  // Fetch history from database
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/auth/created-users');
      setHistory(response.data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  // Fetch teachers for course registration
  const fetchTeachers = async () => {
    try {
      const response = await axios.get('/course-registration/teachers/list');
      setTeachers(response.data);
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
    }
  };

  // Fetch courses
  const fetchCourses = async () => {
    try {
      const response = await axios.get('/course-registration');
      setCourses(response.data);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  };

  useEffect(() => {
    if (activeRole === 'Course Registration') {
      fetchTeachers();
      fetchCourses();
    }
  }, [activeRole]);

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
      
      // Refresh history from database
      await fetchHistory();
      
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

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!courseName || !courseCode) {
      setError('Course name and code are required');
      setLoading(false);
      return;
    }

    try {
      await axios.post('/course-registration', {
        courseName,
        courseCode,
        year: courseYear,
        semester: courseSemester,
        department: courseDepartment,
        faculty: selectedFaculty,
        credits: courseCredits,
        description: courseDescription
      });

      setMessage('Course registered successfully');
      
      // Reset form
      setCourseName('');
      setCourseCode('');
      setCourseYear(1);
      setCourseSemester(1);
      setCourseDepartment('ECE');
      setCourseCredits(3);
      setCourseDescription('');
      setSelectedFaculty([]);
      
      // Refresh courses
      await fetchCourses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register course');
    } finally {
      setLoading(false);
    }
  };

  const handleFacultyToggle = (facultyId) => {
    setSelectedFaculty(prev =>
      prev.includes(facultyId)
        ? prev.filter(id => id !== facultyId)
        : [...prev, facultyId]
    );
  };

  const deleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    
    try {
      await axios.delete(`/course-registration/${courseId}`);
      setMessage('Course deleted successfully');
      await fetchCourses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete course');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      await axios.delete(`/auth/user/${userId}`);
      setMessage('User deleted successfully');
      await fetchHistory();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
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
        ) : activeRole === 'Course Registration' ? (
          <div className="popup-overlay" onClick={() => setActiveRole(null)}>
            <div className="popup-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
              <button className="popup-close" onClick={() => setActiveRole(null)}>
                ✕
              </button>
              <h2>Course Registration</h2>
              <p>Register courses for each year and semester</p>

              <form className="auth-form" onSubmit={handleCourseSubmit} style={{ maxWidth: '100%', overflowY: 'auto', maxHeight: '500px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>Course Name *</label>
                    <input type="text" value={courseName} onChange={(e) => setCourseName(e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label>Course Code *</label>
                    <input type="text" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label>Year *</label>
                    <select value={courseYear} onChange={(e) => {
                      const newYear = Number(e.target.value);
                      setCourseYear(newYear);
                      // Auto-set semester based on year
                      if (newYear === 1) setCourseSemester(1);
                      else if (newYear === 2) setCourseSemester(3);
                      else if (newYear === 3) setCourseSemester(5);
                      else if (newYear === 4) setCourseSemester(7);
                    }}>
                      <option value={1}>1st Year</option>
                      <option value={2}>2nd Year</option>
                      <option value={3}>3rd Year</option>
                      <option value={4}>4th Year</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Semester *</label>
                    <select value={courseSemester} onChange={(e) => setCourseSemester(Number(e.target.value))}>
                      {courseYear === 1 && (
                        <>
                          <option value={1}>Semester 1</option>
                          <option value={2}>Semester 2</option>
                        </>
                      )}
                      {courseYear === 2 && (
                        <>
                          <option value={3}>Semester 3</option>
                          <option value={4}>Semester 4</option>
                        </>
                      )}
                      {courseYear === 3 && (
                        <>
                          <option value={5}>Semester 5</option>
                          <option value={6}>Semester 6</option>
                        </>
                      )}
                      {courseYear === 4 && (
                        <>
                          <option value={7}>Semester 7</option>
                          <option value={8}>Semester 8</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Department *</label>
                    <select value={courseDepartment} onChange={(e) => setCourseDepartment(e.target.value)}>
                      <option value="ECE">ECE</option>
                      <option value="CSE">CSE</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Credits</label>
                    <input type="number" min="1" max="6" value={courseCredits} onChange={(e) => setCourseCredits(Number(e.target.value))} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea value={courseDescription} onChange={(e) => setCourseDescription(e.target.value)} rows="3" />
                </div>

                <div className="form-group">
                  <label>Assign Faculty (select multiple)</label>
                  
                  {/* Search and Filter */}
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      placeholder="Search faculty by name..."
                      value={facultySearch}
                      onChange={(e) => setFacultySearch(e.target.value)}
                      style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    <select
                      value={facultyDeptFilter}
                      onChange={(e) => setFacultyDeptFilter(e.target.value)}
                      style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minWidth: '120px' }}
                    >
                      <option value="">All Branches</option>
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                    </select>
                  </div>

                  {/* Faculty List */}
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
                    {teachers.length === 0 ? (
                      <p style={{ textAlign: 'center', color: '#666', margin: '10px 0' }}>No teachers available</p>
                    ) : (
                      teachers
                        .filter(teacher => {
                          const matchesSearch = teacher.name.toLowerCase().includes(facultySearch.toLowerCase());
                          const matchesDept = !facultyDeptFilter || teacher.department === facultyDeptFilter;
                          return matchesSearch && matchesDept;
                        })
                        .map(teacher => (
                          <div key={teacher._id} style={{ marginBottom: '10px', padding: '8px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', width: '100%' }}>
                              <input
                                type="checkbox"
                                checked={selectedFaculty.includes(teacher._id)}
                                onChange={() => handleFacultyToggle(teacher._id)}
                                style={{ marginRight: '12px', width: '18px', height: '18px', cursor: 'pointer' }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '500', color: '#333' }}>{teacher.name}</div>
                                <div style={{ fontSize: '0.85em', color: '#666', marginTop: '2px' }}>
                                  Branch: {teacher.department || 'N/A'}
                                </div>
                              </div>
                            </label>
                          </div>
                        ))
                    )}
                    {teachers.filter(teacher => {
                      const matchesSearch = teacher.name.toLowerCase().includes(facultySearch.toLowerCase());
                      const matchesDept = !facultyDeptFilter || teacher.department === facultyDeptFilter;
                      return matchesSearch && matchesDept;
                    }).length === 0 && teachers.length > 0 && (
                      <p style={{ textAlign: 'center', color: '#666', margin: '10px 0' }}>No faculty match your search</p>
                    )}
                  </div>
                </div>

                <button type="submit" className="auth-button" disabled={loading}>
                  {loading ? 'Registering...' : 'Register Course'}
                </button>

                {message && <div className="success-message" style={{ marginTop: 12 }}>{message}</div>}
                {error && <div className="error-message" style={{ marginTop: 12 }}>{error}</div>}
              </form>

              <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, color: '#000' }}>Registered Courses ({courses.length})</h3>
                  <button
                    type="button"
                    onClick={fetchCourses}
                    style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Refresh
                  </button>
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto', overflowX: 'auto' }}>
                  <table className="history-table" style={{ width: '100%', minWidth: '800px' }}>
                    <thead>
                      <tr>
                        <th style={{ minWidth: '150px' , color: '#000' }}>Course Name</th>
                        <th style={{ minWidth: '100px' , color: '#000' }}>Code</th>
                        <th style={{ minWidth: '80px' , color: '#000' }}>Year</th>
                        <th style={{ minWidth: '80px' , color: '#000' }}>Semester</th>
                        <th style={{ minWidth: '80px' , color: '#000' }}>Dept</th>
                        <th style={{ minWidth: '100px' , color: '#000' }}>Credits</th>
                        <th style={{ minWidth: '200px' , color: '#000' }}>Faculty Assigned</th>
                        <th style={{ minWidth: '100px' , color: '#000'}}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.length === 0 ? (
                        <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No courses registered yet</td></tr>
                      ) : (
                        courses.map(course => (
                          <tr key={course._id}>
                            <td style={{ fontWeight: '500' }}>{course.courseName}</td>
                            <td style={{ fontFamily: 'monospace', color: '#0066cc' }}>{course.courseCode}</td>
                            <td style={{ textAlign: 'center' }}>{course.year}</td>
                            <td style={{ textAlign: 'center' }}>{course.semester}</td>
                            <td style={{ textAlign: 'center' }}>{course.department}</td>
                            <td style={{ textAlign: 'center' }}>{course.credits}</td>
                            <td style={{ fontSize: '0.9em' }}>
                              {course.faculty && course.faculty.length > 0
                                ? course.faculty.map(f => f.name).join(', ')
                                : <span style={{ color: '#999', fontStyle: 'italic' }}>No faculty assigned</span>
                              }
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                className="remove-button"
                                onClick={() => deleteCourse(course._id)}
                                style={{ padding: '6px 12px', fontSize: '0.9em' }}
                              >
                                Delete
                              </button>
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
          <h3 style={{ color: '#000' }}>History Table</h3>
          <div className="scroll-table">
            <table className="history-table">
              <thead>
                <tr>
                  <th style={{ color: '#000' }} >Name</th>
                  <th style={{ color: '#000' }} >Email</th>
                  <th style={{ color: '#000' }} >Role</th>
                  <th style={{ color: '#000' }} >Department</th>
                  <th style={{ color: '#000' }} >Created At</th>
                  <th style={{ color: '#000' }} >Action</th>
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
                        <button
                          className="remove-button"
                          onClick={() => deleteUser(entry.id)}
                          style={{ padding: '6px 12px', fontSize: '0.9em' }}
                        >
                          Delete
                        </button>
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
