import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (val) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleRequestResetLink = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await authService.forgotPassword(email.trim());
      setLoading(false);
      if (res.success) {
        setSubmitted(true);
      } else {
        setError(res.message || 'Failed to request password reset link.');
      }
    } catch (err) {
      setLoading(false);
      setError(
        err.response?.data?.message ||
        'Unable to process your request at this time. Please try again later.'
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

        .forgot-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-light);
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          padding: 1.5rem;
        }

        .forgot-card {
          background: var(--card-bg);
          border-radius: 24px;
          padding: 2.75rem 2.5rem;
          max-width: 460px;
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

        .forgot-title {
          font-family: 'Poppins', sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-main);
          text-align: center;
          letter-spacing: -0.5px;
          margin-bottom: 0.5rem;
        }

        .forgot-subtitle {
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
          margin-bottom: 1.5rem;
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
          padding: 0.875rem 1rem 0.875rem 2.75rem;
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
          opacity: 0.65;
          cursor: not-allowed;
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

        .success-box {
          text-align: center;
          padding: 1rem 0;
        }

        .success-icon-badge {
          width: 72px;
          height: 72px;
          background: #dcfce7;
          color: #16a34a;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          margin: 0 auto 1.5rem;
          border: 2px solid #bbf7d0;
        }

        .success-text {
          font-size: 0.95rem;
          line-height: 1.6;
          color: #475569;
          margin-bottom: 2rem;
        }

        .email-highlight {
          font-weight: 700;
          color: #0f172a;
          word-break: break-all;
        }
      `}</style>

      <div className="forgot-wrapper">
        <div className="forgot-card">
          {!submitted ? (
            <>
              <div className="brand-icon-box">🔑</div>
              <h2 className="forgot-title">Forgot Password?</h2>
              <p className="forgot-subtitle">
                Enter your registered email address and we'll send you a secure password reset link.
              </p>

              {error && (
                <div className="alert-error">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRequestResetLink}>
                <div className="form-field">
                  <label className="field-label">Email Address</label>
                  <div className="input-group">
                    <span className="input-icon-left">✉️</span>
                    <input
                      type="email"
                      className="input-text"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
                <span className="back-link" onClick={() => navigate('/login')}>
                  ← Back to Login
                </span>
              </div>
            </>
          ) : (
            <div className="success-box">
              <div className="success-icon-badge">📬</div>
              <h2 className="forgot-title" style={{ fontSize: '1.5rem' }}>Check Your Email</h2>
              <p className="success-text">
                If an account exists for <span className="email-highlight">{email}</span>, we have sent a password reset link to your inbox.
              </p>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1rem',
                fontSize: '0.85rem',
                color: '#64748b',
                marginBottom: '1.75rem',
                lineHeight: 1.5,
                textAlign: 'left'
              }}>
                ℹ️ <strong>Tips:</strong>
                <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
                  <li>The link is active for <strong>30 minutes</strong>.</li>
                  <li>Check your spam or junk folder if you don't see it.</li>
                </ul>
              </div>

              <button
                type="button"
                className="btn-submit"
                onClick={() => navigate('/login')}
              >
                Return to Login
              </button>

              <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                <span
                  style={{ fontSize: '0.85rem', color: '#64748b', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => {
                    setSubmitted(false);
                    setEmail('');
                  }}
                >
                  Didn't receive it? Try another email
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
