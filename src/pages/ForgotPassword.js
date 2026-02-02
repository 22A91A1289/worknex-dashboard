import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ForgotPassword.css';
import { api } from '../services/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/auth/forgot-password', {
        email: email.trim().toLowerCase()
      });
      setStep(2);
    } catch (err) {
      setError(err?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp.trim() || !newPassword.trim()) {
      setError('Please enter OTP and new password');
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/auth/reset-password', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword: newPassword.trim()
      });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-container">
      <div className="forgot-card">
        <h1>Forgot Password</h1>
        <p className="subtitle">
          {step === 1 ? 'Enter your email to receive OTP' : 'Enter OTP and new password'}
        </p>

        <form onSubmit={step === 1 ? handleSendOtp : handleResetPassword}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="employer@worknex.com"
              disabled={step === 2}
              required
            />
          </div>

          {step === 2 && (
            <>
              <div className="form-group">
                <label>OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="6-digit OTP"
                  maxLength={6}
                  required
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
              </div>
            </>
          )}

          {error && <div className="error">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Please wait...' : step === 1 ? 'Send OTP' : 'Reset Password'}
          </button>

          {step === 2 && (
            <button type="button" className="btn-link" onClick={handleSendOtp} disabled={loading}>
              Resend OTP
            </button>
          )}
        </form>

        <div className="footer">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
