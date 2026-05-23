/**
 * Push Notification Utility for GAOIRS Web Frontend
 * 
 * Handles browser push notification permission requests and
 * Firebase Cloud Messaging token registration.
 * 
 * Usage:
 *   import { requestNotificationPermission, showBrowserNotification } from '../utils/pushNotifications';
 *   
 *   // On login or app load:
 *   const token = await requestNotificationPermission();
 *   if (token) await api.patch('/auth/fcm-token', { fcm_token: token });
 */

/**
 * Request browser notification permission and get FCM token.
 * Returns the FCM token if permission is granted, null otherwise.
 * 
 * NOTE: For full FCM support in the browser, you'd need to set up
 * Firebase JS SDK with a service worker. This utility provides
 * browser-native notifications as a simpler alternative for the web dashboard.
 */
export const requestNotificationPermission = async () => {
  // Check if notifications are supported
  if (!('Notification' in window)) {
    console.warn('[Push] Browser does not support notifications.');
    return null;
  }

  // Already granted
  if (Notification.permission === 'granted') {
    console.log('[Push] Notification permission already granted.');
    return 'browser-native'; // Web uses browser-native notifications via Socket.io
  }

  // Already denied
  if (Notification.permission === 'denied') {
    console.warn('[Push] Notification permission was denied by user.');
    return null;
  }

  // Request permission
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('[Push] Notification permission granted.');
      return 'browser-native';
    }
    console.warn('[Push] Notification permission denied by user.');
    return null;
  } catch (err) {
    console.error('[Push] Error requesting notification permission:', err);
    return null;
  }
};

/**
 * Show a browser notification.
 * Used by the Socket.io event handlers to display real-time alerts.
 * 
 * @param {string} title - Notification title
 * @param {object} options - Notification options { body, icon, tag, data }
 * @param {function} onClick - Optional callback when notification is clicked
 */
export const showBrowserNotification = (title, options = {}, onClick = null) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return null;
  }

  const notification = new Notification(title, {
    icon: options.icon || '/icons/gaoirs-icon-192.png',
    badge: options.badge || '/icons/gaoirs-badge-72.png',
    body: options.body || '',
    tag: options.tag || `gaoirs-${Date.now()}`,
    requireInteraction: options.requireInteraction ?? true,
    data: options.data || {},
    silent: false,
  });

  if (onClick) {
    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      onClick(notification.data || options.data);
      notification.close();
    };
  }

  // Auto-close after 15 seconds if not interacted
  setTimeout(() => notification.close(), 15000);

  return notification;
};

/**
 * Setup socket-based push notification listener.
 * Call this once when the app mounts and socket is connected.
 * 
 * @param {object} socket - Socket.io client instance
 * @param {function} navigate - React Router navigate function (optional)
 */
export const setupSocketNotifications = (socket, navigate = null) => {
  if (!socket) return;

  // Listen for dispatch alerts (for response units)
  socket.on('dispatch_alert', (data) => {
    showBrowserNotification(
      `🚨 DISPATCH: ${data.incident?.incident_code || 'New Incident'}`,
      {
        body: `${data.incident?.description || 'A new incident has been dispatched to your unit.'}`,
        tag: `dispatch-${data.incident?.incident_id}`,
        data: { type: 'DISPATCH', incident_id: data.incident?.incident_id },
      },
      (notifData) => {
        if (navigate && notifData?.incident_id) {
          navigate(`/response/incidents/${notifData.incident_id}`);
        }
      }
    );
  });

  // Listen for status updates (for reporters)
  socket.on('incident_status_update', (data) => {
    showBrowserNotification(
      `📋 ${data.incident_code || 'Incident'} — ${data.status}`,
      {
        body: `Incident status updated to ${data.status}.`,
        tag: `status-${data.incident_id}`,
        data: { type: 'STATUS_UPDATE', incident_id: data.incident_id },
      },
      (notifData) => {
        if (navigate && notifData?.incident_id) {
          navigate(`/incidents/${notifData.incident_id}`);
        }
      }
    );
  });

  // Listen for system alerts (for admins)
  socket.on('system_alert', (data) => {
    showBrowserNotification(
      '🔔 GAOIRS System Alert',
      {
        body: data.message || 'New system notification',
        tag: `system-${Date.now()}`,
      }
    );
  });
};

export default {
  requestNotificationPermission,
  showBrowserNotification,
  setupSocketNotifications,
};
