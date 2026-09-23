import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: request code, 2: reset password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [devCode, setDevCode] = useState('');

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await authService.forgotPassword(email);
      setLoading(false);
      if (res.success) {
        setSuccess('Verification code generated and sent to your email.');
        if (res.devCode) {
          setDevCode(res.devCode);
          setCode(res.devCode);
        }
        setStep(2);
      } else {
        setError(res.message || 'Failed to send reset code');
      }
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to send reset code');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.resetPassword({ email, code, newPassword });
      setLoading(false);
      if (res.success) {
        setSuccess('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(res.message || 'Failed to reset password');
      }
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      fontFamily: 'Inter, -apple-system, sans-serif',
      padding: '1.5rem',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        padding: '2.5rem',
        maxWidth: '440px',
        width: '100%',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e5e7eb',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💬</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            {step === 1 ? 'Reset Password' : 'Enter Verification Code'}
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            {step === 1
              ? 'Enter your registered email address to receive a secure password reset code.'
              : `Enter the 6-digit code sent to ${email} and choose a new password.`}
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#dc2626',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            marginBottom: '1rem',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: '#dcfce7',
            color: '#15803d',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            marginBottom: '1rem',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}>
            {success}
          </div>
        )}

        {devCode && (
          <div style={{
            background: '#eff6ff',
            color: '#1d4ed8',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            marginBottom: '1rem',
            fontSize: '0.875rem',
            border: '1px dashed #93c5fd',
          }}>
            <strong>Dev Test Code:</strong> {devCode}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestCode}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  borderRadius: '12px',
                  border: '1.5px solid #d1d5db',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: '#22c55e',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
              }}
            >
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                6-Digit Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                maxLength={6}
                placeholder="123456"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  borderRadius: '12px',
                  border: '1.5px solid #d1d5db',
                  fontSize: '1.1rem',
                  letterSpacing: '4px',
                  textAlign: 'center',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Minimum 6 characters"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  borderRadius: '12px',
                  border: '1.5px solid #d1d5db',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Repeat new password"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  borderRadius: '12px',
                  border: '1.5px solid #d1d5db',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: '#22c55e',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
                marginBottom: '0.75rem',
              }}
            >
              {loading ? 'Resetting Password...' : 'Save New Password'}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                width: '100%',
                padding: '0.65rem',
                background: 'transparent',
                color: '#6b7280',
                border: 'none',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              ← Back to enter email
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.5rem', borderTop: '1px solid #f3f4f6', paddingTop: '1rem' }}>
          <span
            onClick={() => navigate('/login')}
            style={{ color: '#22c55e', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
          >
            ← Back to Sign In
          </span>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
