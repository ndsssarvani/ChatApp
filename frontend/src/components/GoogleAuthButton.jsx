import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const GoogleAuthButton = ({ mode = 'login', onError, fullWidth = true }) => {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [customClientId, setCustomClientId] = useState(
    () => localStorage.getItem('chatify_google_client_id') || import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
  );
  const [statusMsg, setStatusMsg] = useState('');
  const googleBtnContainerRef = useRef(null);

  const activeClientId = customClientId.trim();

  // Initialize official Google Identity Services whenever activeClientId is present
  useEffect(() => {
    if (!activeClientId) return;

    const loadGsiScript = () => {
      if (window.google?.accounts?.id) {
        setupGoogleGsi();
        return;
      }
      const script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => setupGoogleGsi();
      document.body.appendChild(script);
    };

    const setupGoogleGsi = () => {
      try {
        window.google.accounts.id.initialize({
          client_id: activeClientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (googleBtnContainerRef.current) {
          googleBtnContainerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            text: mode === 'register' ? 'signup_with' : 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: fullWidth ? 380 : 280,
          });
        }
      } catch (err) {
        console.warn('[GSI Setup Warning]', err.message);
      }
    };

    loadGsiScript();
  }, [activeClientId, mode, fullWidth]);

  // Handle Google GIS ID Token response
  const handleGoogleCredentialResponse = async (response) => {
    if (!response?.credential) return;
    setLoading(true);
    setStatusMsg('');
    try {
      const result = await loginWithGoogle({ credential: response.credential });
      if (result.success) {
        navigate('/dashboard');
      } else {
        const msg = result.message || 'Google authentication failed';
        setStatusMsg(msg);
        if (onError) onError(msg);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Google authentication failed';
      setStatusMsg(msg);
      if (onError) onError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Trigger Google Official OAuth2 popup
  const handleGoogleOAuthPopup = () => {
    setStatusMsg('');

    if (!activeClientId) {
      setShowConfigModal(true);
      return;
    }

    setLoading(true);

    if (window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: activeClientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse?.access_token) {
              try {
                const res = await loginWithGoogle({ accessToken: tokenResponse.access_token });
                if (res.success) {
                  navigate('/dashboard');
                  return;
                } else {
                  setStatusMsg(res.message || 'Failed to authenticate Google account');
                }
              } catch (err) {
                setStatusMsg(err.message || 'Google authentication error');
              } finally {
                setLoading(false);
              }
            } else {
              setLoading(false);
            }
          },
          error_callback: (err) => {
            setLoading(false);
            console.warn('[Google OAuth Popup Closed]', err);
            if (err?.type === 'popup_failed_to_open') {
              setStatusMsg('Popup was blocked by your browser. Please allow popups for this site.');
            }
          },
        });

        client.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (e) {
        console.warn('[TokenClient initialization error]', e);
      }
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setLoading(false);
          setShowConfigModal(true);
        }
      });
    } else {
      setLoading(false);
      setShowConfigModal(true);
    }
  };

  const handleSaveClientId = (e) => {
    e.preventDefault();
    const id = customClientId.trim();
    if (!id) {
      setStatusMsg('Please enter a valid Google OAuth Client ID');
      return;
    }
    localStorage.setItem('chatify_google_client_id', id);
    setShowConfigModal(false);
    setStatusMsg('Google Client ID connected! Launching Google sign-in...');
    setTimeout(() => {
      handleGoogleOAuthPopup();
    }, 500);
  };

  return (
    <>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {statusMsg && (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '0.85rem',
              textAlign: 'center',
            }}
          >
            {statusMsg}
          </div>
        )}

        {/* Main Google Sign-In Button */}
        <button
          type="button"
          className="google-auth-btn"
          onClick={handleGoogleOAuthPopup}
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
              ? 'Opening Google Sign-In...'
              : mode === 'register'
              ? 'Sign up with Google'
              : 'Sign in with Google'}
          </span>
        </button>

        {/* Hidden Container for standard GIS rendering if active */}
        <div ref={googleBtnContainerRef} style={{ display: 'none' }} />
      </div>

      {/* Google Cloud Client ID Configuration Modal */}
      {showConfigModal && (
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
          }}
          onClick={() => setShowConfigModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              maxWidth: '480px',
              width: '100%',
              padding: '32px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              textAlign: 'left',
              fontFamily: 'inherit',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="28" height="28" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#202124' }}>
                  Google OAuth 2.0 Setup
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  color: '#5f6368',
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#5f6368', lineHeight: 1.5 }}>
              To open Google's real authentication window and allow logging in with your authentic Google Account, paste your <strong>Google Cloud OAuth 2.0 Web Client ID</strong> below:
            </p>

            <form onSubmit={handleSaveClientId}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Google Client ID (.apps.googleusercontent.com)
                </label>
                <input
                  type="text"
                  value={customClientId}
                  onChange={(e) => setCustomClientId(e.target.value)}
                  placeholder="e.g. 1234567890-abc123xyz.apps.googleusercontent.com"
                  autoFocus
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #d1d5db',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '0.825rem',
                color: '#475569',
                marginBottom: '20px',
                lineHeight: 1.5
              }}>
                <strong>How to get your Google Client ID:</strong>
                <ol style={{ margin: '6px 0 0 0', paddingLeft: '18px' }}>
                  <li>Visit <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}>Google Cloud Console</a></li>
                  <li>Click <strong>Create Credentials &gt; OAuth client ID</strong> (Application type: <em>Web application</em>)</li>
                  <li>Add your domain/localhost to <em>Authorized JavaScript origins</em></li>
                  <li>Copy and paste the Client ID above.</li>
                </ol>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
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
                  style={{
                    flex: 2,
                    padding: '11px 16px',
                    backgroundColor: '#4285F4',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(66, 133, 244, 0.4)',
                  }}
                >
                  Connect & Sign In
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
