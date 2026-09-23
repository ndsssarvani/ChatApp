import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      fontFamily: 'Inter, sans-serif',
      color: '#1a1a1a',
    }}>
      <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>💬</div>
      <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.5rem', color: '#16a34a' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Page Not Found</h2>
      <p style={{ color: '#4b5563', maxWidth: '400px', marginBottom: '2rem' }}>
        The page you are looking for doesn't exist or has been moved.
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          padding: '0.75rem 1.75rem',
          background: '#22c55e',
          color: '#ffffff',
          border: 'none',
          borderRadius: '12px',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
          transition: 'all 0.2s',
        }}
      >
        Go to Dashboard
      </button>
    </div>
  );
};

export default NotFound;
