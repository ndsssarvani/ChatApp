import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Listen for auth expired event (fired by api.js 401 interceptor)
  // This ensures clean React Router navigation without hard page reload
  useEffect(() => {
    const handleAuthExpired = () => {
      navigate('/login', { replace: true });
    };
    window.addEventListener('chatify_auth_expired', handleAuthExpired);
    return () => window.removeEventListener('chatify_auth_expired', handleAuthExpired);
  }, [navigate]);

  // While session is being restored from storage, show loading screen.
  // NEVER redirect to /login during this phase — it causes the mobile app
  // to bounce: Dashboard → Login → Dashboard (auth flicker).
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-primary, #0f172a)',
        color: '#51cf66',
        fontSize: '1.25rem',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '2.5rem',
            marginBottom: '1rem',
            animation: 'spin 1s linear infinite',
            display: 'inline-block'
          }}>💬</div>
          <p style={{ color: '#94a3b8', fontSize: '1rem' }}>Loading Chatify...</p>
        </div>
      </div>
    );
  }

  // Session restoration is complete — now decide
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Don't redirect during loading — wait for session restoration
  if (loading) {
    return null;
  }

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
