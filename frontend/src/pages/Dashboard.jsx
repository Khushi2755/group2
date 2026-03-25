import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import StudentDashboard from './StudentDashboard';
import CoordinatorDashboardNew from './CoordinatorDashboardNew';
import SuperAdminDashboard from './SuperAdminDashboard';
import AdminLibrary from './AdminLibrary';
import TopNavbar from '../components/TopNavbar';
import './Dashboard.css';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isCourseMaterialModalOpen, setIsCourseMaterialModalOpen] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseYear, setCourseYear] = useState('1st Year');
  const [courseSemester, setCourseSemester] = useState('1st Semester');
  const [courseLink, setCourseLink] = useState('');
  const [courseFile, setCourseFile] = useState(null);
  const [courseError, setCourseError] = useState('');
  const [courseMessage, setCourseMessage] = useState('');
  const [courseLoading, setCourseLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'Student') {
        // Already showing StudentDashboard, no redirect needed
      } else if (user.role === 'Club Coordinator') {
        // Already showing CoordinatorDashboard, no redirect needed
      }
      // Teacher stays on default dashboard
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'var(--bg-primary)'
      }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  // Route to appropriate dashboard based on role
  if (user.role === 'Student') return <StudentDashboard />;
  if (user.role === 'Club Coordinator') return <CoordinatorDashboardNew />;
  if (user.role === 'Super Admin') return <SuperAdminDashboard />;

  // Librarian dashboard: show admin UI inline
  if (user.role === 'Librarian') {
    return (
      <div className="dashboard-container">
        <TopNavbar />
        <div className="dashboard-content">
          <div className="welcome-card">
            <h1>Welcome back, {user?.name}!</h1>
            <p className="role-badge">{user?.role}</p>
          </div>
          <div className="dashboard-message">
            <div style={{ maxWidth: 1100, margin: '20px auto' }}>
              <div className="library-panel" style={{ padding: 20 }}>
                <h2 style={{ marginTop: 0 }}>Add / Update / Delete a Book</h2>
                <p>Use the library admin below to manage book records and PDFs.</p>
                <AdminLibrary />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Teacher dashboard
  if (user.role === 'Teacher') {
    const teacherCards = [
      {
        title: 'Attendance',
        description: 'View and manage attendance records for classes',
        action: () => alert('Attendance screen coming soon'),
      },
      {
        title: 'Results',
        description: 'Upload/view exam scores and student results',
        action: () => alert('Result screen coming soon'),
      },
      {
        title: 'Course Materials',
        description: 'Add books to library and manage course materials',
        action: () => setIsCourseMaterialModalOpen(true),
      },
    ];

    return (
      <div className="dashboard-container">
        <TopNavbar />
        <div className="dashboard-content">
          <div className="welcome-card">
            <h1>Welcome back, {user?.name}!</h1>
            <p className="role-badge">{user?.role}</p>
          </div>

          <div className="card-grid">
            {teacherCards.map((card) => (
              <button
                key={card.title}
                type="button"
                className="role-card"
                onClick={card.action}
              >
                <h3 style={{ fontSize: '1.8rem', margin: 0, textAlign: 'center' }}>
                  {card.title}
                </h3>
              </button>
            ))}
          </div>

          {isCourseMaterialModalOpen && (
            <div className="popup-overlay" onClick={() => setIsCourseMaterialModalOpen(false)}>
              <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                <button className="popup-close" onClick={() => setIsCourseMaterialModalOpen(false)}>
                  ✕
                </button>
                <h2>Add Course Material (Book)</h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setCourseError('');
                    setCourseMessage('');

                    if (!courseTitle.trim()) {
                      setCourseError('Book name is required.');
                      return;
                    }

                    if (!courseLink.trim() && !courseFile) {
                      setCourseError('Either PDF file or external link is required.');
                      return;
                    }

                    setCourseLoading(true);
                    try {
                      const formData = new FormData();
                      formData.append('title', courseTitle.trim());
                      formData.append('author', user?.name || '');
                      formData.append('shelf', 'Shelf A');
                      formData.append('year', courseYear);
                      formData.append('semester', courseSemester);
                      formData.append('available', true);
                      if (courseFile) {
                        if (courseFile.type !== 'application/pdf') {
                          throw new Error('Only PDF files are allowed');
                        }
                        formData.append('file', courseFile);
                      }
                      if (courseLink.trim()) {
                        formData.append('link', courseLink.trim());
                      }

                      await axios.post('/library/books', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                      });

                      setCourseMessage('Book successfully added to library.');
                      setCourseTitle('');
                      setCourseYear('1st Year');
                      setCourseSemester('1st Semester');
                      setCourseLink('');
                      setCourseFile(null);
                    } catch (err) {
                      setCourseError(err.response?.data?.message || err.message || 'Could not add course material.');
                    } finally {
                      setCourseLoading(false);
                    }
                  }}
                >
                  <div className="form-group">
                    <label>Book Name *</label>
                    <input
                      type="text"
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Year</label>
                    <select value={courseYear} onChange={(e) => setCourseYear(e.target.value)} required>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Semester</label>
                    <select value={courseSemester} onChange={(e) => setCourseSemester(e.target.value)} required>
                      <option value="1st Semester">1st Semester</option>
                      <option value="2nd Semester">2nd Semester</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Book PDF (optional if external link provided)</label>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setCourseFile(e.target.files?.[0] || null)}
                    />
                  </div>

                  <div className="form-group">
                    <label>External Book Link (optional if PDF provided)</label>
                    <input
                      type="url"
                      value={courseLink}
                      placeholder="https://example.com/book.pdf"
                      onChange={(e) => setCourseLink(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="auth-button" disabled={courseLoading}>
                    {courseLoading ? 'Adding...' : 'Add Book'}
                  </button>

                  {courseMessage && <div className="success-message" style={{ marginTop: '12px' }}>{courseMessage}</div>}
                  {courseError && <div className="error-message" style={{ marginTop: '12px' }}>{courseError}</div>}
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default fallback for any role not handled
  return (
    <div className="dashboard-container">
      <TopNavbar />
      <div className="dashboard-content">
        <div className="welcome-card">
          <h1>Welcome back, {user?.name}!</h1>
          <p className="role-badge">{user?.role}</p>
        </div>
        <div className="dashboard-message">
          <p>Welcome to your dashboard!</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
