import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../services/userService';

const ChatPersonalization = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('chat-theme') || 'light');
  const [wallpaper, setWallpaper] = useState('default');
  const [fontSize, setFontSize] = useState('medium');
  const [saved, setSaved] = useState(false);

  const wallpapers = [
    { id: 'default', name: 'Default Clean', bg: '#f8f9fa' },
    { id: 'dots', name: 'Subtle Mesh', bg: 'radial-gradient(#e2e8f0 1px, transparent 1px)' },
    { id: 'gradient', name: 'Emerald Glow', bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' },
    { id: 'dark-nebula', name: 'Midnight Deep', bg: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)' },
  ];

  const handleSave = async () => {
    localStorage.setItem('chat-theme', theme);
    try {
      await userService.updatePreferences({
        theme,
        chatWallpaper: wallpaper,
        fontSize,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save personalization:', err);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary, #ffffff)',
      color: 'var(--text-primary, #1a1a1a)',
      fontFamily: 'Inter, sans-serif',
      padding: '24px 20px',
      maxWidth: '700px',
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
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>🎨 Personalization & Themes</h1>
        <div style={{ width: '40px' }} />
      </div>

      {saved && (
        <div style={{
          padding: '10px 16px',
          background: '#dcfce7',
          color: '#15803d',
          borderRadius: '10px',
          marginBottom: '20px',
          fontWeight: 600,
          textAlign: 'center',
        }}>
          Preferences saved successfully!
        </div>
      )}

      {/* Theme selection */}
      <div style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Theme Appearance</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div
            onClick={() => setTheme('light')}
            style={{
              padding: '20px',
              borderRadius: '16px',
              border: theme === 'light' ? '2px solid #e0521c' : '1px solid var(--border-color)',
              background: '#ffffff',
              color: '#111827',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '24px' }}>☀️</span>
            <div>
              <div style={{ fontWeight: 700 }}>Light Mode</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Clean & bright</div>
            </div>
          </div>

          <div
            onClick={() => setTheme('dark')}
            style={{
              padding: '20px',
              borderRadius: '16px',
              border: theme === 'dark' ? '2px solid #e0521c' : '1px solid var(--border-color)',
              background: '#1a1d29',
              color: '#e9ecef',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '24px' }}>🌙</span>
            <div>
              <div style={{ fontWeight: 700 }}>Dark Mode</div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>Sleek & eye-friendly</div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallpapers */}
      <div style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Chat Wallpaper</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {wallpapers.map((wp) => (
            <div
              key={wp.id}
              onClick={() => setWallpaper(wp.id)}
              style={{
                height: '80px',
                borderRadius: '12px',
                border: wallpaper === wp.id ? '3px solid #e0521c' : '1px solid var(--border-color)',
                background: wp.bg,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '13px',
                color: wp.id === 'dark-nebula' ? '#fff' : '#1a1a1a',
              }}
            >
              {wp.name}
            </div>
          ))}
        </div>
      </div>

      {/* Font size */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Message Font Size</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          {['small', 'medium', 'large'].map((size) => (
            <button
              key={size}
              onClick={() => setFontSize(size)}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: fontSize === size ? '2px solid #e0521c' : '1px solid var(--border-color)',
                background: fontSize === size ? '#e0521c' : 'var(--bg-secondary, #f8f9fa)',
                color: fontSize === size ? '#ffffff' : 'inherit',
                fontWeight: 600,
                textTransform: 'capitalize',
                cursor: 'pointer',
              }}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        style={{
          width: '100%',
          padding: '14px',
          background: '#e0521c',
          color: 'white',
          border: 'none',
          borderRadius: '14px',
          fontSize: '16px',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(224, 82, 28, 0.3)',
        }}
      >
        Save Personalization
      </button>
    </div>
  );
};

export default ChatPersonalization;
