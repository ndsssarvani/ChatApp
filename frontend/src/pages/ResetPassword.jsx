import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Validate token on component mount
  useEffect(() => {
    let isMounted = true;
    const checkToken = async () => {
      if (!token) {
        if (isMounted) {
          setVerifying(false);
          setTokenValid(false);
        }
        return;
      }

      try {
        const res = await authService.validateResetToken(token);
        if (isMounted) {
          if (res.success) {
            setTokenValid(true);
            setUserEmail(res.email || '');
          } else {
            setTokenValid(false);
          }
          setVerifying(false);
        }
      } catch (err) {
        if (isMounted) {
          setTokenValid(false);
          setVerifying(false);
        }
      }
    };

    checkToken();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Requirement checks
  const checks = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  };

  const isFormValid =
    checks.length &&
    checks.upper &&
    checks.lower &&
    checks.number &&
    checks.special &&
    newPassword === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!checks.length || !checks.upper || !checks.lower || !checks.number || !checks.special) {
      setError('Please fulfill all password security requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await authService.resetPassword({
        token,
        newPassword,
        confirmPassword,
      });

      setLoading(false);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(res.message || 'Password reset failed.');
      }
    } catch (err) {
      setLoading(false);
      setError(
        err.response?.data?.message ||
        'Failed to reset password. The link may have expired.'
      );
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;700&display=swap');

        :root {
          --primary-green: #10b981;
          --primary-dark: #0f172a;
          --bg-light: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          --card-bg: #ffffff;
          --text-main: #1e293b;
          --text-muted: #64748b;
          --border-color: #e2e8f0;
          --focus-ring: rgba(16, 185, 129, 0.2);
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .reset-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-light);
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          padding: 1.5rem;
        }

        .reset-card {
          background: var(--card-bg);
          border-radius: 24px;
          padding: 2.75rem 2.5rem;
          max-width: 480px;
          width: 100%;
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 0 1px 1px rgba(0, 0, 0, 0.04);
          border: 1px solid var(--border-color);
          position: relative;
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .brand-icon-box {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          margin: 0 auto 1.5rem;
          border: 1px solid #a7f3d0;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
        }

        .reset-title {
          font-family: 'Poppins', sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-main);
          text-align: center;
          letter-spacing: -0.5px;
          margin-bottom: 0.5rem;
        }

        .reset-subtitle {
          color: var(--text-muted);
          font-size: 0.95rem;
          text-align: center;
          line-height: 1.5;
          margin-bottom: 1.75rem;
        }

        .alert-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 0.875rem 1rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .form-field {
          margin-bottom: 1.25rem;
        }

        .field-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #334155;
          margin-bottom: 0.5rem;
        }

        .input-group {
          position: relative;
        }

        .input-text {
          width: 100%;
          padding: 0.875rem 2.75rem 0.875rem 2.75rem;
          border: 1.5px solid var(--border-color);
          border-radius: 12px;
          font-size: 0.95rem;
          font-family: inherit;
          color: var(--text-main);
          background: #ffffff;
          transition: all 0.2s ease;
          outline: none;
        }

        .input-text:focus {
          border-color: var(--primary-green);
          box-shadow: 0 0 0 4px var(--focus-ring);
        }

        .input-icon-left {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 1.1rem;
          pointer-events: none;
        }

        .input-icon-right {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          cursor: pointer;
          font-size: 1.1rem;
          user-select: none;
          transition: color 0.2s;
        }

        .input-icon-right:hover {
          color: var(--primary-green);
        }

        .requirements-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 1rem 1.25rem;
          margin: 1.25rem 0 1.5rem;
        }

        .requirements-title {
          font-size: 0.8rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.5rem;
        }

        .req-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          margin-bottom: 0.35rem;
          color: #64748b;
          transition: color 0.2s ease;
        }

        .req-item.met {
          color: #16a34a;
          font-weight: 600;
        }

        .req-icon {
          font-size: 0.9rem;
          width: 16px;
          text-align: center;
        }

        .btn-submit {
          width: 100%;
          padding: 0.95rem;
          background: var(--primary-green);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .btn-submit:hover:not(:disabled) {
          background: #059669;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }

        .btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #475569;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: var(--primary-green);
        }

        .spinner {
          width: 36px;
          height: 36px;
          border: 3px solid #e2e8f0;
          border-top-color: var(--primary-green);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 2rem auto;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <div className="reset-wrapper">
        <div className="reset-card">
          {verifying ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div className="spinner"></div>
              <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Verifying reset token security...</p>
            </div>
          ) : !tokenValid ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: '#fee2e2',
                color: '#dc2626',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                margin: '0 auto 1.5rem',
              }}>
                ⚠️
              </div>
              <h2 className="reset-title" style={{ fontSize: '1.5rem' }}>Invalid or Expired Link</h2>
              <p className="reset-subtitle" style={{ marginBottom: '2rem' }}>
                This password reset link is invalid or has expired. For your security, reset links are only valid for 30 minutes and can only be used once.
              </p>
              <button
                type="button"
                className="btn-submit"
                onClick={() => navigate('/forgot-password')}
              >
                Request New Reset Link
              </button>
              <div style={{ marginTop: '1.5rem' }}>
                <span className="back-link" onClick={() => navigate('/login')}>
                  ← Back to Login
                </span>
              </div>
            </div>
          ) : success ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{
                width: '72px',
                height: '72px',
                background: '#dcfce7',
                color: '#16a34a',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                margin: '0 auto 1.5rem',
                border: '2px solid #bbf7d0',
              }}>
                ✓
              </div>
              <h2 className="reset-title" style={{ fontSize: '1.5rem' }}>Password Updated!</h2>
              <p className="reset-subtitle" style={{ marginBottom: '2rem' }}>
                Your password has been successfully reset. Existing sessions have been secured. You will be redirected to login shortly.
              </p>
              <button
                type="button"
                className="btn-submit"
                onClick={() => navigate('/login')}
              >
                Go to Login Now
              </button>
            </div>
          ) : (
            <>
              <div className="brand-icon-box">🔒</div>
              <h2 className="reset-title">Create New Password</h2>
              <p className="reset-subtitle">
                {userEmail
                  ? `Choose a strong, secure password for ${userEmail}.`
                  : 'Please enter and confirm your new password below.'}
              </p>

              {error && (
                <div className="alert-error">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-field">
                  <label className="field-label">New Password</label>
                  <div className="input-group">
                    <span className="input-icon-left">🔑</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-text"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      autoFocus
                    />
                    <span
                      className="input-icon-right"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? '👁️' : '🔒'}
                    </span>
                  </div>
                </div>

                <div className="form-field">
                  <label className="field-label">Confirm New Password</label>
                  <div className="input-group">
                    <span className="input-icon-left">🔒</span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="input-text"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <span
                      className="input-icon-right"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? '👁️' : '🔒'}
                    </span>
                  </div>
                </div>

                {/* Password Strength Checklist */}
                <div className="requirements-card">
                  <div className="requirements-title">Password Requirements</div>
                  <div className={`req-item ${checks.length ? 'met' : ''}`}>
                    <span className="req-icon">{checks.length ? '✓' : '○'}</span>
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`req-item ${checks.upper ? 'met' : ''}`}>
                    <span className="req-icon">{checks.upper ? '✓' : '○'}</span>
                    <span>At least 1 uppercase letter (A-Z)</span>
                  </div>
                  <div className={`req-item ${checks.lower ? 'met' : ''}`}>
                    <span className="req-icon">{checks.lower ? '✓' : '○'}</span>
                    <span>At least 1 lowercase letter (a-z)</span>
                  </div>
                  <div className={`req-item ${checks.number ? 'met' : ''}`}>
                    <span className="req-icon">{checks.number ? '✓' : '○'}</span>
                    <span>At least 1 number (0-9)</span>
                  </div>
                  <div className={`req-item ${checks.special ? 'met' : ''}`}>
                    <span className="req-icon">{checks.special ? '✓' : '○'}</span>
                    <span>At least 1 special character (!@#$%^&*)</span>
                  </div>
                  {confirmPassword && (
                    <div className={`req-item ${newPassword === confirmPassword ? 'met' : ''}`}>
                      <span className="req-icon">{newPassword === confirmPassword ? '✓' : '○'}</span>
                      <span>Passwords match</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading || !isFormValid}
                >
                  {loading ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
                <span className="back-link" onClick={() => navigate('/login')}>
                  ← Back to Login
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
