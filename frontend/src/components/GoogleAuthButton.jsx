import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const GoogleAuthButton = ({ mode = 'login', onError, fullWidth = true }) => {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const googleBtnRef = useRef(null);

  // Client ID from environment variable or standard Google Web Client configuration
  const clientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '1084203112108-kgh126l7n42u85oamgh8rvi6n27h1o9r.apps.googleusercontent.com';

  useEffect(() => {
    // Load Google Identity Services script
    const loadScript = () => {
      if (document.getElementById('google-gis-sdk')) {
        initGoogleServices();
        return;
      }
      const script = document.createElement('script');
      script.id = 'google-gis-sdk';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => initGoogleServices();
      document.body.appendChild(script);
    };

    const initGoogleServices = () => {
      if (!window.google?.accounts?.id) return;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // If reference div is available, render Google's real official button
        if (googleBtnRef.current) {
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: mode === 'register' ? 'signup_with' : 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: fullWidth ? 380 : 280,
          });
        }
      } catch (err) {
        console.warn('[Google Identity Services] Initialization info:', err.message);
      }
    };

    loadScript();
  }, [clientId, mode, fullWidth]);

  // Handle Google GIS ID Token response
  const handleCredentialResponse = async (response) => {
    if (!response?.credential) return;
    setLoading(true);
    setAuthError('');
    try {
      const result = await loginWithGoogle({ credential: response.credential });
      if (result.success) {
        navigate('/dashboard');
      } else {
        const msg = result.message || 'Google authentication failed';
        setAuthError(msg);
        if (onError) onError(msg);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Google authentication failed';
      setAuthError(msg);
      if (onError) onError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Trigger Google Real Account Chooser Popup (OAuth2 flow)
  const handleGoogleClick = () => {
    setLoading(true);
    setAuthError('');

    if (window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse?.access_token) {
              try {
                // Fetch real Google user profile from Google OAuth2 API
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const googleProfile = await userInfoRes.json();

                if (googleProfile?.email) {
                  const result = await loginWithGoogle({
                    email: googleProfile.email,
                    name: googleProfile.name || googleProfile.given_name || googleProfile.email.split('@')[0],
                    picture: googleProfile.picture || '',
                    googleId: googleProfile.sub,
                  });

                  if (result.success) {
                    navigate('/dashboard');
                    return;
                  } else {
                    const msg = result.message || 'Failed to sign in with Google account';
                    setAuthError(msg);
                    if (onError) onError(msg);
                  }
                } else {
                  const msg = 'Unable to retrieve profile from Google';
                  setAuthError(msg);
                  if (onError) onError(msg);
                }
              } catch (err) {
                const msg = err.message || 'Error communicating with Google services';
                setAuthError(msg);
                if (onError) onError(msg);
              } finally {
                setLoading(false);
              }
            } else {
              setLoading(false);
            }
          },
          error_callback: (err) => {
            setLoading(false);
            console.warn('[Google OAuth Popup Closed/Cancelled]', err);
          },
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('[Google TokenClient error, fallback to prompt]', err);
      }
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setLoading(false);
        }
      });
    } else {
      setLoading(false);
      const msg = 'Google authentication services are loading. Please try again in a moment.';
      setAuthError(msg);
      if (onError) onError(msg);
    }
  };

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {authError && (
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
          {authError}
        </div>
      )}

      {/* Styled Interactive Google Button with official Google Branding */}
      <button
        type="button"
        className="google-auth-btn"
        onClick={handleGoogleClick}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          width: '100%',
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

      {/* Hidden container for rendering native GIS iframe button if preferred */}
      <div ref={googleBtnRef} style={{ display: 'none' }} />
    </div>
  );
};

export default GoogleAuthButton;
