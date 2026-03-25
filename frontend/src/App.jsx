import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import StudentDashboard from './pages/StudentDashboard';
import CoordinatorDashboardNew from './pages/CoordinatorDashboardNew';
import ClubTypeDetails from './pages/ClubTypeDetails';
import Home from './pages/Home';
import Unauthorized from './pages/Unauthorized';
import Library from './pages/Library';
import AdminLibrary from './pages/AdminLibrary';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin"
              element={
                <ProtectedRoute allowedRoles={['Super Admin']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/*"
              element={
                <ProtectedRoute allowedRoles={['Student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/library"
              element={
                <ProtectedRoute allowedRoles={['Student']}>
                  <Library />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/*"
              element={
                <ProtectedRoute allowedRoles={['Teacher']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coordinator/*"
              element={
                <ProtectedRoute allowedRoles={['Club Coordinator']}>
                  <CoordinatorDashboardNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clubs/:type"
              element={
                <ProtectedRoute allowedRoles={['Club Coordinator']}>
                  <ClubTypeDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/librarian/library"
              element={
                <ProtectedRoute allowedRoles={['Librarian']}>
                  <AdminLibrary />
                </ProtectedRoute>
              }
            />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/" element={<Home />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
