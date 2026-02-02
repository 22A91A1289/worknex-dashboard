import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Applications from './pages/Applications';
import Payments from './pages/Payments';
import Profile from './pages/Profile';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Signup from './pages/Signup';
import Layout from './components/Layout';

function AppRoutes() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(localStorage.getItem('isAuthenticated') === 'true');
    };

    // Check auth on mount and when storage changes
    checkAuth();
    window.addEventListener('storage', checkAuth);

    // Custom event for same-tab auth changes
    window.addEventListener('authChange', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('authChange', checkAuth);
    };
  }, []);

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/dashboard" replace />} />
      <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPassword /> : <Navigate to="/dashboard" replace />} />
      <Route path="/signup" element={!isAuthenticated ? <Signup setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/dashboard" replace />} />
      <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="applications" element={<Applications />} />
            <Route path="payments" element={<Payments />} />
            <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
