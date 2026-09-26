import React from 'react';
import { useNavigate } from 'react-router-dom';

const AboutApp = () => {
  const navigate = useNavigate();

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
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
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>ℹ️ About Chatify</h1>
        <div style={{ width: '40px' }} />
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
        borderRadius: '24px',
        padding: '36px 24px',
        textAlign: 'center',
        marginBottom: '28px',
      }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>💬</div>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Chatify App</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '480px', margin: '0 auto' }}>
          A modern, full-stack real-time messaging platform built with MERN architecture, Socket.IO, and MongoDB Atlas.
        </p>
        <div style={{
          display: 'inline-block',
          marginTop: '16px',
          padding: '6px 16px',
          background: '#e0521c',
          color: '#ffffff',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: 700,
        }}>
          Version 1.0.0 (Production Ready)
        </div>
      </div>

      {/* Tech Stack */}
      <div style={{
        background: 'var(--bg-secondary, #f8f9fa)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid var(--border-color, #dee2e6)',
        marginBottom: '24px',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0' }}>Technology Stack</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {[
            { name: 'React 19 & Vite', role: 'Frontend Single Page App' },
            { name: 'Node.js & Express', role: 'Backend REST API' },
            { name: 'MongoDB & Mongoose', role: 'Primary Atlas Database' },
            { name: 'Socket.IO', role: 'Real-time WebSocket Engine' },
            { name: 'JWT & BcryptJS', role: 'Secure Authentication' },
            { name: 'Multer', role: 'Media & File Uploads' },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'var(--bg-primary, #fff)',
                border: '1px solid var(--border-color, #dee2e6)',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.name}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{item.role}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Highlights */}
      <div style={{
        background: 'var(--bg-secondary, #f8f9fa)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid var(--border-color, #dee2e6)',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px 0' }}>Key Features</h3>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280', fontSize: '13px', lineHeight: 1.8 }}>
          <li>Instant 1-on-1 and Group chats with real-time delivery and read receipts</li>
          <li>Real-time typing indicators and online/offline presence tracking</li>
          <li>Rich media file and document sharing with image preview</li>
          <li>Starred messages, in-chat and cross-conversation message search</li>
          <li>Message reactions, replies with quoted bubbles, editing, and deletion</li>
          <li>Do Not Disturb Focus Mode with pomodoro timer</li>
          <li>Multi-language support with instant i18n switching</li>
          <li>Temporary chat mode with configurable disappearing message timers</li>
          <li>Comprehensive privacy controls, blocked list, and active session manager</li>
        </ul>
      </div>
    </div>
  );
};

export default AboutApp;
