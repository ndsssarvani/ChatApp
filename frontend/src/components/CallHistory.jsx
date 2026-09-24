import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import callService from '../services/callService';

const CallHistory = ({ onClose, onSelectChat }) => {
  const { user: currentUser } = useAuth();
  const { startCall } = useCall();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'missed'

  const fetchCalls = async () => {
    try {
      setLoading(true);
      const res = await callService.getCalls();
      if (res.success) {
        setCalls(res.calls || []);
      }
    } catch (err) {
      console.error('[CallHistory] Error fetching calls:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  const handleDeleteCall = async (e, callId) => {
    e.stopPropagation();
    try {
      await callService.deleteCall(callId);
      setCalls((prev) => prev.filter((c) => c._id !== callId));
    } catch (err) {
      console.error('[CallHistory] Error deleting call:', err);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Clear all call history?')) return;
    try {
      await callService.clearCallHistory();
      setCalls([]);
    } catch (err) {
      console.error('[CallHistory] Error clearing calls:', err);
    }
  };

  const formatDuration = (secs = 0) => {
    if (!secs) return '0s';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const filteredCalls = filter === 'missed'
    ? calls.filter((c) => c.status === 'missed')
    : calls;

  return (
    <div className="call-history-modal-overlay" onClick={onClose}>
      <div className="call-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="call-history-header">
          <div className="history-title-area">
            <h2>📞 Call Logs & History</h2>
            <p>Review incoming, outgoing, and missed audio/video calls</p>
          </div>
          <div className="history-header-actions">
            {calls.length > 0 && (
              <button
                type="button"
                className="clear-history-btn"
                onClick={handleClearHistory}
                title="Clear Call History"
              >
                Clear All
              </button>
            )}
            <button type="button" className="history-close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="call-history-tabs">
          <button
            type="button"
            className={`history-tab-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Calls ({calls.length})
          </button>
          <button
            type="button"
            className={`history-tab-btn ${filter === 'missed' ? 'active' : ''}`}
            onClick={() => setFilter('missed')}
          >
            Missed Calls ({calls.filter((c) => c.status === 'missed').length})
          </button>
        </div>

        {/* Call List */}
        <div className="call-history-list">
          {loading ? (
            <div className="history-loading-state">Loading call logs...</div>
          ) : filteredCalls.length === 0 ? (
            <div className="history-empty-state">
              <span className="empty-call-icon">📞</span>
              <h3>No Call History</h3>
              <p>When you make or receive audio and video calls, they will appear here.</p>
            </div>
          ) : (
            filteredCalls.map((call) => {
              const isCaller = call.caller?._id === currentUser?._id;
              const peer = isCaller ? call.receiver : call.caller;
              const isMissed = call.status === 'missed';
              const isRejected = call.status === 'rejected';

              return (
                <div key={call._id} className="call-history-item">
                  <img
                    src={
                      peer?.avatar ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${peer?.name || 'User'}`
                    }
                    alt={peer?.name}
                    className="call-peer-avatar"
                  />

                  <div className="call-peer-info">
                    <div className="call-peer-name">
                      <span>{peer?.name || 'Unknown User'}</span>
                      {call.callType === 'video' ? (
                        <span className="call-type-badge video">📹 Video</span>
                      ) : (
                        <span className="call-type-badge audio">📞 Audio</span>
                      )}
                    </div>

                    <div className="call-meta-line">
                      <span className={`call-status-indicator ${isMissed ? 'missed' : isCaller ? 'outgoing' : 'incoming'}`}>
                        {isMissed ? '↙ Missed Call' : isCaller ? '↗ Outgoing' : '↙ Incoming'}
                      </span>
                      <span>•</span>
                      <span>{new Date(call.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {call.duration > 0 && (
                        <>
                          <span>•</span>
                          <span>{formatDuration(call.duration)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="call-item-actions">
                    <button
                      type="button"
                      className="call-back-btn audio"
                      onClick={() => {
                        if (peer) startCall(peer, 'audio');
                      }}
                      title="Audio Call Back"
                    >
                      📞
                    </button>
                    <button
                      type="button"
                      className="call-back-btn video"
                      onClick={() => {
                        if (peer) startCall(peer, 'video');
                      }}
                      title="Video Call Back"
                    >
                      📹
                    </button>
                    <button
                      type="button"
                      className="call-delete-btn"
                      onClick={(e) => handleDeleteCall(e, call._id)}
                      title="Delete Call Log"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CallHistory;
