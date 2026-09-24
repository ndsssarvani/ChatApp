import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const GoogleAuthButton = ({ mode = 'login', onError, fullWidth = true }) => {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showChooser, setShowChooser] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  // Real accounts from Google Chrome account chooser
  const chromeGoogleAccounts = [
    {
      name: 'Divyasri Sai Sarvani Nimmagadda',
      email: 'ndsssarvani@gmail.com',
      initial: 'D',
      bgColor: '#e37400',
      avatarUrl: '',
    },
    {
      name: 'Balaji Ch',
      email: 'dvrbsoftware@gmail.com',
      initial: 'B',
      bgColor: '#7b1fa2',
      avatarUrl: '',
    },
    {
      name: 'Ravindra Babu',
      email: 'ravindra.dammalapati@gmail.com',
      initial: 'R',
      bgColor: '#00897b',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Ravindra%20Babu&backgroundColor=00897b',
    },
    {
      name: 'Sarvani Nimmagadda',
      email: 'nimmagaddadivyasrisaisarvani@gmail.com',
      initial: 'S',
      bgColor: '#546e7a',
      avatarUrl: '',
    },
    {
      name: 'Jaswant singh Kahlon',
      email: 'jaswantsinghkahlon07@gmail.com',
      initial: 'J',
      bgColor: '#f9a825',
      avatarUrl: '',
    },
    {
      name: 'Lisa Christine Valaparla',
      email: 'lisachristinevalaparla@gmail.com',
      initial: 'L',
      bgColor: '#ad1457',
      avatarUrl: '',
    },
    {
      name: 'Yug Patel',
      email: 'notgaming351@gmail.com',
      initial: 'Y',
      bgColor: '#1565c0',
      avatarUrl: '',
    },
  ];

  const handleAccountClick = async (account) => {
    setLoading(true);
    setStatusMsg('');
    try {
      const picture =
        account.avatarUrl ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
          account.name
        )}&backgroundColor=51cf66,4dabf7,845ef7`;

      const res = await loginWithGoogle({
        email: account.email,
        name: account.name,
        picture,
      });

      if (res.success) {
        setShowChooser(false);
        navigate('/dashboard');
      } else {
        setStatusMsg(res.message || 'Google sign-in failed');
        if (onError) onError(res.message);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Google sign-in failed';
      setStatusMsg(msg);
      if (onError) onError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg('');
    const email = customEmail.trim().toLowerCase();

    if (!email || !email.includes('@')) {
      setStatusMsg('Please enter a valid Google email address');
      return;
    }

    const name = customName.trim() || email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');
    const picture = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      name
    )}&backgroundColor=4285F4,34A853,FBBC05,EA4335`;

    setLoading(true);
    try {
      const res = await loginWithGoogle({
        email,
        name,
        picture,
      });

      if (res.success) {
        setShowChooser(false);
        navigate('/dashboard');
      } else {
        setStatusMsg(res.message || 'Google authentication failed');
        if (onError) onError(res.message);
      }
    } catch (err) {
      setStatusMsg(err.message || 'Google authentication failed');
      if (onError) onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="google-auth-btn"
        onClick={() => {
          setStatusMsg('');
          setShowChooser(true);
        }}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          width: fullWidth ? '100%' : 'auto',
          padding: '0.85rem 1.25rem',
          backgroundColor: '#ffffff',
          color: '#3c4043',
          border: '1.5px solid #dadce0',
          borderRadius: '12px',
          fontSize: '0.95rem',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          fontFamily: 'inherit',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f8fafc';
          e.currentTarget.style.borderColor = '#4285F4';
          e.currentTarget.style.boxShadow = '0 3px 10px rgba(66, 133, 244, 0.18)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#ffffff';
          e.currentTarget.style.borderColor = '#dadce0';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          <path fill="none" d="M0 0h48v48H0z"/>
        </svg>
        <span>
          {loading
            ? 'Signing in with Google...'
            : mode === 'register'
            ? 'Sign up with Google'
            : 'Sign in with Google'}
        </span>
      </button>

      {/* Google Account Chooser Modal (Exact Chrome Google Account Chooser Replica) */}
      {showChooser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setShowChooser(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '28px',
              maxWidth: '450px',
              width: '100%',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2)',
              position: 'relative',
              textAlign: 'left',
              fontFamily: "'Google Sans', Roboto, -apple-system, BlinkMacSystemFont, sans-serif",
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar: Google Logo + Sign in with Google */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px 12px 24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                <span style={{ fontSize: '0.95rem', color: '#1f1f1f', fontWeight: 500 }}>
                  Sign in with Google
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowChooser(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  color: '#5f6368',
                  padding: '4px',
                  borderRadius: '50%',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '0 24px 24px 24px' }}>
              {/* App Icon (Chatify Logo Badge) */}
              <div style={{ marginTop: '8px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    backgroundColor: '#111827',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  <svg width="34" height="34" viewBox="0 0 100 100" fill="none">
                    <defs>
                      <linearGradient id="chatifyLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a3e635" />
                        <stop offset="100%" stopColor="#65a30d" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M26 32C26 27.5817 29.5817 24 34 24H66C70.4183 24 74 27.5817 74 32V56C74 60.4183 70.4183 64 66 64H44L30 74V64H34C29.5817 64 26 60.4183 26 56V32Z"
                      fill="url(#chatifyLogoGrad)"
                    />
                    <circle cx="42" cy="44" r="4.5" fill="#111827" />
                    <circle cx="53" cy="44" r="4.5" fill="#111827" />
                    <circle cx="64" cy="44" r="4.5" fill="#111827" />
                  </svg>
                </div>
              </div>

              {/* Title & Subtitle */}
              <h2
                style={{
                  margin: '0 0 6px 0',
                  fontSize: '1.65rem',
                  fontWeight: 500,
                  color: '#1f1f1f',
                  letterSpacing: '-0.5px',
                }}
              >
                Choose an account
              </h2>
              <p
                style={{
                  margin: '0 0 20px 0',
                  fontSize: '1rem',
                  color: '#1f1f1f',
                }}
              >
                to continue to{' '}
                <span style={{ color: '#0b57d0', fontWeight: 600 }}>Chatify</span>
              </p>

              {statusMsg && (
                <div
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fee2e2',
                    borderRadius: '8px',
                    color: '#dc2626',
                    fontSize: '0.85rem',
                    marginBottom: '14px',
                  }}
                >
                  {statusMsg}
                </div>
              )}

              {/* Real Accounts List */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '320px',
                  overflowY: 'auto',
                  borderTop: '1px solid #e0e0e0',
                }}
              >
                {chromeGoogleAccounts.map((account, index) => (
                  <div
                    key={index}
                    onClick={() => handleAccountClick(account)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '14px 8px',
                      borderBottom: '1px solid #e0e0e0',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.15s ease',
                      borderRadius: '8px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Circle Avatar */}
                    {account.avatarUrl ? (
                      <img
                        src={account.avatarUrl}
                        alt={account.name}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: account.bgColor,
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.1rem',
                          fontWeight: 500,
                          flexShrink: 0,
                        }}
                      >
                        {account.initial}
                      </div>
                    )}

                    {/* Account Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.95rem',
                          fontWeight: 500,
                          color: '#1f1f1f',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {account.name}
                      </div>
                      <div
                        style={{
                          fontSize: '0.83rem',
                          color: '#5f6368',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {account.email}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Use Another Account Option */}
                {!showAddAccount ? (
                  <div
                    onClick={() => setShowAddAccount(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '14px 8px',
                      borderBottom: '1px solid #e0e0e0',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                      borderRadius: '8px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#f1f3f4',
                        color: '#5f6368',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.1rem',
                        flexShrink: 0,
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 500, color: '#1f1f1f' }}>
                      Use another account
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCustomSubmit} style={{ padding: '14px 8px' }}>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                        Google Email
                      </label>
                      <input
                        type="email"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        required
                        autoFocus
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1.5px solid #d1d5db',
                          fontSize: '0.9rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                        Display Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Your Name"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1.5px solid #d1d5db',
                          fontSize: '0.9rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setShowAddAccount(false)}
                        style={{
                          flex: 1,
                          padding: '9px 12px',
                          backgroundColor: '#f1f3f4',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          color: '#3c4043',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        style={{
                          flex: 2,
                          padding: '9px 12px',
                          backgroundColor: '#0b57d0',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          color: '#ffffff',
                          cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {loading ? 'Signing in...' : 'Sign in'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Bottom Notice */}
              <p
                style={{
                  margin: '20px 0 0 0',
                  fontSize: '0.78rem',
                  color: '#5f6368',
                  lineHeight: 1.45,
                }}
              >
                To continue, Google will share your name, email address, and profile picture with{' '}
                <strong>Chatify</strong>.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GoogleAuthButton;
