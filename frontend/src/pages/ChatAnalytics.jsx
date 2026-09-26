import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import analyticsService from '../services/analyticsService';

const ChatAnalytics = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await analyticsService.getDetails();
        if (res.success) {
          setData(res.analytics);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const maxCount = Math.max(...(data?.dailyActivity?.map((d) => d.count) || [1]), 5);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary, #ffffff)',
      color: 'var(--text-primary, #1a1a1a)',
      fontFamily: 'Inter, sans-serif',
      padding: '24px 20px',
      maxWidth: '850px',
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
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>📈 Chat Analytics</h1>
        <div style={{ width: '40px' }} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>Loading activity metrics...</div>
      ) : (
        <>
          {/* Key Metric Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}>
            <div style={{
              background: 'var(--bg-secondary, #f8f9fa)',
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid var(--border-color, #dee2e6)',
            }}>
              <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>Total Sent</div>
              <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: '#e0521c' }}>
                {data?.totalSent || 0}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>All-time messages</div>
            </div>

            <div style={{
              background: 'var(--bg-secondary, #f8f9fa)',
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid var(--border-color, #dee2e6)',
            }}>
              <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>Total Received</div>
              <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: '#3b82f6' }}>
                {data?.totalReceived || 0}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Incoming communication</div>
            </div>

            <div style={{
              background: 'var(--bg-secondary, #f8f9fa)',
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid var(--border-color, #dee2e6)',
            }}>
              <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>Media & Files</div>
              <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: '#a855f7' }}>
                {data?.mediaShared || 0}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Attachments exchanged</div>
            </div>
          </div>

          {/* 7-Day Activity Chart */}
          <div style={{
            background: 'var(--bg-secondary, #f8f9fa)',
            padding: '28px',
            borderRadius: '20px',
            border: '1px solid var(--border-color, #dee2e6)',
            marginBottom: '32px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 24px 0' }}>
              Weekly Message Activity (Last 7 Days)
            </h3>

            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              height: '180px',
              paddingTop: '20px',
              gap: '12px',
            }}>
              {data?.dailyActivity?.map((dayItem, index) => {
                const heightPercent = Math.max(8, Math.round((dayItem.count / maxCount) * 100));
                return (
                  <div
                    key={index}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
                      {dayItem.count}
                    </div>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '36px',
                        height: `${heightPercent}%`,
                        background: 'linear-gradient(180deg, #e0521c 0%, #ff6b35 100%)',
                        borderRadius: '8px 8px 0 0',
                        transition: 'height 0.4s ease',
                      }}
                    />
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563', marginTop: '8px' }}>
                      {dayItem.day}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatAnalytics;
