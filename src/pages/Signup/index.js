import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../Login/Login.scss';
import { api, setAuth } from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Toast from '../../components/ui/Toast';

const Signup = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    location: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);

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
      setShowToast(true);
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setShowToast(true);
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setShowToast(true);
      setIsLoading(false);
      return;
    }

    try {
      const result = await api.post('/api/auth/register', {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: 'owner', // Web dashboard is for employers/owners
        location: formData.location.trim(),
      });

      setAuth(result.token, result.user);

      if (setIsAuthenticated) {
        setIsAuthenticated(true);
      }
      
      window.dispatchEvent(new Event('authChange'));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Signup error:', err);
      setError(err?.message || 'Signup failed. Please try again.');
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
            message={error} 
            type="error" 
            onClose={() => setShowToast(false)} 
          />
        </div>
      )}
      <div className="login-card signup-card">
        <div className="login-header">
          <h1 style={{ letterSpacing: '-0.025em', marginBottom: '0.25rem' }}>WORKNEX</h1>
          <p style={{ color: '#6B7280', fontSize: '0.975rem' }}>Create Employer Account</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form signup-form">
          <div className="form-grid">
            <Input
              label="Full Name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter your full name"
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="employer@worknex.com"
              required
            />

            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+91 9876543210"
              required
            />

            <Input
              label="Location"
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="e.g., Srikakulam, Andhra Pradesh"
              required
            />

            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Min 6 characters"
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              placeholder="Re-enter password"
              required
            />
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            style={{ width: '100%', padding: '0.75rem', marginTop: '1rem' }} 
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
        <div className="login-footer" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#4F46E5', textDecoration: 'none', fontWeight: '600' }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;

