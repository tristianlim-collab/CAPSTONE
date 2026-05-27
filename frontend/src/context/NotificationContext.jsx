import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSocketContext } from './SocketContext';
import { useAuth } from './AuthContext';
import { notificationAPI } from '../api';
import { toast } from 'react-hot-toast';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { on, socket } = useSocketContext();
  const { user, isAuthenticated } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const response = await notificationAPI.getAll();
      const data = response.data.data || [];
      setNotifications(data);
      setUnreadCount(data.filter(n => n.delivery_status !== 'READ').length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const addNotification = useCallback((newNotification) => {
    setNotifications(prev => {
      const exists = prev.some(n => n.notification_id === newNotification.notification_id);
      if (exists) return prev;
      
      const updated = [newNotification, ...prev];
      setUnreadCount(updated.filter(n => n.delivery_status !== 'READ').length);
      return updated.slice(0, 50); // Keep last 50
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !socket) return;

    // Listen for socket events that should trigger a notification
    const cleanupSystemAlert = on('system_alert', (data) => {
      console.log('Socket system_alert:', data);
      const notif = {
        notification_id: Date.now().toString(), // Temp ID for socket-only alerts if needed
        message_body: data.message,
        sent_at: new Date().toISOString(),
        delivery_status: 'SENT',
        incident: data.incident || null
      };
      addNotification(notif);
      toast(data.message, { icon: '🔔' });
    });

    const cleanupNewIncident = on('new_incident', (incident) => {
      if (user?.role === 'ADMIN') {
        const notif = {
          notification_id: `ni-${incident.incident_id}`,
          message_body: `New emergency report: ${incident.incident_type?.name}`,
          sent_at: new Date().toISOString(),
          delivery_status: 'SENT',
          incident
        };
        addNotification(notif);
        toast(`New Incident: ${incident.incident_code}`, { icon: '🚨', duration: 5000 });
      }
    });

    const cleanupAwaitingVerification = on('incident_awaiting_verification', (data) => {
      if (user?.role === 'ADMIN') {
        const notif = {
          notification_id: `av-${data.incident_id}`,
          message_body: `Incident awaiting verification`,
          sent_at: new Date().toISOString(),
          delivery_status: 'SENT',
          incident: data
        };
        addNotification(notif);
        toast(`Awaiting Verification: ${data.incident_code}`, { icon: '📝' });
      }
    });

    const cleanupNewAssignment = on('new_assignment', (data) => {
       // data typically has { incident, assignment }
       const incident = data.incident;
       const notif = {
        notification_id: `as-${data.assignment?.assignment_id || Date.now()}`,
        message_body: `You have been dispatched to a new incident`,
        sent_at: new Date().toISOString(),
        delivery_status: 'SENT',
        incident
      };
      addNotification(notif);
      toast(`New Assignment: ${incident?.incident_code}`, { icon: '🚒', duration: 10000 });
    });

    const cleanupStatusUpdate = on('incident_status_updated', (data) => {
      const notif = {
        notification_id: `su-${data.incident_id}-${Date.now()}`,
        message_body: `Status updated to ${data.status}`,
        sent_at: new Date().toISOString(),
        delivery_status: 'SENT',
        incident: data.incident
      };
      addNotification(notif);
    });

    return () => {
      cleanupSystemAlert();
      cleanupNewIncident();
      cleanupAwaitingVerification();
      cleanupNewAssignment();
      cleanupStatusUpdate();
    };
  }, [isAuthenticated, socket, on, user, addNotification]);

  const markAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.notification_id === id ? { ...n, delivery_status: 'READ' } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, delivery_status: 'READ' })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      markAsRead,
      markAllAsRead,
      refresh: fetchNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
