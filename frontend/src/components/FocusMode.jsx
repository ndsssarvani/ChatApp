import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../services/userService';

const FocusMode = () => {
  const navigate = useNavigate();
  const [isFocusActive, setIsFocusActive] = useState(() => {
    return localStorage.getItem('chatify_focus_mode') === 'true';
  });
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let timer = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      setIsFocusActive(false);
      localStorage.setItem('chatify_focus_mode', 'false');
      alert('Focus session completed! Notifications unmuted.');
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const handleToggleFocus = () => {
    const nextState = !isFocusActive;
    setIsFocusActive(nextState);
    localStorage.setItem('chatify_focus_mode', nextState.toString());
    userService.updatePreferences({ doNotDisturb: nextState }).catch(() => {});

    if (nextState) {
      setTimeLeft(durationMinutes * 60);
      setIsRunning(true);
    } else {
      setIsRunning(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary, #ffffff)',
      color: 'var(--text-primary, #1a1a1a)',
      fontFamily: 'Inter, sans-serif',
      padding: '24px 20px',
      maxWidth: '650px',
      margin: '0 auto',
      textAlign: 'center',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
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
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>🎯 Focus Mode</h1>
        <div style={{ width: '40px' }} />
      </div>

      <div style={{
        background: isFocusActive ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : 'var(--bg-secondary, #f8f9fa)',
        borderRadius: '24px',
        padding: '40px 24px',
        border: '1px solid var(--border-color, #dee2e6)',
        marginBottom: '24px',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>
          {isFocusActive ? '🌿' : '🧘'}
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
          {isFocusActive ? 'Focus Mode is Active' : 'Distraction-Free Messaging'}
        </h2>
        <p style={{ color: '#6b7280', fontSize: '14px', maxWidth: '440px', margin: '0 auto 24px auto' }}>
          Silence notifications, mute sound alerts, and maintain deep concentration while you work or study.
        </p>

        {/* Timer Display */}
        <div style={{
          fontSize: '3.5rem',
          fontWeight: 800,
          fontFamily: 'monospace',
          color: isFocusActive ? '#16a34a' : 'inherit',
          marginBottom: '24px',
        }}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>

        {/* Duration selector */}
        {!isRunning && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
            {[15, 25, 45, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => {
                  setDurationMinutes(mins);
                  setTimeLeft(mins * 60);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: durationMinutes === mins ? '2px solid #22c55e' : '1px solid var(--border-color)',
                  background: durationMinutes === mins ? '#22c55e' : 'var(--bg-primary, #fff)',
                  color: durationMinutes === mins ? '#ffffff' : 'inherit',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {mins} mins
              </button>
            ))}
          </div>
        )}

        {/* Big Toggle Button */}
        <button
          onClick={handleToggleFocus}
          style={{
            padding: '14px 36px',
            borderRadius: '16px',
            border: 'none',
            background: isFocusActive ? '#ef4444' : '#22c55e',
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            transition: 'all 0.2s',
          }}
        >
          {isFocusActive ? 'Turn Off Focus Mode' : 'Start Focus Session'}
        </button>
      </div>

      <div style={{
        background: 'var(--bg-secondary, #f8f9fa)',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid var(--border-color, #dee2e6)',
        textAlign: 'left',
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 10px 0' }}>When Focus Mode is active:</h3>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280', fontSize: '13px', lineHeight: 1.8 }}>
          <li>Audio notification chimes and sounds are completely silenced</li>
          <li>Incoming banners are suppressed to eliminate distractions</li>
          <li>Your contacts see a focused status indicator next to your name</li>
          <li>Messages are securely received and waiting when your session ends</li>
        </ul>
      </div>
    </div>
  );
};

export default FocusMode;
