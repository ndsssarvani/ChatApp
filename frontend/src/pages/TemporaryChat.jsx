import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import conversationService from '../services/conversationService';

const TemporaryChat = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState('');
  const [isTemporary, setIsTemporary] = useState(false);
  const [timerHours, setTimerHours] = useState(24);
  const [loading, setLoading] = useState(true);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    const fetchConvs = async () => {
      try {
        setLoading(true);
        const res = await conversationService.getConversations();
        if (res.success && res.conversations) {
          setConversations(res.conversations);
          if (res.conversations.length > 0) {
            const first = res.conversations[0];
            setSelectedConvId(first._id);
            setIsTemporary(!!first.isTemporary);
            setTimerHours(first.temporaryTimerHours || 24);
          }
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConvs();
  }, []);

  const handleSelectConv = (convId) => {
    setSelectedConvId(convId);
    const found = conversations.find((c) => c._id === convId);
    if (found) {
      setIsTemporary(!!found.isTemporary);
      setTimerHours(found.temporaryTimerHours || 24);
    }
  };

  const handleSave = async () => {
    if (!selectedConvId) return;
    try {
      const res = await conversationService.setTemporaryTimer(selectedConvId, isTemporary, timerHours);
      if (res.success) {
        setSavedMsg('Temporary chat settings updated!');
        setTimeout(() => setSavedMsg(''), 3000);
      }
    } catch (err) {
      alert('Failed to update temporary chat settings');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary, #ffffff)',
      color: 'var(--text-primary, #1a1a1a)',
      fontFamily: 'Inter, sans-serif',
      padding: '24px 20px',
      maxWidth: '650px',
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
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>⏳ Temporary Chat Mode</h1>
        <div style={{ width: '40px' }} />
      </div>

      {savedMsg && (
        <div style={{
          padding: '10px 16px',
          background: '#dcfce7',
          color: '#15803d',
          borderRadius: '10px',
          marginBottom: '20px',
          fontWeight: 600,
          textAlign: 'center',
        }}>
          {savedMsg}
        </div>
      )}

      <div style={{
        background: 'var(--bg-secondary, #f8f9fa)',
        borderRadius: '20px',
        padding: '28px',
        border: '1px solid var(--border-color, #dee2e6)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '10px' }}>⏳</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Disappearing Messages</h2>
          <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '6px' }}>
            When enabled, messages sent in this conversation automatically expire and are securely deleted after the specified timer.
          </p>
        </div>

        {/* Select conversation */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Choose Conversation
          </label>
          <select
            value={selectedConvId}
            onChange={(e) => handleSelectConv(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db' }}
          >
            {conversations.map((c) => (
              <option key={c._id} value={c._id}>
                {c.isGroup ? `👥 ${c.groupName}` : `💬 ${c.participants?.find((p) => p.name)?.name || 'Direct Chat'}`}
              </option>
            ))}
          </select>
        </div>

        {/* Toggle Disappearing Mode */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          background: 'var(--bg-primary, #fff)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          marginBottom: '20px',
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>Enable Disappearing Messages</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Automatically remove messages after timer</div>
          </div>
          <input
            type="checkbox"
            checked={isTemporary}
            onChange={(e) => setIsTemporary(e.target.checked)}
            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
          />
        </div>

        {/* Expiration Timer selection */}
        {isTemporary && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
              Message Timer
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { hours: 1, label: '1 Hour' },
                { hours: 24, label: '24 Hours' },
                { hours: 168, label: '7 Days' },
              ].map((opt) => (
                <button
                  key={opt.hours}
                  type="button"
                  onClick={() => setTimerHours(opt.hours)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: timerHours === opt.hours ? '2px solid #22c55e' : '1px solid var(--border-color)',
                    background: timerHours === opt.hours ? '#22c55e' : 'var(--bg-primary, #fff)',
                    color: timerHours === opt.hours ? '#ffffff' : 'inherit',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          style={{
            width: '100%',
            padding: '12px',
            background: '#22c55e',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '15px',
            cursor: 'pointer',
          }}
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default TemporaryChat;
