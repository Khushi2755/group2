import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import StudentDashboard from './pages/StudentDashboard';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import Home from './pages/Home';
import Unauthorized from './pages/Unauthorized';

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
              path="/student/*"
              element={
                <ProtectedRoute allowedRoles={['Student']}>
                  <StudentDashboard />
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
                  <CoordinatorDashboard />
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
