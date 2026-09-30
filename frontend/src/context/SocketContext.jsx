import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { Capacitor } from '@capacitor/core';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

// Production Railway backend URL — same as api.js
const PRODUCTION_BACKEND = 'https://chatapp-production-df23.up.railway.app';

const resolveSocketUrl = () => {
  const customUrl = localStorage.getItem('chatify_custom_server_url');
  if (customUrl && customUrl.trim()) {
    let clean = customUrl.trim().replace(/\/+$/, '');
    // Strip /api suffix for socket — socket.io connects to root
    if (clean.endsWith('/api')) clean = clean.slice(0, -4);
    return clean;
  }

  const envSocketUrl = import.meta.env.VITE_SOCKET_URL;
  const envApiUrl = import.meta.env.VITE_API_URL;
  let socketUrl = envSocketUrl || envApiUrl;

  // On native Capacitor: must use absolute URL
  if (Capacitor.isNativePlatform()) {
    if (!socketUrl || socketUrl.includes('localhost') || socketUrl.includes('127.0.0.1')) {
      socketUrl = PRODUCTION_BACKEND;
    }
  }

  if (!socketUrl) {
    socketUrl = 'http://localhost:5000';
  }

  socketUrl = socketUrl.trim().replace(/\/+$/, '');
  // Strip /api suffix for socket
  if (socketUrl.endsWith('/api')) {
    socketUrl = socketUrl.slice(0, -4);
  }

  return socketUrl;
};

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const socketRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && user?._id) {
      const socketUrl = resolveSocketUrl();

      const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      newSocket.on('connect', () => {
        newSocket.emit('setup', user._id);
      });

      newSocket.on('connect_error', (err) => {
        // Non-fatal — dashboard will still work, just without real-time updates
        console.warn('[Socket] Connection error:', err.message);
      });

      newSocket.on('connected_users', (userIds) => {
        setOnlineUsers(new Set(userIds));
      });

      newSocket.on('user_status_changed', ({ userId, isOnline }) => {
        setOnlineUsers((prev) => {
          const updated = new Set(prev);
          if (isOnline) {
            updated.add(userId);
          } else {
            updated.delete(userId);
          }
          return updated;
        });
      });

      // Reconnect on native network change
      const handleNativeNetwork = (event) => {
        if (event.detail?.connected && socketRef.current) {
          if (!socketRef.current.connected) {
            socketRef.current.connect();
          }
        }
      };
      window.addEventListener('native_network_changed', handleNativeNetwork);

      return () => {
        window.removeEventListener('native_network_changed', handleNativeNetwork);
        newSocket.disconnect();
        socketRef.current = null;
      };
    } else {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    }
  }, [isAuthenticated, user?._id]);

  const isUserOnline = (userId) => {
    if (!userId) return false;
    const id = typeof userId === 'object' ? userId._id || userId : userId;
    return onlineUsers.has(id.toString());
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        isUserOnline,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
