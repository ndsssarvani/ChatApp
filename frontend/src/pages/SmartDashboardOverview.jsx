import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import analyticsService from '../services/analyticsService';

const SmartDashboardOverview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await analyticsService.getOverview();
        if (res.success) {
          setStats(res.stats);
        }
      } catch (err) {
        console.error('Failed to load overview:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary, #ffffff)',
      color: 'var(--text-primary, #1a1a1a)',
      fontFamily: 'Inter, sans-serif',
      padding: '24px 20px',
      maxWidth: '900px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <button
          onClick={() => navigate('/dashboard')}
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
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>📊 Smart Dashboard Overview</h1>
        <div style={{ width: '40px' }} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>Calculating metrics...</div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
              padding: '20px',
              borderRadius: '16px',
              color: '#14532d',
            }}>
              <div style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Conversations</div>
              <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px' }}>{stats?.totalConversations || 0}</div>
              <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>Active channels</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              padding: '20px',
              borderRadius: '16px',
              color: '#78350f',
            }}>
              <div style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Unread Messages</div>
              <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px' }}>{stats?.unreadMessages || 0}</div>
              <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>Pending review</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
              padding: '20px',
              borderRadius: '16px',
              color: '#312e81',
            }}>
              <div style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Messages Sent</div>
              <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px' }}>{stats?.messagesSent || 0}</div>
              <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>Total outgoing</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
              padding: '20px',
              borderRadius: '16px',
              color: '#831843',
            }}>
              <div style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Online Contacts</div>
              <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px' }}>{stats?.onlineContactsCount || 0}</div>
              <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>Active right now</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{
            background: 'var(--bg-secondary, #f8f9fa)',
            padding: '24px',
            borderRadius: '20px',
            border: '1px solid var(--border-color, #dee2e6)',
            marginBottom: '32px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0' }}>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <button
                onClick={() => navigate('/dashboard')}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#e0521c',
                  color: 'white',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                💬 Open Chat
              </button>
              <button
                onClick={() => navigate('/contacts')}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'var(--bg-primary, #fff)',
                  color: 'inherit',
                  border: '1px solid var(--border-color)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                📇 View Contacts
              </button>
              <button
                onClick={() => navigate('/analytics')}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'var(--bg-primary, #fff)',
                  color: 'inherit',
                  border: '1px solid var(--border-color)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                📈 View Analytics
              </button>
            </div>
          </div>

          {/* Recent Conversations */}
          <div style={{
            background: 'var(--bg-secondary, #f8f9fa)',
            padding: '24px',
            borderRadius: '20px',
            border: '1px solid var(--border-color, #dee2e6)',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0' }}>Recent Conversations</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats?.recentConversations?.length > 0 ? (
                stats.recentConversations.map((c) => (
                  <div
                    key={c._id}
                    onClick={() => navigate('/dashboard')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: 'var(--bg-primary, #fff)',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '20px' }}>{c.isGroup ? '👥' : '💬'}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>
                          {c.isGroup ? c.groupName : c.participants?.[0]?.name || 'Chat'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {c.lastMessage?.text || 'Conversation active'}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {new Date(c.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ color: '#9ca3af', textAlign: 'center', padding: '16px' }}>No recent conversations</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SmartDashboardOverview;