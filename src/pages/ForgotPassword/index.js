import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ForgotPassword.scss';
import { api } from '../../services/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [otpFromServer, setOtpFromServer] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter your email');
      setShowToast(true);
      return;
    }

    try {
      setLoading(true);
      const data = await api.post('/api/auth/forgot-password', {
        email: email.trim().toLowerCase()
      });
      const otpValue = data?.otp ?? data?.otpCode ?? data?.code;
      if (otpValue) {
        setOtp(String(otpValue));
        setOtpFromServer(String(otpValue));
        setSuccess(data.message || 'OTP generated. Use the code below.');
      } else {
        setOtpFromServer('');
        setSuccess('OTP sent to your email. Please check your inbox.');
      }
      setShowToast(true);
      setStep(2);
    } catch (err) {
      setError(err?.message || 'Failed to send OTP');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp.trim() || !newPassword.trim()) {
      setError('Please enter OTP and new password');
      setShowToast(true);
      return;
    }

    if (newPassword.trim().length < 6) {
      setError('Password must be at least 6 characters');
      setShowToast(true);
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/auth/reset-password', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword: newPassword.trim()
      });
      navigate('/login', { replace: true, state: { passwordReset: true } });
    } catch (err) {
      const msg = err?.message || 'Failed to reset password';
      setError(msg);
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-container">
      {showToast && (
        <div className="toast-container">
          <Toast 
            message={error || success} 
            type={error ? 'error' : 'success'} 
            onClose={() => setShowToast(false)} 
          />
        </div>
      )}
      <div className="forgot-card">
        <h1 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Forgot Password</h1>
        <p className="subtitle" style={{ textAlign: 'center', color: '#6B7280', fontSize: '0.875rem', marginBottom: '2rem' }}>
          {step === 1 ? 'Enter your email to receive a reset code' : 'Confirm your reset code and set a new password'}
        </p>

        <form onSubmit={step === 1 ? handleSendOtp : handleResetPassword}>
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="employer@worknex.com"
            disabled={step === 2}
            required
          />

          {step === 2 && (
            <>
              {otpFromServer && (
                <div style={{
                  background: 'rgba(79, 70, 229, 0.05)',
                  border: '1px dashed #4F46E5',
                  color: '#4F46E5',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                  textAlign: 'center',
                  fontWeight: '600',
                  letterSpacing: '0.2em'
                }}>
                  OTP: {otpFromServer}
                </div>
              )}
              <Input
                label="OTP"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit code"
                maxLength={6}
                required
              />
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
              />
            </>
          )}

          <Button 
            type="submit" 
            variant="primary" 
            style={{ width: '100%', padding: '0.75rem', marginTop: '1rem' }} 
            disabled={loading}
          >
            {loading ? 'Processing...' : step === 1 ? 'Send OTP' : 'Reset Password'}
          </Button>

          {step === 2 && (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button 
                type="button" 
                onClick={handleSendOtp} 
                className="btn btn-secondary"
                style={{ fontSize: '0.875rem', background: 'transparent' }}
                disabled={loading}
              >
                No code? Resend
              </button>
            </div>
          )}
        </form>

        <div className="footer" style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/login" style={{ color: '#4F46E5', textDecoration: 'none', fontSize: '0.875rem', fontWeight: '500' }}>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

