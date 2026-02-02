import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';
import { api, setAuth } from '../services/api';

const Login = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Login to backend API
      const result = await api.post('/api/auth/login', {
        email: email.trim().toLowerCase(),
        password: password,
      });

      // Store auth token and user
      setAuth(result.token, result.user);

      // Update parent component state
      if (setIsAuthenticated) {
        setIsAuthenticated(true);
      }
      
      // Dispatch custom event for same-tab updates
      window.dispatchEvent(new Event('authChange'));
      
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>WORKNEX</h1>
          <p>Employer Dashboard</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="employer@worknex.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            <div style={{ textAlign: 'right', marginTop: '6px' }}>
              <Link to="/forgot-password" style={{ color: '#4F46E5', fontSize: '13px', textDecoration: 'none' }}>
                Forgot Password?
              </Link>
            </div>
          </div>
          {error && (
            <div className="error-message" style={{ color: '#EF4444', marginBottom: '16px', fontSize: '14px' }}>
              {error}
            </div>
          )}
          <button type="submit" className="btn btn-primary login-btn" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: '#4F46E5', textDecoration: 'none', fontWeight: '500' }}>
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
