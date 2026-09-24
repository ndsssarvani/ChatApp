import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleAuthButton from '../components/GoogleAuthButton';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Invalid email or password');
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

        .login-container {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        }

        /* Left Side - Form */
        .login-form-side {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 4rem 3rem;
          background: var(--white);
          position: relative;
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

        .back-to-home {
          position: absolute;
          top: 2rem;
          left: 3rem;
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
          transform: translateX(-5px);
        }

        .back-to-home svg {
          transition: transform 0.3s ease;
        }

        .back-to-home:hover svg {
          transform: translateX(-3px);
        }

        .login-form-wrapper {
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

        .login-form {
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

        .form-input:focus {
          outline: none;
          border-color: var(--primary-green);
          box-shadow: 0 0 0 4px rgba(163, 230, 53, 0.1);
        }

        .form-input:hover {
          border-color: #d1d5db;
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

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: -0.5rem;
        }

        .checkbox-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .checkbox-wrapper input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: var(--primary-green);
        }

        .checkbox-label {
          font-size: 0.9rem;
          color: var(--text-secondary);
          cursor: pointer;
          user-select: none;
        }

        .forgot-password {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 600;
          transition: var(--transition-smooth);
        }

        .forgot-password:hover {
          color: var(--primary-green);
        }

        .btn-login {
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
        }

        .btn-login:hover {
          background: var(--primary-green);
          color: var(--text-primary);
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .btn-login:active {
          transform: translateY(0);
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

        .social-btn svg {
          font-size: 1.5rem;
        }

        .signup-prompt {
          text-align: center;
          margin-top: 2rem;
          color: var(--text-secondary);
        }

        .signup-link {
          color: var(--primary-green);
          font-weight: 700;
          text-decoration: none;
          transition: var(--transition-smooth);
          cursor: pointer;
        }

        .signup-link:hover {
          color: var(--text-primary);
          text-decoration: underline;
        }

        /* Right Side - Visual */
        .login-visual-side {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 4rem;
          position: relative;
          overflow: hidden;
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

        .floating-cards {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          max-width: 500px;
          margin: 0 auto;
        }

        .floating-card {
          background: var(--white);
          border-radius: 20px;
          padding: 2rem;
          box-shadow: var(--shadow-lg);
          transition: var(--transition-smooth);
          animation: float 3s ease-in-out infinite;
          cursor: pointer;
        }

        .floating-card:nth-child(1) {
          animation-delay: 0s;
        }

        .floating-card:nth-child(2) {
          animation-delay: 0.5s;
        }

        .floating-card:nth-child(3) {
          animation-delay: 1s;
        }

        .floating-card:nth-child(4) {
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

        .floating-card:hover {
          transform: translateY(-10px) scale(1.05);
          box-shadow: var(--shadow-lg);
        }

        .card-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          display: block;
        }

        .card-title {
          font-weight: 700;
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }

        .card-text {
          font-size: 0.9rem;
          color: var(--text-secondary);
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
          right: -100px;
          animation: rotate360 20s linear infinite;
        }

        .shape-2 {
          width: 200px;
          height: 200px;
          background: var(--accent-purple);
          bottom: -50px;
          left: -50px;
          animation: rotate360 15s linear infinite reverse;
        }

        .shape-3 {
          width: 150px;
          height: 150px;
          background: var(--accent-blue);
          top: 50%;
          left: 10%;
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

        /* Responsive */
        @media (max-width: 1024px) {
          .login-container {
            grid-template-columns: 1fr;
          }

          .login-visual-side {
            display: none;
          }

          .login-form-side {
            padding: 3rem 2rem;
          }

          .back-to-home {
            left: 2rem;
          }
        }

        @media (max-width: 480px) {
          .login-form-side {
            padding: 2rem 1.5rem;
          }

          .back-to-home {
            left: 1.5rem;
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

      <div className="login-container">
        {/* Left Side - Form */}
        <div className="login-form-side">
          <div className="back-to-home" onClick={() => navigate('/')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Back to Home
          </div>

          <div className="login-form-wrapper">
            <div className="logo-section">
              <h1 className="logo">Chatify</h1>
              <h2 className="welcome-text">Welcome Back!</h2>
              <p className="subtitle">Please enter your details to sign in</p>
            </div>

            {error && (
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
                {error}
              </div>
            )}

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email Address</label>
                <div className="input-wrapper">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="form-input"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                  <span className="input-icon">📧</span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <div className="input-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <span 
                    className="input-icon" 
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
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/forgot-password')}
                >
                  Forgot Password?
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  className="btn-login"
                  style={{ flex: 2 }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('');
                    setPassword('');
                    setError('');
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
                  }}
                >
                  Clear Form
                </button>
              </div>
            </form>

            <div className="divider">
              <div className="divider-line"></div>
              <span className="divider-text">or continue with</span>
              <div className="divider-line"></div>
            </div>

            <div className="social-login">
              <GoogleAuthButton mode="login" onError={(msg) => setError(msg)} />
            </div>

            <p className="signup-prompt" style={{ marginTop: '24px' }}>
              Don't have an account? <span className="signup-link" onClick={() => navigate('/register')}>Sign up</span>
            </p>
          </div>
        </div>

        {/* Right Side - Visual */}
        <div className="login-visual-side">
          <div className="background-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>

          <div className="visual-content">
            <h2 className="visual-title">
              Connect with<br/>
              <span style={{ color: '#6fd341', fontWeight: 600 }}>Chatify</span>
            </h2>
            <p className="visual-description">
              Join thousands of users experiencing seamless communication and instant connectivity
            </p>

            <div className="floating-cards">
              <div className="floating-card">
                <span className="card-icon">💬</span>
                <h3 className="card-title">Instant Chat</h3>
                <p className="card-text">Real-time messaging</p>
              </div>
              <div className="floating-card">
                <span className="card-icon">🎥</span>
                <h3 className="card-title">Video Calls</h3>
                <p className="card-text">HD quality calls</p>
              </div>
              <div className="floating-card">
                <span className="card-icon">🤖</span>
                <h3 className="card-title">AI Support</h3>
                <p className="card-text">24/7 assistance</p>
              </div>
              <div className="floating-card">
                <span className="card-icon">🔒</span>
                <h3 className="card-title">Secure</h3>
                <p className="card-text">End-to-end encryption</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;