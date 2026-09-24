import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
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
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=DM+Sans:wght@400;500;700&display=swap');

        :root {
          --primary-green: #a3e635;
          --primary-dark: #1a1a1a;
          --secondary-gray: #f5f5f5;
          --text-primary: #0a0a0a;
          --text-secondary: #666;
          --accent-purple: #8b5cf6;
          --accent-blue: #3b82f6;
          --error-red: #ef4444;
          --white: #ffffff;
          --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.05);
          --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);
          --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.12);
          --transition-smooth: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
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

        .register-container {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
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
          animation: slideInLeft 0.8s ease-out;
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
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
        }

        .visual-title {
          font-family: 'Poppins', sans-serif;
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: -2px;
          margin-bottom: 1.5rem;
          color: var(--text-primary);
        }

        .highlight-green {
          color: var(--primary-green);
          background: linear-gradient(120deg, var(--primary-green) 0%, var(--primary-green) 100%);
          background-repeat: no-repeat;
          background-size: 100% 40%;
          background-position: 0 85%;
          padding: 0 8px;
        }

        .visual-description {
          font-size: 1.2rem;
          line-height: 1.8;
          color: var(--text-secondary);
          margin-bottom: 3rem;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
          max-width: 500px;
          margin: 0 auto;
        }

        .stat-card {
          background: var(--white);
          border-radius: 20px;
          padding: 2rem;
          box-shadow: var(--shadow-lg);
          transition: var(--transition-smooth);
          animation: float 3s ease-in-out infinite;
          cursor: pointer;
          text-align: center;
        }

        .stat-card:nth-child(1) {
          animation-delay: 0s;
        }

        .stat-card:nth-child(2) {
          animation-delay: 0.5s;
        }

        .stat-card:nth-child(3) {
          animation-delay: 1s;
        }

        .stat-card:nth-child(4) {
          animation-delay: 1.5s;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        .stat-card:hover {
          transform: translateY(-10px) scale(1.05);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }

        .stat-number {
          font-family: 'Poppins', sans-serif;
          font-size: 3rem;
          font-weight: 800;
          color: var(--primary-green);
          margin-bottom: 0.5rem;
          display: block;
        }

        .stat-label {
          font-size: 0.95rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .background-shapes {
          position: absolute;
          inset: 0;
          z-index: 1;
          overflow: hidden;
        }

        .shape {
          position: absolute;
          border-radius: 50%;
          opacity: 0.1;
        }

        .shape-1 {
          width: 300px;
          height: 300px;
          background: var(--primary-green);
          top: -100px;
          left: -100px;
          animation: rotate360 20s linear infinite;
        }

        .shape-2 {
          width: 200px;
          height: 200px;
          background: var(--accent-purple);
          bottom: -50px;
          right: -50px;
          animation: rotate360 15s linear infinite reverse;
        }

        .shape-3 {
          width: 150px;
          height: 150px;
          background: var(--accent-blue);
          top: 50%;
          right: 10%;
          animation: float 4s ease-in-out infinite;
        }

        @keyframes rotate360 {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Right Side - Form */
        .register-form-side {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 4rem 3rem;
          background: var(--white);
          position: relative;
          animation: slideInRight 0.8s ease-out;
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .back-to-home {
          position: absolute;
          top: 2rem;
          right: 3rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          color: var(--text-secondary);
          font-weight: 600;
          transition: var(--transition-smooth);
          cursor: pointer;
        }

        .back-to-home:hover {
          color: var(--primary-green);
          transform: translateX(5px);
        }

        .back-to-home svg {
          transition: transform 0.3s ease;
        }

        .back-to-home:hover svg {
          transform: translateX(3px);
        }

        .register-form-wrapper {
          width: 100%;
          max-width: 450px;
          animation: fadeInUp 0.8s ease-out 0.2s backwards;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .logo-section {
          margin-bottom: 3rem;
          text-align: center;
        }

        .logo {
          font-family: 'Poppins', sans-serif;
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -1px;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, var(--text-primary), var(--primary-green));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        .welcome-text {
          font-family: 'Poppins', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .subtitle {
          color: var(--text-secondary);
          font-size: 1rem;
          margin-bottom: 2rem;
        }

        .register-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-label {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.95rem;
        }

        .input-wrapper {
          position: relative;
        }

        .form-input {
          width: 100%;
          padding: 1rem 1.25rem;
          border: 2px solid var(--secondary-gray);
          border-radius: 12px;
          font-size: 1rem;
          font-family: inherit;
          transition: var(--transition-smooth);
          background: var(--white);
        }

        .form-input.error {
          border-color: var(--error-red);
        }

        .form-input:focus {
          outline: none;
          border-color: var(--primary-green);
          box-shadow: 0 0 0 4px rgba(163, 230, 53, 0.1);
        }

        .form-input.error:focus {
          border-color: var(--error-red);
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
        }

        .form-input:hover {
          border-color: #d1d5db;
        }

        .error-message {
          color: var(--error-red);
          font-size: 0.85rem;
          margin-top: 0.25rem;
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .input-icon {
          position: absolute;
          right: 1.25rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary);
          font-size: 1.2rem;
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .input-icon:hover {
          color: var(--primary-green);
        }

        .password-strength {
          margin-top: 0.5rem;
          display: flex;
          gap: 0.5rem;
        }

        .strength-bar {
          flex: 1;
          height: 4px;
          background: var(--secondary-gray);
          border-radius: 2px;
          transition: var(--transition-smooth);
        }

        .strength-bar.active {
          background: var(--primary-green);
        }

        .terms-wrapper {
          display: flex;
          align-items: start;
          gap: 0.75rem;
          margin-top: -0.5rem;
        }

        .terms-wrapper input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: var(--primary-green);
          margin-top: 2px;
        }

        .terms-text {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .terms-link {
          color: var(--primary-green);
          font-weight: 600;
          text-decoration: none;
          transition: var(--transition-smooth);
        }

        .terms-link:hover {
          text-decoration: underline;
        }

        .btn-register {
          padding: 1rem 2rem;
          background: var(--text-primary);
          color: var(--white);
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition-smooth);
          font-family: inherit;
          margin-top: 0.5rem;
          position: relative;
        }

        .btn-register:hover:not(:disabled) {
          background: var(--primary-green);
          color: var(--text-primary);
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .btn-register:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-register:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-register.loading {
          color: transparent;
        }

        .btn-register.loading::after {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          top: 50%;
          left: 50%;
          margin-left: -10px;
          margin-top: -10px;
          border: 3px solid var(--white);
          border-radius: 50%;
          border-top-color: transparent;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 2rem 0;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: var(--secondary-gray);
        }

        .divider-text {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .social-login {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 1rem;
          border: 2px solid var(--secondary-gray);
          border-radius: 12px;
          background: var(--white);
          cursor: pointer;
          transition: var(--transition-smooth);
          font-weight: 600;
          font-size: 0.95rem;
          font-family: inherit;
        }

        .social-btn:hover {
          border-color: var(--primary-green);
          background: var(--secondary-gray);
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm);
        }

        .login-prompt {
          text-align: center;
          margin-top: 2rem;
          color: var(--text-secondary);
        }

        .login-link {
          color: var(--primary-green);
          font-weight: 700;
          text-decoration: none;
          transition: var(--transition-smooth);
          cursor: pointer;
        }

        .login-link:hover {
          color: var(--text-primary);
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
            padding: 3rem 2rem;
          }

          .back-to-home {
            right: 2rem;
          }
        }

        @media (max-width: 480px) {
          .register-form-side {
            padding: 2rem 1.5rem;
          }

          .back-to-home {
            right: 1.5rem;
          }

          .welcome-text {
            font-size: 1.75rem;
          }

          .logo {
            font-size: 2rem;
          }

          .form-input {
            padding: 0.875rem 1rem;
          }
        }
      `}</style>

      <div className="register-container">
        {/* Left Side - Visual */}
        <div className="register-visual-side">
          <div className="background-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>

          <div className="visual-content">
            <h2 className="visual-title">
              Start Your Journey<br/>
              with <span style={{ color: '#6fd341', fontWeight: 600 }}>Chatify</span>
            </h2>
            <p className="visual-description">
              Join our growing community and experience the future of communication
            </p>

            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-number">50K+</span>
                <p className="stat-label">Active Users</p>
              </div>
              <div className="stat-card">
                <span className="stat-number">98%</span>
                <p className="stat-label">Satisfaction Rate</p>
              </div>
              <div className="stat-card">
                <span className="stat-number">24/7</span>
                <p className="stat-label">Support Available</p>
              </div>
              <div className="stat-card">
                <span className="stat-number">150+</span>
                <p className="stat-label">Countries</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="register-form-side">
          <div className="back-to-home" onClick={() => navigate('/')}>
            Home
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>

          <div className="register-form-wrapper">
            <div className="logo-section">
              <h1 className="logo">Chatify</h1>
              <h2 className="welcome-text">Create Account</h2>
              <p className="subtitle">Get started with your free account</p>
            </div>

            {errors.api && (
              <div style={{
                background: '#fee2e2',
                color: '#dc2626',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.9rem',
                fontWeight: 500,
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