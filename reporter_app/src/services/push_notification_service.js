/**
 * Push Notification Service for GAOIRS Reporter Mobile App
 *
 * Uses expo-notifications for handling push notifications in Expo/React Native.
 * Registers for push tokens, handles incoming notifications, and manages
 * navigation to relevant screens on notification tap.
 *
 * Usage:
 *   import pushService from '../services/push_notification_service';
 *   
 *   // On app mount or after login:
 *   const token = await pushService.registerForPushNotifications();
 *   // Send token to backend: api.patch('/auth/fcm-token', { fcm_token: token });
 */

import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class PushNotificationService {
  constructor() {
    this._notificationListener = null;
    this._responseListener = null;
    this._navigationRef = null;
  }

  /**
   * Register for push notifications and return the Expo push token.
   * This token is sent to the backend for targeted notifications.
   * 
   * @returns {Promise<string|null>} Expo push token or null if denied/failed
   */
  async registerForPushNotifications() {
    try {
      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('[PushService] Notification permission not granted.');
        return null;
      }

      // Get the push token (Expo push token for Expo managed apps)
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: undefined, // Uses default from app.json
      });
      const token = tokenData.data;
      console.log('[PushService] Push token obtained:', token);

      // Store token locally
      await AsyncStorage.setItem('push_token', token);

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('gaoirs_alerts', {
          name: 'GAOIRS Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF6B35',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });
      }

      return token;
    } catch (error) {
      console.error('[PushService] Registration error:', error);
      return null;
    }
  }

  /**
   * Set navigation reference for handling notification taps.
   * Call this from your main App component after navigation is ready.
   * 
   * @param {object} navigationRef - React Navigation reference
   */
  setNavigationRef(navigationRef) {
    this._navigationRef = navigationRef;
  }

  /**
   * Start listening for incoming notifications and tap responses.
   * Call once when the app mounts.
   * 
   * @param {function} onNotificationReceived - Callback for foreground notifications
   * @param {function} onNotificationTapped - Callback when user taps notification
   */
  startListening(onNotificationReceived = null, onNotificationTapped = null) {
    // Foreground notification listener
    this._notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        const data = notification.request.content.data;
        console.log('[PushService] Notification received in foreground:', data);

        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }
      }
    );

    // Notification response (tap) listener
    this._responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        console.log('[PushService] Notification tapped:', data);

        if (onNotificationTapped) {
          onNotificationTapped(data);
        } else {
          // Default navigation behavior
          this._handleNotificationTap(data);
        }
      }
    );
  }

  /**
   * Stop listening for notifications.
   * Call when the app unmounts or user logs out.
   */
  stopListening() {
    if (this._notificationListener && typeof this._notificationListener.remove === 'function') {
      this._notificationListener.remove();
      this._notificationListener = null;
    }
    if (this._responseListener && typeof this._responseListener.remove === 'function') {
      this._responseListener.remove();
      this._responseListener = null;
    }
  }

  /**
   * Handle default navigation when a notification is tapped.
   * Routes to the relevant screen based on notification type.
   */
  _handleNotificationTap(data) {
    if (!this._navigationRef?.isReady()) return;

    switch (data?.type) {
      case 'DISPATCH':
        // Navigate to incident details
        if (data.incident_id) {
          this._navigationRef.navigate('MyReports', {
            highlightIncident: data.incident_id,
          });
        }
        break;

      case 'STATUS_UPDATE':
        // Navigate to My Reports to see the update
        if (data.incident_id) {
          this._navigationRef.navigate('MyReports', {
            highlightIncident: data.incident_id,
          });
        }
        break;

      default:
        // Navigate to home screen
        this._navigationRef.navigate('ReporterHome');
        break;
    }
  }

  /**
   * Get the stored push token.
   * @returns {Promise<string|null>}
   */
  async getStoredToken() {
    return AsyncStorage.getItem('push_token');
  }

  /**
   * Clear the stored push token (on logout).
   */
  async clearToken() {
    await AsyncStorage.removeItem('push_token');
  }

  /**
   * Get the number of pending notifications (badge count).
   * @returns {Promise<number>}
   */
  async getBadgeCount() {
    return Notifications.getBadgeCountAsync();
  }

  /**
   * Set the badge count.
   * @param {number} count
   */
  async setBadgeCount(count) {
    return Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear all displayed notifications.
   */
  async clearAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
    await this.setBadgeCount(0);
  }
}

export default new PushNotificationService();
