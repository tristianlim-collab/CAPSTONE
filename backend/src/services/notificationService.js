import admin from 'firebase-admin';

let firebaseApp = null;
let messaging = null;

/**
 * Initialize Firebase Admin SDK using environment variables.
 * If credentials are missing, push notifications will be disabled gracefully.
 */
const initFirebase = () => {
  if (firebaseApp) return; // Already initialized

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    console.warn('[NotificationService] Firebase credentials not configured — push notifications disabled.');
    console.warn('[NotificationService] Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL in .env');
    return;
  }

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        // The private key comes from env as a string with escaped newlines
        privateKey: privateKey.replace(/\\n/g, '\n'),
        clientEmail,
      }),
    });
    messaging = admin.messaging();
    console.log('[NotificationService] Firebase Admin SDK initialized successfully.');
  } catch (err) {
    console.error('[NotificationService] Firebase init failed:', err.message);
  }
};

// Initialize on module load
initFirebase();

class NotificationService {
  /**
   * Check if Firebase push is available
   */
  isAvailable() {
    return !!messaging;
  }

  /**
   * Send push notification to a single device via FCM token.
   * @param {string} fcmToken - The device's FCM registration token
   * @param {object} payload - { title, body, data }
   * @returns {Promise<string|null>} messageId or null on failure
   */
  async sendToDevice(fcmToken, { title, body, data = {} }) {
    if (!messaging) {
      console.warn('[NotificationService] Push skipped — Firebase not initialized.');
      return null;
    }

    if (!fcmToken) {
      console.warn('[NotificationService] Push skipped — no FCM token provided.');
      return null;
    }

    try {
      const message = {
        token: fcmToken,
        notification: {
          title,
          body,
        },
        data: this._stringifyData(data),
        android: {
          priority: 'high',
          notification: {
            channelId: 'gaoirs_alerts',
            sound: 'default',
            priority: 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              alert: { title, body },
              sound: 'default',
              badge: 1,
            },
          },
        },
        webpush: {
          notification: {
            title,
            body,
            icon: '/icons/gaoirs-icon-192.png',
            badge: '/icons/gaoirs-badge-72.png',
            requireInteraction: true,
          },
        },
      };

      const messageId = await messaging.send(message);
      console.log(`[NotificationService] Push sent: ${messageId}`);
      return messageId;
    } catch (err) {
      // Handle invalid/expired tokens
      if (
        err.code === 'messaging/invalid-registration-token' ||
        err.code === 'messaging/registration-token-not-registered'
      ) {
        console.warn(`[NotificationService] Invalid FCM token — should be removed from DB.`);
        return { error: 'INVALID_TOKEN', token: fcmToken };
      }
      console.error('[NotificationService] Push send error:', err.message);
      return null;
    }
  }

  /**
   * Send push notification to multiple devices.
   * @param {string[]} fcmTokens - Array of FCM tokens
   * @param {object} payload - { title, body, data }
   * @returns {Promise<object>} { successCount, failureCount, invalidTokens }
   */
  async sendToMultipleDevices(fcmTokens, { title, body, data = {} }) {
    if (!messaging) {
      console.warn('[NotificationService] Push skipped — Firebase not initialized.');
      return { successCount: 0, failureCount: 0, invalidTokens: [] };
    }

    const validTokens = fcmTokens.filter(Boolean);
    if (validTokens.length === 0) {
      return { successCount: 0, failureCount: 0, invalidTokens: [] };
    }

    const message = {
      notification: { title, body },
      data: this._stringifyData(data),
      android: {
        priority: 'high',
        notification: {
          channelId: 'gaoirs_alerts',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: { sound: 'default', badge: 1 },
        },
      },
    };

    try {
      const response = await messaging.sendEachForMulticast({
        tokens: validTokens,
        ...message,
      });

      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errCode = resp.error?.code;
          if (
            errCode === 'messaging/invalid-registration-token' ||
            errCode === 'messaging/registration-token-not-registered'
          ) {
            invalidTokens.push(validTokens[idx]);
          }
        }
      });

      console.log(
        `[NotificationService] Multicast: ${response.successCount} sent, ${response.failureCount} failed, ${invalidTokens.length} invalid tokens`
      );

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        invalidTokens,
      };
    } catch (err) {
      console.error('[NotificationService] Multicast error:', err.message);
      return { successCount: 0, failureCount: validTokens.length, invalidTokens: [] };
    }
  }

  /**
   * Send notification for a new incident dispatch.
   * @param {object} incident - The incident object
   * @param {object} unit - The response unit object
   * @param {string} fcmToken - Responder's FCM token
   */
  async notifyDispatch(incident, unit, fcmToken) {
    return this.sendToDevice(fcmToken, {
      title: `🚨 DISPATCH: ${incident.incident_code}`,
      body: `${incident.incident_type?.name || 'Incident'} reported. Severity: ${incident.severity}. Respond immediately.`,
      data: {
        type: 'DISPATCH',
        incident_id: incident.incident_id,
        incident_code: incident.incident_code,
        latitude: String(incident.latitude),
        longitude: String(incident.longitude),
      },
    });
  }

  /**
   * Send notification for incident status change to the reporter.
   * @param {object} incident - The incident object
   * @param {string} newStatus - New status string
   * @param {string} fcmToken - Reporter's FCM token
   */
  async notifyStatusChange(incident, newStatus, fcmToken) {
    const statusMessages = {
      VERIFIED: 'Your incident report has been verified by an admin.',
      RESPONDING: 'A response unit is now heading to the location.',
      ON_SCENE: 'Response unit has arrived on scene.',
      RESOLVED: 'The incident has been resolved. Thank you for reporting.',
      CLOSED: 'The incident has been closed.',
      FALSE_ALARM: 'The report has been marked as a false alarm.',
    };

    return this.sendToDevice(fcmToken, {
      title: `📋 ${incident.incident_code} — ${newStatus}`,
      body: statusMessages[newStatus] || `Incident status updated to ${newStatus}.`,
      data: {
        type: 'STATUS_UPDATE',
        incident_id: incident.incident_id,
        incident_code: incident.incident_code,
        status: newStatus,
      },
    });
  }

  /**
   * Ensure all data values are strings (Firebase requirement).
   */
  _stringifyData(data) {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = String(value ?? '');
    }
    return result;
  }
}

export default new NotificationService();
