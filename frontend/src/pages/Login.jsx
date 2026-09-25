import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';

const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithOTP, loginWithGoogle } = useAuth();

  // Mode: 'password' | 'email-otp'
  const [authMode, setAuthMode] = useState('password');

  // Password Login State
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Email OTP State
  const [otpEmail, setOtpEmail] = useState('');
  const [otpStep, setOtpStep] = useState(1); // 1: enter email, 2: enter otp
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [canRegisterNotice, setCanRegisterNotice] = useState(false);

  // Status & Feedback
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const otpInputRefs = useRef([]);
  const tokenClientRef = useRef(null);
  const googleBtnRef = useRef(null);

  // Initialize Official Google Identity Services (GIS) & OAuth 2.0
  useEffect(() => {
    const initializeGoogle = () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId || clientId.includes('demo') || clientId.includes('your_google_client_id')) {
        return; // Prevent initializing with non-existent client ID
      }

      if (window.google?.accounts) {
        try {
          // 1. Initialize GIS Credential One-Tap & Render Button
          if (window.google.accounts.id) {
            window.google.accounts.id.initialize({
              client_id: clientId,
              callback: handleGoogleSuccess,
              auto_select: false,
              cancel_on_tap_outside: true,
            });

            if (googleBtnRef.current) {
              window.google.accounts.id.renderButton(googleBtnRef.current, {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                shape: 'rectangular',
                logo_alignment: 'left',
                width: 380,
              });
            }
          }

          // 2. Initialize OAuth 2.0 Token Client for Direct Popup Trigger
          if (window.google.accounts.oauth2) {
            tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
              client_id: clientId,
              scope: 'email profile openid',
              callback: handleOAuthTokenSuccess,
              error_callback: (err) => {
                console.warn('[Google OAuth Error]', err);
                if (err.type === 'popup_closed') {
                  setError('Google sign-in was cancelled.');
                } else if (err.type === 'access_denied') {
                  setError('Google sign-in access was denied.');
                } else {
                  setError(`Google authentication: ${err.message || err.type || 'Please check your Google Client ID configuration.'}`);
                }
              },
            });
          }
        } catch (e) {
          console.warn('[Google GIS Init Warning]', e.message);
        }
      }
    };

    if (window.google?.accounts) {
      initializeGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts) {
          clearInterval(interval);
          initializeGoogle();
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, []);

  const handleGoogleSuccess = async (response) => {
    if (!response.credential) {
      setError('Google Sign-In was cancelled.');
      return;
    }
    setIsLoading(true);
    setError('');
    const result = await loginWithGoogle({ credential: response.credential });
    setIsLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Google authentication failed.');
    }
  };

  const handleOAuthTokenSuccess = async (tokenResponse) => {
    if (tokenResponse && tokenResponse.access_token) {
      setIsLoading(true);
      setError('');
      const result = await loginWithGoogle({ accessToken: tokenResponse.access_token });
      setIsLoading(false);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message || 'Google authentication failed.');
      }
    }
  };

  const handleGoogleSignIn = () => {
    setError('');
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId || clientId.includes('demo') || clientId.includes('your_google_client_id')) {
      setError(
        'Google Client ID is not configured yet. Please add your real VITE_GOOGLE_CLIENT_ID to frontend/.env (from Google Cloud Console).'
      );
      return;
    }

    // Trigger OAuth 2.0 Token Client popup if initialized
    if (tokenClientRef.current) {
      tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
      return;
    }

    // Fallback: GIS prompt
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt();
      } catch (err) {
        setError('Google sign-in is initializing. Please try again.');
      }
    } else {
      setError('Google authentication service is unavailable. Please check your network connection.');
    }
  };

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Handle Standard Password Login
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!emailOrUsername.trim() || !password) {
      setError('Please enter your email/username and password.');
      return;
    }

    setIsLoading(true);
    const result = await login(emailOrUsername.trim(), password);
    setIsLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Invalid email or password.');
    }
  };

  // Handle Send Email OTP
  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');
    setCanRegisterNotice(false);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!otpEmail.trim() || !emailRegex.test(otpEmail.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authService.sendOTP(otpEmail.trim(), 'login');
      setIsLoading(false);
      if (res.success) {
        setOtpStep(2);
        setCountdown(45);
        setSuccess('A 6-digit verification code has been sent to your email.');
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 100);
      } else {
        setError(res.message || 'Failed to send verification code.');
        if (res.canRegister) {
          setCanRegisterNotice(true);
        }
      }
    } catch (err) {
      setIsLoading(false);
      const data = err.response?.data;
      if (data?.canRegister) {
        setCanRegisterNotice(true);
      }
      setError(
        data?.message ||
        'Failed to send verification code. Please check your email and try again.'
      );
    }
  };

  // Handle OTP digit input changes
  const handleOtpChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];

    if (cleanVal.length > 1) {
      const pasted = cleanVal.slice(0, 6).split('');
      pasted.forEach((char, i) => {
        newDigits[i] = char;
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);

    if (cleanVal && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle OTP Verification and Login
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const otpCode = otpDigits.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsLoading(true);
    const result = await loginWithOTP(otpEmail.trim(), otpCode);
    setIsLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Invalid verification code.');
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        :root {
          --cf-bg: #efece4;
          --cf-surface: #ffffff;
          --cf-surface-card: #f7f5ef;
          --cf-ink: #14120f;
          --cf-ink-muted: #55524a;
          --cf-vermilion: #e0521c;
          --cf-vermilion-hover: #ff5a22;
          --cf-border: rgba(20, 18, 15, 0.12);
          --cf-shadow-sm: 0 4px 14px rgba(0, 0, 0, 0.04);
          --cf-shadow-md: 0 14px 36px rgba(0, 0, 0, 0.08);
          --cf-shadow-lg: 0 24px 60px rgba(0, 0, 0, 0.12);
          --cf-transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--cf-ink);
          background: var(--cf-bg);
          overflow-x: hidden;
        }

        .login-container {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1.05fr;
          background: var(--cf-bg);
          position: relative;
        }

        .login-form-side {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 3.5rem 2.5rem;
          background: #ffffff;
          border-right: 1px solid var(--cf-border);
          position: relative;
          z-index: 5;
          box-shadow: 10px 0 35px rgba(0, 0, 0, 0.03);
        }

        .back-to-home {
          position: absolute;
          top: 2rem;
          left: 2.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          color: var(--cf-ink-muted);
          font-weight: 700;
          font-size: 0.88rem;
          transition: var(--cf-transition);
          cursor: pointer;
        }

        .back-to-home:hover {
          color: var(--cf-vermilion);
          transform: translateX(-4px);
        }

        .login-form-wrapper {
          width: 100%;
          max-width: 440px;
          animation: fadeInUp 0.65s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .logo-section {
          margin-bottom: 2rem;
          text-align: center;
        }

        .cf-logo-brand-wrap {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          font-size: 1.8rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--cf-ink);
          margin-bottom: 0.6rem;
          text-decoration: none;
        }

        .welcome-text {
          font-size: 1.65rem;
          font-weight: 800;
          color: var(--cf-ink);
          letter-spacing: -0.025em;
          margin-bottom: 0.25rem;
        }

        .subtitle {
          color: var(--cf-ink-muted);
          font-size: 0.92rem;
          font-weight: 500;
        }

        /* Auth Mode Switcher */
        .auth-mode-tabs {
          display: flex;
          background: #f4f2ec;
          padding: 4px;
          border-radius: 999px;
          margin-bottom: 1.5rem;
          border: 1px solid var(--cf-border);
        }

        .auth-tab-btn {
          flex: 1;
          padding: 0.7rem 0.85rem;
          border: none;
          background: transparent;
          font-size: 0.88rem;
          font-weight: 700;
          color: #7d7768;
          border-radius: 999px;
          cursor: pointer;
          transition: var(--cf-transition);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
        }

        .auth-tab-btn.active {
          background: var(--cf-ink);
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(20, 18, 15, 0.22);
        }

        .alert-box {
          padding: 0.85rem 1.1rem;
          border-radius: 10px;
          margin-bottom: 1.25rem;
          font-size: 0.88rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .alert-error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .alert-success {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .form-label {
          font-weight: 700;
          color: var(--cf-ink);
          font-size: 0.88rem;
        }

        .input-wrapper {
          position: relative;
        }

        .form-input {
          width: 100%;
          padding: 0.9rem 1rem 0.9rem 2.6rem;
          border: 1.5px solid var(--cf-border);
          border-radius: 999px;
          font-size: 0.95rem;
          font-family: inherit;
          transition: var(--cf-transition);
          background: #fbf9f5;
          color: var(--cf-ink);
          outline: none;
        }

        .form-input:focus {
          border-color: var(--cf-ink);
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(224, 82, 28, 0.15);
        }

        .input-icon-left {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #8c8577;
          font-size: 1.1rem;
          pointer-events: none;
        }

        .input-icon-right {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #8c8577;
          font-size: 1.1rem;
          cursor: pointer;
          user-select: none;
          transition: color 0.2s;
        }

        .input-icon-right:hover {
          color: var(--cf-vermilion);
        }

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: -0.25rem;
        }

        .checkbox-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .checkbox-wrapper input[type="checkbox"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: var(--cf-vermilion);
        }

        .checkbox-label {
          font-size: 0.86rem;
          color: var(--cf-ink-muted);
          font-weight: 500;
          cursor: pointer;
          user-select: none;
        }

        .forgot-password {
          color: var(--cf-ink-muted);
          font-size: 0.86rem;
          font-weight: 700;
          cursor: pointer;
          transition: var(--cf-transition);
        }

        .forgot-password:hover {
          color: var(--cf-vermilion);
          text-decoration: underline;
        }

        .btn-login {
          width: 100%;
          padding: 0.95rem;
          background: var(--cf-ink);
          color: #ffffff;
          border: none;
          border-radius: 999px;
          font-size: 1rem;
          font-weight: 800;
          cursor: pointer;
          transition: var(--cf-transition);
          box-shadow: 0 8px 24px rgba(20, 18, 15, 0.28);
        }

        .btn-login:hover:not(:disabled) {
          background: var(--cf-vermilion);
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(224, 82, 28, 0.45);
        }

        .btn-login:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* OTP 6-Digit Boxes */
        .otp-inputs-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
          margin: 1.25rem 0;
        }

        .otp-box {
          width: 100%;
          height: 52px;
          text-align: center;
          font-size: 1.4rem;
          font-weight: 800;
          border: 1.5px solid var(--cf-border);
          border-radius: 12px;
          background: #fbf9f5;
          color: var(--cf-ink);
          outline: none;
          transition: var(--cf-transition);
          font-family: monospace;
        }

        .otp-box:focus {
          border-color: var(--cf-ink);
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(224, 82, 28, 0.15);
        }

        .resend-section {
          text-align: center;
          margin: 1rem 0 0.5rem;
          font-size: 0.88rem;
          color: var(--cf-ink-muted);
        }

        .resend-link {
          color: var(--cf-vermilion);
          font-weight: 700;
          cursor: pointer;
          text-decoration: underline;
        }

        .resend-link.disabled {
          color: #8c8577;
          cursor: not-allowed;
          text-decoration: none;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 1.5rem 0 1rem;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: var(--cf-border);
        }

        .divider-text {
          color: #8c8577;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.8px;
        }

        .social-login {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.9rem 1rem;
          border: 1.5px solid var(--cf-border);
          border-radius: 999px;
          background: #fbf9f5;
          cursor: pointer;
          transition: var(--cf-transition);
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--cf-ink);
          font-family: inherit;
        }

        .social-btn:hover:not(:disabled) {
          border-color: var(--cf-ink);
          background: #ffffff;
          transform: translateY(-2px);
          box-shadow: var(--cf-shadow-sm);
        }

        .social-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .signup-prompt {
          text-align: center;
          margin-top: 1.75rem;
          color: var(--cf-ink-muted);
          font-size: 0.92rem;
        }

        .signup-link {
          color: var(--cf-vermilion);
          font-weight: 800;
          cursor: pointer;
        }

        .signup-link:hover {
          text-decoration: underline;
        }

        /* Right Side - Luxury Showcase */
        .login-visual-side {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 4rem;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #efece4 0%, #e6e0d2 100%);
        }

        .visual-content {
          text-align: center;
          position: relative;
          z-index: 2;
          max-width: 520px;
        }

        .visual-title {
          font-size: 3.2rem;
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.035em;
          margin-bottom: 1rem;
          color: var(--cf-ink);
        }

        .visual-description {
          font-size: 1.1rem;
          line-height: 1.65;
          color: var(--cf-ink-muted);
          margin-bottom: 2.5rem;
        }

        .floating-cards {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
          max-width: 480px;
          margin: 0 auto;
        }

        @keyframes subtleFloat {
          0% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(0.6deg);
          }
          100% {
            transform: translateY(0px) rotate(0deg);
          }
        }

        .floating-card {
          background: #ffffff;
          border-radius: 14px;
          padding: 1.6rem;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.06);
          border: 1px solid var(--cf-border);
          text-align: left;
          animation: subtleFloat 4.6s ease-in-out infinite;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease;
        }

        .floating-card:nth-child(1) {
          animation-duration: 4.6s;
          animation-delay: 0s;
        }

        .floating-card:nth-child(2) {
          animation-duration: 5.2s;
          animation-delay: 0.8s;
        }

        .floating-card:nth-child(3) {
          animation-duration: 4.8s;
          animation-delay: 1.4s;
        }

        .floating-card:nth-child(4) {
          animation-duration: 5.5s;
          animation-delay: 0.4s;
        }

        .floating-card:hover {
          transform: translateY(-10px) scale(1.03);
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.12);
          border-color: var(--cf-ink);
        }

        .card-icon {
          font-size: 2rem;
          margin-bottom: 0.6rem;
          display: block;
        }

        .card-title {
          font-weight: 800;
          font-size: 1.05rem;
          margin-bottom: 0.3rem;
          color: var(--cf-ink);
        }

        .card-text {
          font-size: 0.86rem;
          color: var(--cf-ink-muted);
          line-height: 1.45;
        }

        @media (prefers-reduced-motion: reduce) {
          .floating-card {
            animation: none !important;
          }
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .login-container {
            grid-template-columns: 1fr;
          }
          .login-visual-side {
            display: none;
          }
          .login-form-side {
            padding: 4rem 1.5rem;
          }
          .back-to-home {
            left: 1.5rem;
            top: 1.5rem;
          }
        }
      `}</style>

      <div className="login-container">
        {/* Left Side - Form */}
        <div className="login-form-side">
          <div className="back-to-home" onClick={() => navigate('/')}>
            ← Back to Home
          </div>

          <div className="login-form-wrapper">
            <div className="logo-section">
              <div className="cf-logo-brand-wrap">
                <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
                  <rect width="36" height="36" rx="10" fill="#14120f" />
                  <path d="M10 12C10 9.79086 11.7909 8 14 8H22C24.2091 8 26 9.79086 26 12V18C26 20.2091 24.2091 22 22 22H15L11 25.5V22H10C8.89543 22 8 21.1046 8 20V14C8 12.8954 8.89543 12 10 12Z" fill="#efece4" />
                  <path d="M19 16C19 14.8954 19.8954 14 21 14H25C26.1046 14 27 14.8954 27 16V21C27 22.1046 26.1046 23 25 23H23.5L21 25V23H21C19.8954 23 19 22.1046 19 21V16Z" fill="#e0521c" />
                </svg>
                <span>Chatify</span>
              </div>
              <h2 className="welcome-text">Welcome Back</h2>
              <p className="subtitle">Sign in to your team workspace and AI Copilot</p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="auth-mode-tabs">
              <button
                type="button"
                className={`auth-tab-btn ${authMode === 'password' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('password');
                  setError('');
                  setSuccess('');
                }}
              >
                🔒 Password
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${authMode === 'email-otp' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('email-otp');
                  setError('');
                  setSuccess('');
                }}
              >
                ✉️ Email Code
              </button>
            </div>

            {error && (
              <div className="alert-box alert-error">
                <span>⚠️</span>
                <div style={{ flex: 1 }}>
                  <span>{error}</span>
                  {canRegisterNotice && (
                    <div style={{ marginTop: '0.4rem' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          textDecoration: 'underline',
                          cursor: 'pointer',
                        }}
                        onClick={() => navigate('/register')}
                      >
                        Click here to create a new account →
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {success && (
              <div className="alert-box alert-success">
                <span>✓</span>
                <span>{success}</span>
              </div>
            )}

            {/* TAB 1: Password Login */}
            {authMode === 'password' && (
              <form className="login-form" onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                  <label htmlFor="login-email" className="form-label">
                    Email or Username
                  </label>
                  <div className="input-wrapper">
                    <span className="input-icon-left">👤</span>
                    <input
                      id="login-email"
                      type="text"
                      className="form-input"
                      placeholder="name@example.com or username"
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="login-pass" className="form-label">
                    Password
                  </label>
                  <div className="input-wrapper">
                    <span className="input-icon-left">🔒</span>
                    <input
                      id="login-pass"
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <span
                      className="input-icon-right"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? '👁️' : '🔒'}
                    </span>
                  </div>
                </div>

                <div className="form-options">
                  <div className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      id="remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <label htmlFor="remember" className="checkbox-label">
                      Remember me
                    </label>
                  </div>
                  <span
                    className="forgot-password"
                    onClick={() => navigate('/forgot-password')}
                  >
                    Forgot Password?
                  </span>
                </div>

                <button
                  type="submit"
                  className="btn-login"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing In...' : 'Sign In to Workspace →'}
                </button>
              </form>
            )}

            {/* TAB 2: Email OTP Login */}
            {authMode === 'email-otp' && (
              <>
                {otpStep === 1 ? (
                  <form className="login-form" onSubmit={handleSendOTP}>
                    <div className="form-group">
                      <label htmlFor="otp-email" className="form-label">
                        Email Address
                      </label>
                      <div className="input-wrapper">
                        <span className="input-icon-left">✉️</span>
                        <input
                          id="otp-email"
                          type="email"
                          className="form-input"
                          placeholder="name@example.com"
                          value={otpEmail}
                          onChange={(e) => setOtpEmail(e.target.value)}
                          autoComplete="email"
                          autoFocus
                          required
                        />
                      </div>
                    </div>

                    <p style={{ fontSize: '0.86rem', color: '#55524a', lineHeight: 1.5 }}>
                      We will send a 6-digit cryptographic verification code to your email. No password required.
                    </p>

                    <button
                      type="submit"
                      className="btn-login"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Sending Verification Code...' : 'Send Verification Code →'}
                    </button>
                  </form>
                ) : (
                  <form className="login-form" onSubmit={handleVerifyOTP}>
                    <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                      <p style={{ fontSize: '0.9rem', color: '#55524a' }}>
                        Enter the 6-digit verification code sent to:
                      </p>
                      <strong style={{ fontSize: '0.95rem', color: '#14120f' }}>{otpEmail}</strong>
                    </div>

                    <div className="otp-inputs-grid">
                      {otpDigits.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (otpInputRefs.current[index] = el)}
                          type="text"
                          maxLength={6}
                          className="otp-box"
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          autoComplete="one-time-code"
                        />
                      ))}
                    </div>

                    <button
                      type="submit"
                      className="btn-login"
                      disabled={isLoading || otpDigits.join('').length !== 6}
                    >
                      {isLoading ? 'Verifying...' : 'Verify & Sign In →'}
                    </button>

                    <div className="resend-section">
                      {countdown > 0 ? (
                        <span>Resend code available in <strong>{countdown}s</strong></span>
                      ) : (
                        <span>
                          Didn't receive the code?{' '}
                          <span
                            className="resend-link"
                            onClick={() => handleSendOTP()}
                          >
                            Resend Code
                          </span>
                        </span>
                      )}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                      <span
                        style={{ fontSize: '0.85rem', color: '#55524a', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => {
                          setOtpStep(1);
                          setOtpDigits(['', '', '', '', '', '']);
                          setError('');
                        }}
                      >
                        ← Change email address
                      </span>
                    </div>
                  </form>
                )}
              </>
            )}

            {/* Official Google Authentication Button */}
            <div className="divider">
              <div className="divider-line"></div>
              <span className="divider-text">OR</span>
              <div className="divider-line"></div>
            </div>

            <div className="social-login">
              <button
                type="button"
                className="social-btn"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                Continue with Google
              </button>
              <div ref={googleBtnRef} style={{ display: 'none' }}></div>
            </div>

            <p className="signup-prompt">
              Don't have an account?{' '}
              <span className="signup-link" onClick={() => navigate('/register')}>
                Sign up free
              </span>
            </p>
          </div>
        </div>

        {/* Right Side - Visual */}
        <div className="login-visual-side">
          <div className="visual-content">
            <h2 className="visual-title">
              Team & AI Chat<br />
              <span style={{ color: '#e0521c' }}>Unified</span>
            </h2>
            <p className="visual-description">
              Experience seamless sub-11ms messaging with integrated Chatify AI Copilot and end-to-end privacy.
            </p>

            <div className="floating-cards">
              <div className="floating-card">
                <span className="card-icon">⚡</span>
                <h3 className="card-title">Instant Delivery</h3>
                <p className="card-text">Sub-11ms live WebSocket sync</p>
              </div>
              <div className="floating-card">
                <span className="card-icon">🤖</span>
                <h3 className="card-title">AI Copilot</h3>
                <p className="card-text">Deep assistant inside every chat</p>
              </div>
              <div className="floating-card">
                <span className="card-icon">🔒</span>
                <h3 className="card-title">E2E Privacy</h3>
                <p className="card-text">256-bit client-side cryptography</p>
              </div>
              <div className="floating-card">
                <span className="card-icon">📱</span>
                <h3 className="card-title">Multi-Device</h3>
                <p className="card-text">Live continuity across all screens</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;