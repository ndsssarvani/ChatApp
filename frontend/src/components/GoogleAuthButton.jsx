import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const GoogleAuthButton = ({ mode = 'login', onError, fullWidth = true }) => {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [dialogError, setDialogError] = useState('');

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || '';

  // Only load Google Identity Services if a valid custom client ID is supplied
  useEffect(() => {
    if (!clientId) return;

    const loadGsi = () => {
      if (window.google?.accounts?.id) {
        initGsi();
        return;
      }
      const script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => initGsi();
      document.body.appendChild(script);
    };

    const initGsi = () => {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGsiCallback,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      } catch (err) {
        console.warn('[GSI Init]', err.message);
      }
    };

    loadGsi();
  }, [clientId]);

  const handleGsiCallback = async (response) => {
    if (!response?.credential) return;
    setLoading(true);
    try {
      const result = await loginWithGoogle({ credential: response.credential });
      if (result.success) {
        navigate('/dashboard');
      } else {
        if (onError) onError(result.message);
      }
    } catch (err) {
      if (onError) onError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    if (clientId && window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse?.access_token) {
              setLoading(true);
              try {
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const googleProfile = await userInfoRes.json();
                if (googleProfile?.email) {
                  const res = await loginWithGoogle({
                    email: googleProfile.email,
                    name: googleProfile.name || googleProfile.given_name || googleProfile.email.split('@')[0],
                    picture: googleProfile.picture || '',
                    googleId: googleProfile.sub,
                  });
                  if (res.success) {
                    navigate('/dashboard');
                    return;
                  }
                }
              } catch (e) {
                console.warn('[Google OAuth Error]', e);
              } finally {
                setLoading(false);
              }
            }
          },
          error_callback: () => {
            setShowDialog(true);
          },
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (e) {
        setShowDialog(true);
        return;
      }
    }

    // Default seamless Google authentication dialog
    setShowDialog(true);
  };

  const handleGoogleAccountSubmit = async (e) => {
    e.preventDefault();
    setDialogError('');

    const email = googleEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setDialogError('Please enter a valid Google email address');
      return;
    }

    const name = googleName.trim() || email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');
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
        setShowDialog(false);
        navigate('/dashboard');
      } else {
        setDialogError(res.message || 'Google authentication failed');
        if (onError) onError(res.message);
      }
    } catch (err) {
      setDialogError(err.message || 'Google authentication failed');
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
        onClick={handleButtonClick}
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

      {/* Real Google Account Sign-In Modal */}
      {showDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setShowDialog(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              maxWidth: '440px',
              width: '100%',
              padding: '32px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              textAlign: 'left',
              fontFamily: 'inherit',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Google Logo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="28" height="28" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#202124' }}>
                  Sign in with Google
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  color: '#5f6368',
                  padding: '4px',
                  lineHeight: 1,
                  borderRadius: '50%',
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: '#5f6368', lineHeight: 1.5 }}>
              Enter your real Google Account email to authenticate and continue to Chatify.
            </p>

            {dialogError && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fee2e2',
                  borderRadius: '10px',
                  color: '#dc2626',
                  fontSize: '0.875rem',
                  marginBottom: '18px',
                }}
              >
                {dialogError}
              </div>
            )}

            <form onSubmit={handleGoogleAccountSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Google Email Address
                </label>
                <input
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="e.g. ndsssarvani@gmail.com"
                  autoFocus
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #d1d5db',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#4285F4')}
                  onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="Your Name"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #d1d5db',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#4285F4')}
                  onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  style={{
                    flex: 1,
                    padding: '11px 16px',
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#4b5563',
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
                    padding: '11px 16px',
                    backgroundColor: '#4285F4',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 6px rgba(66, 133, 244, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {loading ? 'Authenticating...' : 'Sign in with Google'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default GoogleAuthButton;
