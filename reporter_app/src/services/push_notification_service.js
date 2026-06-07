/**
 * Push Notification Service for GAOIRS Reporter Mobile App (DISABLED)
 *
 * This service has been disabled per user request.
 * All methods are now stubs to prevent application crashes.
 */

class PushNotificationService {
  constructor() {
    this._notificationListener = null;
    this._responseListener = null;
    this._navigationRef = null;
    console.log('[PushService] Notifications are disabled.');
  }

  async registerForPushNotifications() {
    // Disabled
    return null;
  }

  setNavigationRef(navigationRef) {
    this._navigationRef = navigationRef;
  }

  startListening(onNotificationReceived = null, onNotificationTapped = null) {
    // Disabled
    console.log('[PushService] Listening is disabled.');
  }

  stopListening() {
    // Disabled
  }

  _handleNotificationTap(data) {
    // Disabled
  }

  async getStoredToken() {
    return null;
  }

  async clearToken() {
    // Disabled
  }

  async getBadgeCount() {
    return 0;
  }

  async setBadgeCount(count) {
    // Disabled
  }

  async clearAllNotifications() {
    // Disabled
  }
}

export default new PushNotificationService();
