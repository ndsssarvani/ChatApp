import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';

export const GoogleAuthButton = ({ mode = 'login', onError, fullWidth = true }) => {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showChooser, setShowChooser] = useState(false);
  const [existingAccounts, setExistingAccounts] = useState([]);
  const [fetchingAccounts, setFetchingAccounts] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Fetch real registered Google accounts from backend
  const fetchAccounts = async () => {
    setFetchingAccounts(true);
    try {
      const res = await authService.getGoogleAccounts();
      if (res.success && Array.isArray(res.accounts)) {
        setExistingAccounts(res.accounts);
      }
    } catch (err) {
      console.warn('[Google Auth] Error fetching accounts:', err);
    } finally {
      setFetchingAccounts(false);
    }
  };

  const handleOpenChooser = () => {
    setStatusMsg('');
    setShowChooser(true);
    fetchAccounts();
  };

  const handleAccountSelect = async (account) => {
    setLoading(true);
    setStatusMsg('');
    try {
      const res = await loginWithGoogle({
        email: account.email,
        name: account.name,
        picture: account.avatar,
      });

      if (res.success) {
        setShowChooser(false);
        navigate('/dashboard');
      } else {
        setStatusMsg(res.message || 'Failed to sign in with Google');
        if (onError) onError(res.message);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Google authentication failed';
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
        setStatusMsg(res.message || 'Authentication failed');
        if (onError) onError(res.message);
      }
    } catch (err) {
      setStatusMsg(err.message || 'Authentication failed');
      if (onError) onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {statusMsg && !showChooser && (
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
          onClick={handleOpenChooser}
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
      </div>

      {/* Google Real Accounts Chooser Modal */}
      {showChooser && (
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
          onClick={() => setShowChooser(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              maxWidth: '460px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              textAlign: 'left',
              fontFamily: 'inherit',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="26" height="26" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#202124' }}>
                  Choose a Google Account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowChooser(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.3rem',
                  cursor: 'pointer',
                  color: '#5f6368',
                  lineHeight: 1,
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: '0 0 16px 0', fontSize: '0.88rem', color: '#5f6368' }}>
              Select an existing Google Account to continue to <strong>Chatify</strong>
            </p>

            {statusMsg && (
              <div
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  color: '#dc2626',
                  fontSize: '0.85rem',
                  marginBottom: '14px',
                }}
              >
                {statusMsg}
              </div>
            )}

            {/* List of Real Existing Google Accounts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {fetchingAccounts ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '0.9rem' }}>
                  Loading Google accounts...
                </div>
              ) : existingAccounts.length > 0 ? (
                existingAccounts.map((acc, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleAccountSelect(acc)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      border: '1.5px solid #e5e7eb',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: '#ffffff',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4285F4';
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(66, 133, 244, 0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <img
                      src={acc.avatar}
                      alt={acc.name}
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        backgroundColor: '#f3f4f6',
                        flexShrink: 0,
                        border: '1px solid #e5e7eb',
                      }}
                      onError={(e) => {
                        e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(acc.name)}&backgroundColor=4285F4`;
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {acc.name}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#4b5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {acc.email}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 700, flexShrink: 0 }}>
                      Sign In &rarr;
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '16px', color: '#6b7280', fontSize: '0.88rem' }}>
                  No accounts found. Use the option below to sign in with your Google email.
                </div>
              )}
            </div>

            {/* Toggle Add Another Google Account */}
            {!showAddAccount ? (
              <button
                type="button"
                onClick={() => setShowAddAccount(true)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1.5px dashed #d1d5db',
                  background: 'transparent',
                  color: '#4b5563',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#4285F4')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
              >
                <span>➕</span> Use another Google Account
              </button>
            ) : (
              <form onSubmit={handleCustomSubmit} style={{ marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                    Google Email
                  </label>
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    required
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #d1d5db',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                    Full Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Your Name"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
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
                      padding: '8px 12px',
                      backgroundColor: '#f3f4f6',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: '#4b5563',
                      cursor: 'pointer',
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      flex: 2,
                      padding: '8px 12px',
                      backgroundColor: '#4285F4',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: '#ffffff',
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loading ? 'Signing in...' : 'Sign In with Account'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default GoogleAuthButton;
