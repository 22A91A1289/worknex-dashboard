import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import './Login.scss';
import { api, setAuth } from '../../services/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';

const Login = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (location.state?.passwordReset) {
      setSuccessMessage('Password reset successfully. You can now log in.');
      setShowToast(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await api.post('/api/auth/login', {
        email: email.trim().toLowerCase(),
        password: password,
      });

      setAuth(result.token, result.user);

      if (setIsAuthenticated) {
        setIsAuthenticated(true);
      }
      
      window.dispatchEvent(new Event('authChange'));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err?.message || 'Login failed. Please check your credentials.');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {showToast && (
        <div className="toast-container">
          <Toast 
            message={error || successMessage} 
            type={error ? 'error' : 'success'} 
            onClose={() => setShowToast(false)} 
          />
        </div>
      )}
      <div className="login-card">
        <div className="login-header">
          <h1 style={{ letterSpacing: '-0.025em', marginBottom: '0.25rem' }}>WORKNEX</h1>
          <p style={{ color: '#6B7280', fontSize: '0.975rem' }}>Employer Dashboard</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="employer@worknex.com"
            required
          />
          <div style={{ position: 'relative' }}>
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            <div style={{ textAlign: 'right', marginTop: '-12px', marginBottom: '24px' }}>
              <Link to="/forgot-password" style={{ color: '#4F46E5', fontSize: '13px', textDecoration: 'none', fontWeight: '500' }}>
                Forgot Password?
              </Link>
            </div>
          </div>
          
          <Button 
            type="submit" 
            variant="primary" 
            style={{ width: '100%', padding: '0.75rem' }} 
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        <div className="login-footer" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: '#4F46E5', textDecoration: 'none', fontWeight: '600' }}>
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

