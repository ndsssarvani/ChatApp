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
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;700&display=swap');

        :root {
          --primary-green: #10b981;
          --primary-dark: #0f172a;
          --secondary-gray: #f1f5f9;
          --text-primary: #0f172a;
          --text-secondary: #64748b;
          --accent-purple: #8b5cf6;
          --accent-blue: #3b82f6;
          --white: #ffffff;
          --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.05);
          --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.08);
          --shadow-lg: 0 16px 40px rgba(0, 0, 0, 0.12);
          --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          color: var(--text-primary);
          background: var(--white);
          overflow-x: hidden;
        }

        .login-container {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        }

        .login-form-side {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 3rem 2.5rem;
          background: var(--white);
          position: relative;
        }

        .back-to-home {
          position: absolute;
          top: 2rem;
          left: 2.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.9rem;
          transition: var(--transition-smooth);
          cursor: pointer;
        }

        .back-to-home:hover {
          color: var(--primary-green);
          transform: translateX(-3px);
        }

        .login-form-wrapper {
          width: 100%;
          max-width: 440px;
          animation: fadeInUp 0.6s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
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

        .logo {
          font-family: 'Poppins', sans-serif;
          font-size: 2.25rem;
          font-weight: 800;
          letter-spacing: -1px;
          margin-bottom: 0.25rem;
          background: linear-gradient(135deg, #0f172a 0%, #10b981 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .welcome-text {
          font-family: 'Poppins', sans-serif;
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .subtitle {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        /* Auth Mode Switcher */
        .auth-mode-tabs {
          display: flex;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 14px;
          margin-bottom: 1.5rem;
        }

        .auth-tab-btn {
          flex: 1;
          padding: 0.65rem 0.75rem;
          border: none;
          background: transparent;
          font-size: 0.875rem;
          font-weight: 600;
          color: #64748b;
          border-radius: 10px;
          cursor: pointer;
          transition: var(--transition-smooth);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
        }

        .auth-tab-btn.active {
          background: #ffffff;
          color: #0f172a;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .alert-box {
          padding: 0.75rem 1rem;
          border-radius: 10px;
          margin-bottom: 1.25rem;
          font-size: 0.875rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
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
          font-weight: 600;
          color: #334155;
          font-size: 0.875rem;
        }

        .input-wrapper {
          position: relative;
        }

        .form-input {
          width: 100%;
          padding: 0.85rem 1rem 0.85rem 2.5rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 0.95rem;
          font-family: inherit;
          transition: var(--transition-smooth);
          background: #ffffff;
          color: var(--text-primary);
          outline: none;
        }

        .form-input:focus {
          border-color: var(--primary-green);
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15);
        }

        .input-icon-left {
          position: absolute;
          left: 0.85rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 1.1rem;
          pointer-events: none;
        }

        .input-icon-right {
          position: absolute;
          right: 0.85rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 1.1rem;
          cursor: pointer;
          user-select: none;
        }

        .input-icon-right:hover {
          color: var(--primary-green);
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
          accent-color: var(--primary-green);
        }

        .checkbox-label {
          font-size: 0.85rem;
          color: var(--text-secondary);
          cursor: pointer;
          user-select: none;
        }

        .forgot-password {
          color: #475569;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .forgot-password:hover {
          color: var(--primary-green);
          text-decoration: underline;
        }

        .btn-login {
          width: 100%;
          padding: 0.9rem;
          background: #0f172a;
          color: var(--white);
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition-smooth);
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.2);
        }

        .btn-login:hover:not(:disabled) {
          background: var(--primary-green);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
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
          margin: 1rem 0;
        }

        .otp-box {
          width: 100%;
          height: 52px;
          text-align: center;
          font-size: 1.4rem;
          font-weight: 700;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          background: #f8fafc;
          color: #0f172a;
          outline: none;
          transition: var(--transition-smooth);
          font-family: monospace;
        }

        .otp-box:focus {
          border-color: var(--primary-green);
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15);
        }

        .resend-section {
          text-align: center;
          margin: 1rem 0 0.5rem;
          font-size: 0.875rem;
          color: #64748b;
        }

        .resend-link {
          color: var(--primary-green);
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
        }

        .resend-link.disabled {
          color: #94a3b8;
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
          background: #e2e8f0;
        }

        .divider-text {
          color: #94a3b8;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.5px;
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
          padding: 0.85rem 1rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          background: #ffffff;
          cursor: pointer;
          transition: var(--transition-smooth);
          font-weight: 600;
          font-size: 0.95rem;
          color: #1e293b;
          font-family: inherit;
        }

        .social-btn:hover:not(:disabled) {
          border-color: #cbd5e1;
          background: #f8fafc;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .social-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .signup-prompt {
          text-align: center;
          margin-top: 1.75rem;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .signup-link {
          color: var(--primary-green);
          font-weight: 700;
          cursor: pointer;
        }

        .signup-link:hover {
          text-decoration: underline;
        }

        /* Right Side - Visual with Subtle Floating Animations */
        .login-visual-side {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 4rem;
          position: relative;
          overflow: hidden;
        }

        .visual-content {
          text-align: center;
          position: relative;
          z-index: 2;
        }

        .visual-title {
          font-family: 'Poppins', sans-serif;
          font-size: 3rem;
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: -1.5px;
          margin-bottom: 1rem;
          color: var(--text-primary);
        }

        .visual-description {
          font-size: 1.1rem;
          line-height: 1.7;
          color: #475569;
          margin-bottom: 2.5rem;
          max-width: 480px;
          margin-left: auto;
          margin-right: auto;
        }

        .floating-cards {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
          max-width: 460px;
          margin: 0 auto;
        }

        @keyframes subtleFloat {
          0% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-7px) rotate(0.4deg);
          }
          100% {
            transform: translateY(0px) rotate(0deg);
          }
        }

        .floating-card {
          background: var(--white);
          border-radius: 18px;
          padding: 1.5rem;
          box-shadow: var(--shadow-md);
          border: 1px solid rgba(0,0,0,0.04);
          text-align: left;
          animation: subtleFloat 4.2s ease-in-out infinite;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .floating-card:nth-child(1) {
          animation-duration: 4.2s;
          animation-delay: 0s;
        }

        .floating-card:nth-child(2) {
          animation-duration: 5s;
          animation-delay: 0.7s;
        }

        .floating-card:nth-child(3) {
          animation-duration: 4.6s;
          animation-delay: 1.3s;
        }

        .floating-card:nth-child(4) {
          animation-duration: 5.3s;
          animation-delay: 0.3s;
        }

        .floating-card:hover {
          transform: translateY(-9px) scale(1.02);
          box-shadow: var(--shadow-lg);
        }

        .card-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          display: block;
        }

        .card-title {
          font-weight: 700;
          font-size: 1rem;
          margin-bottom: 0.25rem;
          color: var(--text-primary);
        }

        .card-text {
          font-size: 0.85rem;
          color: var(--text-secondary);
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
            padding: 3.5rem 1.5rem;
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
              <h1 className="logo">ChatApp</h1>
              <h2 className="welcome-text">Welcome Back</h2>
              <p className="subtitle">Sign in with your password or secure email code</p>
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
                ✉️ Continue with Email
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
                  {isLoading ? 'Signing In...' : 'Sign In'}
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

                    <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                      We will send a 6-digit cryptographic verification code to your email. No password required.
                    </p>

                    <button
                      type="submit"
                      className="btn-login"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Sending Verification Code...' : 'Send Verification Code'}
                    </button>
                  </form>
                ) : (
                  <form className="login-form" onSubmit={handleVerifyOTP}>
                    <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                      <p style={{ fontSize: '0.9rem', color: '#475569' }}>
                        Enter the 6-digit verification code sent to:
                      </p>
                      <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{otpEmail}</strong>
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
                      {isLoading ? 'Verifying...' : 'Verify & Sign In'}
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
                        style={{ fontSize: '0.85rem', color: '#64748b', cursor: 'pointer', textDecoration: 'underline' }}
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
                Sign up
              </span>
            </p>
          </div>
        </div>

        {/* Right Side - Visual */}
        <div className="login-visual-side">
          <div className="visual-content">
            <h2 className="visual-title">
              Fast, Secure<br />
              <span style={{ color: '#10b981' }}>Messaging</span>
            </h2>
            <p className="visual-description">
              Experience seamless real-time chat with multi-factor verification and end-to-end privacy.
            </p>

            <div className="floating-cards">
              <div className="floating-card">
                <span className="card-icon">⚡</span>
                <h3 className="card-title">Instant Delivery</h3>
                <p className="card-text">Ultra low-latency socket messaging</p>
              </div>
              <div className="floating-card">
                <span className="card-icon">🛡️</span>
                <h3 className="card-title">OTP Security</h3>
                <p className="card-text">Cryptographic email verification</p>
              </div>
              <div className="floating-card">
                <span className="card-icon">🌐</span>
                <h3 className="card-title">Multi-Language</h3>
                <p className="card-text">Live translation inside chat</p>
              </div>
              <div className="floating-card">
                <span className="card-icon">📱</span>
                <h3 className="card-title">Multi-Device</h3>
                <p className="card-text">Synced across desktop and mobile</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;