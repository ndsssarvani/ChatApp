import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import messageService from '../services/messageService';

const StarredMessages = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStarred = async () => {
    try {
      setLoading(true);
      const res = await messageService.getStarred();
      if (res.success) {
        setMessages(res.messages || []);
      }
    } catch (err) {
      console.error('Failed to fetch starred messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStarred();
  }, []);

  const handleUnstar = async (msgId, e) => {
    e.stopPropagation();
    try {
      const res = await messageService.toggleStar(msgId);
      if (res.success) {
        setMessages((prev) => prev.filter((m) => m._id !== msgId));
      }
    } catch (err) {
      console.error('Failed to unstar:', err);
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
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>⭐ Starred Messages</h1>
        <div style={{ width: '40px' }} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Loading starred messages...</div>
      ) : messages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>⭐</div>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>No Starred Messages</h3>
          <p style={{ fontSize: '14px', marginTop: '6px' }}>
            Hover over any message in your chats and click the star icon to save it here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.map((msg) => (
            <div
              key={msg._id}
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '16px',
                borderRadius: '14px',
                background: 'var(--bg-secondary, #f8f9fa)',
                border: '1px solid var(--border-color, #dee2e6)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <img
                    src={msg.sender?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${msg.sender?.name || 'U'}`}
                    alt={msg.sender?.name}
                    style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                  />
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{msg.sender?.name}</span>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                    {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ fontSize: '14px', lineHeight: 1.5 }}>
                  {msg.text || (msg.attachments?.length ? '📎 Attachment' : '')}
                </div>
              </div>
              <button
                onClick={(e) => handleUnstar(msg._id, e)}
                title="Unstar"
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ⭐
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StarredMessages;