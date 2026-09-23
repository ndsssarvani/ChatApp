import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import messageService from '../services/messageService';

const MessageSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await messageService.searchMessages(query.trim());
      if (res.success) {
        setResults(res.messages || []);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
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
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Message Search</h1>
        <div style={{ width: '40px' }} />
      </div>

      {/* Search Input Form */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            placeholder="Type text to search all chats..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 40px',
              borderRadius: '12px',
              border: '1px solid var(--border-color, #dee2e6)',
              background: 'var(--bg-secondary, #f8f9fa)',
              color: 'inherit',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <span style={{ position: 'absolute', left: '14px', top: '12px', color: '#9ca3af' }}>🔍</span>
        </div>
        <button
          type="submit"
          style={{
            padding: '12px 24px',
            background: '#22c55e',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Search
        </button>
      </form>

      {/* Results */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Searching messages...</div>
      ) : hasSearched && results.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
          <h3>No matching messages found</h3>
          <p style={{ fontSize: '14px' }}>Try searching with a different keyword.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {results.map((msg) => (
            <div
              key={msg._id}
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'var(--bg-secondary, #f8f9fa)',
                border: '1px solid var(--border-color, #dee2e6)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px', color: '#22c55e' }}>
                  {msg.sender?.name || 'User'}
                </span>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageSearch;
