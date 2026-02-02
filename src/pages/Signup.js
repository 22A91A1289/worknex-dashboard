import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';
import { api, setAuth } from '../services/api';

const Signup = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    location: '',
    role: 'owner', // For web dashboard, default to owner/employer
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (!formData.name.trim() || !formData.email.trim() || 
        !formData.phone.trim() || !formData.password || 
        !formData.confirmPassword || !formData.location.trim()) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      // Register via backend API
      const result = await api.post('/api/auth/register', {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: 'owner', // Web dashboard is for employers/owners
        location: formData.location.trim(),
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
      console.error('Signup error:', err);
      setError(err?.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>WORKNEX</h1>
          <p>Create Employer Account</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="employer@worknex.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Phone Number *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+91 9876543210"
              required
            />
          </div>

          <div className="form-group">
            <label>Location *</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="e.g., Srikakulam, Andhra Pradesh"
              required
            />
          </div>

          <div className="form-group">
            <label>Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter your password (min 6 characters)"
                required
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6B7280',
                  fontSize: '18px',
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirm your password"
                required
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6B7280',
                  fontSize: '18px',
                }}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message" style={{ color: '#EF4444', marginBottom: '16px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary login-btn" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <div className="login-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#4F46E5', textDecoration: 'none', fontWeight: '500' }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
