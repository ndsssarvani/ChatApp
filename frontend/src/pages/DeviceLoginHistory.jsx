import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../services/userService';

const DeviceLoginHistory = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await userService.getSessions();
      if (res.success) {
        setSessions(res.sessions || []);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleLogoutOthers = async () => {
    if (window.confirm('Log out all other devices and browser sessions?')) {
      try {
        const res = await userService.logoutOtherSessions();
        if (res.success) {
          setMessage('Other sessions logged out successfully');
          fetchSessions();
          setTimeout(() => setMessage(''), 3000);
        }
      } catch (err) {
        alert('Failed to log out other sessions');
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary, #ffffff)',
      color: 'var(--text-primary, #1a1a1a)',
      fontFamily: 'Inter, sans-serif',
      padding: '24px 20px',
      maxWidth: '750px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'var(--bg-tertiary, #f1f3f5)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            fontSize: '18px',
          }}
        >
          ←
        </button>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>📱 Device Login History</h1>
        <div style={{ width: '40px' }} />
      </div>

      {message && (
        <div style={{
          padding: '10px 16px',
          background: '#dcfce7',
          color: '#15803d',
          borderRadius: '10px',
          marginBottom: '20px',
          fontWeight: 600,
          textAlign: 'center',
        }}>
          {message}
        </div>
      )}

      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Active Sessions</h3>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '13px' }}>
            Devices currently logged into your Chatify account
          </p>
        </div>
        <button
          onClick={handleLogoutOthers}
          style={{
            padding: '8px 14px',
            background: '#fee2e2',
            color: '#dc2626',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Log Out Others
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Loading session history...</div>
      ) : sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No other active sessions found</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sessions.map((session, idx) => (
            <div
              key={session._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderRadius: '14px',
                background: 'var(--bg-secondary, #f8f9fa)',
                border: '1px solid var(--border-color, #dee2e6)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '24px' }}>
                  {session.device?.includes('Mobile') ? '📱' : '💻'}
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>
                    {session.browser} on {session.os} {idx === 0 && <span style={{ color: '#e0521c', fontSize: '12px' }}>(Current Session)</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                    IP: {session.ip} • Last active: {new Date(session.lastActive).toLocaleString()}
                  </div>
                </div>
              </div>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: session.isActive ? '#10b981' : '#9ca3af',
              }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeviceLoginHistory;