import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
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

          if (window.google.accounts.oauth2) {
            tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
              client_id: clientId,
              scope: 'email profile openid',
              callback: handleOAuthTokenSuccess,
              error_callback: (err) => {
                console.warn('[Google OAuth Error]', err);
                if (err.type === 'popup_closed') {
                  setErrors((prev) => ({ ...prev, api: 'Google sign-in was cancelled.' }));
                } else if (err.type === 'access_denied') {
                  setErrors((prev) => ({ ...prev, api: 'Google sign-in access was denied.' }));
                } else {
                  setErrors((prev) => ({ ...prev, api: `Google authentication: ${err.message || err.type || 'Please check your Google Client ID configuration.'}` }));
                }
              },
            });
          }
        } catch (e) {
          console.warn('[Google GIS Init Error]', e);
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
      setErrors((prev) => ({ ...prev, api: 'Google Sign-In was cancelled.' }));
      return;
    }
    setIsSubmitting(true);
    setErrors({});
    const result = await loginWithGoogle({ credential: response.credential });
    setIsSubmitting(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setErrors((prev) => ({ ...prev, api: result.message || 'Google authentication failed.' }));
    }
  };

  const handleOAuthTokenSuccess = async (tokenResponse) => {
    if (tokenResponse && tokenResponse.access_token) {
      setIsSubmitting(true);
      setErrors({});
      const result = await loginWithGoogle({ accessToken: tokenResponse.access_token });
      setIsSubmitting(false);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setErrors((prev) => ({ ...prev, api: result.message || 'Google authentication failed.' }));
      }
    }
  };

  const handleGoogleSignIn = () => {
    setErrors({});
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId || clientId.includes('demo') || clientId.includes('your_google_client_id')) {
      setErrors((prev) => ({
        ...prev,
        api: 'Google Client ID is not configured yet. Please add your real VITE_GOOGLE_CLIENT_ID in frontend/.env (from Google Cloud Console).',
      }));
      return;
    }

    if (tokenClientRef.current) {
      tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
      return;
    }

    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt();
      } catch (err) {
        setErrors((prev) => ({ ...prev, api: 'Google authentication is initializing. Please try again.' }));
      }
    } else {
      setErrors((prev) => ({ ...prev, api: 'Google authentication service is unavailable. Please check your network connection.' }));
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error for this field when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate full name
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Validate terms
    if (!agreeTerms) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    const result = await register(formData.fullName, formData.email, formData.password);
    setIsSubmitting(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setErrors(prev => ({
        ...prev,
        api: result.message || 'Registration failed',
      }));
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

        .register-container {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1.05fr 1fr;
          background: var(--cf-bg);
        }

        /* Left Side - Visual */
        .register-visual-side {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 4rem;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #efece4 0%, #e6e0d2 100%);
          animation: slideInLeft 0.75s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
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
          margin-bottom: 1.25rem;
          color: var(--cf-ink);
        }

        .highlight-green {
          color: var(--cf-vermilion);
        }

        .visual-description {
          font-size: 1.1rem;
          line-height: 1.65;
          color: var(--cf-ink-muted);
          margin-bottom: 2.5rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
          max-width: 480px;
          margin: 0 auto;
        }

        @keyframes floatCard {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        .stat-card {
          background: #ffffff;
          border-radius: 14px;
          padding: 1.6rem;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.06);
          border: 1px solid var(--cf-border);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease;
          animation: floatCard 4.8s ease-in-out infinite;
          cursor: pointer;
          text-align: center;
        }

        .stat-card:nth-child(1) { animation-delay: 0s; }
        .stat-card:nth-child(2) { animation-delay: 0.6s; }
        .stat-card:nth-child(3) { animation-delay: 1.2s; }
        .stat-card:nth-child(4) { animation-delay: 1.8s; }

        .stat-card:hover {
          transform: translateY(-10px) scale(1.03);
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.12);
          border-color: var(--cf-ink);
        }

        .stat-number {
          font-size: 2.4rem;
          font-weight: 800;
          color: var(--cf-vermilion);
          margin-bottom: 0.25rem;
          display: block;
          letter-spacing: -0.02em;
        }

        .stat-label {
          font-size: 0.88rem;
          color: var(--cf-ink-muted);
          font-weight: 700;
        }

        /* Right Side - Form */
        .register-form-side {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 3.5rem 2.5rem;
          background: #ffffff;
          border-left: 1px solid var(--cf-border);
          position: relative;
          z-index: 5;
          box-shadow: -10px 0 35px rgba(0, 0, 0, 0.03);
          animation: slideInRight 0.75s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .back-to-home {
          position: absolute;
          top: 2rem;
          right: 2.5rem;
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
          transform: translateX(4px);
        }

        .register-form-wrapper {
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

        .register-form {
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

        .form-input.error {
          border-color: #ef4444;
        }

        .form-input:focus {
          border-color: var(--cf-ink);
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(224, 82, 28, 0.15);
        }

        .error-message {
          color: #ef4444;
          font-size: 0.84rem;
          font-weight: 600;
          margin-top: 0.25rem;
        }

        .input-icon {
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

        .password-strength {
          margin-top: 0.4rem;
          display: flex;
          gap: 0.4rem;
        }

        .strength-bar {
          flex: 1;
          height: 3.5px;
          background: #e6e2d8;
          border-radius: 2px;
          transition: var(--cf-transition);
        }

        .strength-bar.active {
          background: var(--cf-vermilion);
        }

        .terms-wrapper {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-top: -0.25rem;
        }

        .terms-wrapper input[type="checkbox"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: var(--cf-vermilion);
        }

        .terms-text {
          font-size: 0.86rem;
          color: var(--cf-ink-muted);
          line-height: 1.45;
        }

        .terms-link {
          color: var(--cf-vermilion);
          font-weight: 700;
          text-decoration: none;
        }

        .terms-link:hover {
          text-decoration: underline;
        }

        .btn-register {
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
          margin-top: 0.5rem;
        }

        .btn-register:hover:not(:disabled) {
          background: var(--cf-vermilion);
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(224, 82, 28, 0.45);
        }

        .btn-register:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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

        .social-btn:hover {
          border-color: var(--cf-ink);
          background: #ffffff;
          transform: translateY(-2px);
          box-shadow: var(--cf-shadow-sm);
        }

        .login-prompt {
          text-align: center;
          margin-top: 1.75rem;
          color: var(--cf-ink-muted);
          font-size: 0.92rem;
        }

        .login-link {
          color: var(--cf-vermilion);
          font-weight: 800;
          cursor: pointer;
        }

        .login-link:hover {
          text-decoration: underline;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .register-container {
            grid-template-columns: 1fr;
          }
          .register-visual-side {
            display: none;
          }
          .register-form-side {
            padding: 4rem 1.5rem;
          }
          .back-to-home {
            right: 1.5rem;
            top: 1.5rem;
          }
        }
      `}</style>

      <div className="register-container">
        {/* Left Side - Visual */}
        <div className="register-visual-side">
          <div className="visual-content">
            <h2 className="visual-title">
              Team & AI Chat<br />
              <span className="highlight-green">Unified</span>
            </h2>
            <p className="visual-description">
              Create your workspace in seconds and experience lightning-fast sub-11ms messaging with Chatify AI Copilot.
            </p>

            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-number">70K+</span>
                <p className="stat-label">Active Users</p>
              </div>
              <div className="stat-card">
                <span className="stat-number">&lt; 11ms</span>
                <p className="stat-label">Edge Latency</p>
              </div>
              <div className="stat-card">
                <span className="stat-number">256-bit</span>
                <p className="stat-label">AES Encryption</p>
              </div>
              <div className="stat-card">
                <span className="stat-number">99.99%</span>
                <p className="stat-label">Uptime SLA</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="register-form-side">
          <div className="back-to-home" onClick={() => navigate('/')}>
            ← Back to Home
          </div>

          <div className="register-form-wrapper">
            <div className="logo-section">
              <div className="cf-logo-brand-wrap">
                <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
                  <rect width="36" height="36" rx="10" fill="#14120f" />
                  <path d="M10 12C10 9.79086 11.7909 8 14 8H22C24.2091 8 26 9.79086 26 12V18C26 20.2091 24.2091 22 22 22H15L11 25.5V22H10C8.89543 22 8 21.1046 8 20V14C8 12.8954 8.89543 12 10 12Z" fill="#efece4" />
                  <path d="M19 16C19 14.8954 19.8954 14 21 14H25C26.1046 14 27 14.8954 27 16V21C27 22.1046 26.1046 23 25 23H23.5L21 25V23H21C19.8954 23 19 22.1046 19 21V16Z" fill="#e0521c" />
                </svg>
                <span>Chatify</span>
              </div>
              <h2 className="welcome-text">Create Free Workspace</h2>
              <p className="subtitle">Start your 14-day unrestricted trial with AI</p>
            </div>

            {errors.api && (
              <div style={{
                background: '#fee2e2',
                color: '#dc2626',
                padding: '0.85rem 1.1rem',
                borderRadius: '10px',
                marginBottom: '1.25rem',
                fontSize: '0.88rem',
                fontWeight: 600,
                textAlign: 'center',
                border: '1px solid #fecaca',
              }}>
                {errors.api}
              </div>
            )}

            <form className="register-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    name="fullName"
                    className={`form-input ${errors.fullName ? 'error' : ''}`}
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                  <span className="input-icon">👤</span>
                </div>
                {errors.fullName && <div className="error-message">{errors.fullName}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    name="email"
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <span className="input-icon">📧</span>
                </div>
                {errors.email && <div className="error-message">{errors.email}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <span
                    className="input-icon"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '👁️' : '🔒'}
                  </span>
                </div>
                {errors.password && <div className="error-message">{errors.password}</div>}
                <div className="password-strength">
                  <div className={`strength-bar ${formData.password.length > 0 ? 'active' : ''}`}></div>
                  <div className={`strength-bar ${formData.password.length > 5 ? 'active' : ''}`}></div>
                  <div className={`strength-bar ${formData.password.length > 8 ? 'active' : ''}`}></div>
                  <div className={`strength-bar ${formData.password.length > 12 ? 'active' : ''}`}></div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <span
                    className="input-icon"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? '👁️' : '🔒'}
                  </span>
                </div>
                {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
              </div>

              <div className="terms-wrapper">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeTerms}
                  onChange={(e) => {
                    setAgreeTerms(e.target.checked);
                    if (errors.terms) {
                      setErrors({ ...errors, terms: '' });
                    }
                  }}
                  required
                />
                <label htmlFor="terms" className="terms-text">
                  I agree to the <a href="#" className="terms-link">Terms of Service</a> and <a href="#" className="terms-link">Privacy Policy</a>
                </label>
              </div>
              {errors.terms && <div className="error-message">{errors.terms}</div>}

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="submit"
                  className={`btn-register ${isSubmitting ? 'loading' : ''}`}
                  disabled={isSubmitting}
                  style={{ flex: 2 }}
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      fullName: '',
                      email: '',
                      password: '',
                      confirmPassword: '',
                    });
                    setAgreeTerms(false);
                    setErrors({});
                  }}
                  style={{
                    flex: 1,
                    background: 'var(--secondary-gray, #f3f4f6)',
                    border: '1px solid #d1d5db',
                    borderRadius: '12px',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    color: '#4b5563',
                    padding: '0 12px',
                  }}
                >
                  Clear Form
                </button>
              </div>
            </form>

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
                disabled={isSubmitting}
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

            <p className="login-prompt">
              Already have an account? <span className="login-link" onClick={() => navigate('/login')}>Sign in</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;