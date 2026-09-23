import React from 'react';
import { useSocket } from '../context/SocketContext';

const OnlineStatus = ({ userId, lastSeen, showText = true }) => {
  const { isUserOnline } = useSocket();
  const online = isUserOnline(userId);

  const formatLastSeen = (date) => {
    if (!date) return 'Offline';
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return isToday ? `Last seen today at ${timeStr}` : `Last seen on ${d.toLocaleDateString()}`;
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: online ? '#22c55e' : '#9ca3af',
        }}
      />
      {showText && (
        <span style={{ fontSize: '12px', color: online ? '#22c55e' : '#6b7280' }}>
          {online ? 'Online' : formatLastSeen(lastSeen)}
        </span>
      )}
    </div>
  );
};

export default OnlineStatus;
