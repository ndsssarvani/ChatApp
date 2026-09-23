import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const socketRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && user?._id) {
      // Connect socket to backend (using proxy or port 5000)
      const newSocket = io('http://localhost:5000', {
        transports: ['websocket', 'polling'],
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      newSocket.on('connect', () => {
        newSocket.emit('setup', user._id);
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

      return () => {
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
