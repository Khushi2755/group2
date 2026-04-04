import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TopNavbar from '../components/TopNavbar';
import './Result.css';

const TeacherResults = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchAssignedCourses();
  }, [user]);

  const fetchAssignedCourses = async () => {
    try {
      const res = await axios.get(`/course-registration/faculty/${user._id}`);
      setAssignedCourses(res.data);
    } catch (err) {
      console.error('Failed to load assigned courses:', err);
      setError('Unable to load assigned courses.');
    }
  };

  const fetchCourseStudents = async (courseId) => {
    if (!courseId) {
      setStudents([]);
      setSelectedCourse(null);
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await axios.get(`/results/teacher/course/${courseId}/students`);
      setSelectedCourse(res.data.course);
      setStudents(res.data.students.map((student) => ({ ...student })));
    } catch (err) {
      console.error('Failed to load course students:', err);
      setError(err.response?.data?.message || 'Unable to load students for this course.');
      setStudents([]);
      setSelectedCourse(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (event) => {
    const courseId = event.target.value;
    setSelectedCourseId(courseId);
    fetchCourseStudents(courseId);
  };

  const handleGradeChange = (studentId, field, value) => {
    setStudents((prev) => prev.map((student) => {
      if (student._id !== studentId) return student;
      return { ...student, [field]: value };
    }));
  };

  const saveGrades = async () => {
    if (!selectedCourseId) {
      setError('Please select a course before saving grades.');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const records = students.map((student) => ({
        studentId: student._id,
        ct1: student.ct1,
        ct2: student.ct2,
        endsem: student.endsem
      }));
      const res = await axios.post('/results/teacher/grades', {
        courseId: selectedCourseId,
        records
      });
      setMessage(res.data.message || 'Grades saved successfully.');
      fetchCourseStudents(selectedCourseId);
    } catch (err) {
      console.error('Failed to save grades:', err);
      setError(err.response?.data?.message || 'Unable to save grades.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-container results-page">
      <TopNavbar />
      <div className="dashboard-content">
        <div className="welcome-card">
          <h1 style={{ color : 'black' }} >Teacher Results</h1>
          <p style={{ color : 'black' }} className="role-badge">{user?.name} • {user?.role} </p>
          <p style={{ color : 'black' }} >Select a course and enter CT1, CT2, or EndSem marks for your students.</p>
        </div>

        <div className="results-grid">
          <section className="result-card course-selection-panel">
            <div className="section-header">
              <h2>Select Course</h2>
            </div>
            <div className="select-group">
              <label htmlFor="teacherCourse">Assigned Courses</label>
              <select id="teacherCourse" value={selectedCourseId} onChange={handleCourseChange}>
                <option value="">Choose a course</option>
                {assignedCourses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.courseName} ({course.courseCode})
                  </option>
                ))}
              </select>
            </div>
            {selectedCourse && (
              <div className="course-summary">
                <p><strong>Year:</strong> {selectedCourse.year}</p>
                <p><strong>Semester:</strong> {selectedCourse.semester}</p>
                <p><strong>Branch:</strong> {selectedCourse.department}</p>
              </div>
            )}
          </section>

          <section className="result-card students-panel">
            <div className="section-header">
              <h2>Class Students</h2>
            </div>
            {loading ? (
              <p>Loading students...</p>
            ) : selectedCourseId === '' ? (
              <p>Select a course to load your class.</p>
            ) : students.length === 0 ? (
              <p>No students found for this course.</p>
            ) : (
              <div className="table-wrapper">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Student ID</th>
                      <th>CT1</th>
                      <th>CT2</th>
                      <th>EndSem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student._id}>
                        <td>{student.name}</td>
                        <td>{student.studentId || 'N/A'}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={student.ct1 ?? ''}
                            onChange={(e) => handleGradeChange(student._id, 'ct1', e.target.value)}
                            placeholder="CT1"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={student.ct2 ?? ''}
                            onChange={(e) => handleGradeChange(student._id, 'ct2', e.target.value)}
                            placeholder="CT2"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={student.endsem ?? ''}
                            onChange={(e) => handleGradeChange(student._id, 'endsem', e.target.value)}
                            placeholder="EndSem"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="save-button" disabled={saving} onClick={saveGrades}>
                  {saving ? 'Saving...' : 'Save Grades'}
                </button>
              </div>
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

export default TeacherResults;
