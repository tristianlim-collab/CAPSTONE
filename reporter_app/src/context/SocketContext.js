import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SOCKET_URL } from '../api';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Always connect, even if not authenticated (for guests)
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      console.log('[Socket] Connected:', socket.id);

      // If logged in, join personal room
      if (isAuthenticated && user?.role === 'REPORTER') {
        const userId = user?.user_id || user?.id;
        if (userId) socket.emit('join_reporter', userId);
      } else {
        // Guest user - join public room for global updates
        socket.emit('join_room', 'public');
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('[Socket] Disconnected');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user]);

  const on = useCallback((eventName, callback) => {
    if (socketRef.current) {
      socketRef.current.on(eventName, callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off(eventName, callback);
      }
    };
  }, []);

  const emit = useCallback((eventName, payload) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(eventName, payload);
    }
  }, [connected]);

  const value = useMemo(
    () => ({
      socket: socketRef.current,
      connected,
      on,
      emit,
    }),
    [connected, on, emit]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within SocketProvider');
  }
  return context;
};
