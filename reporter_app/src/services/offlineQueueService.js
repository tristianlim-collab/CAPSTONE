import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { incidentAPI, SOCKET_URL } from '../api';

const OFFLINE_QUEUE_KEY = 'OFFLINE_PENDING_REPORTS_QUEUE';

const isOnline = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${SOCKET_URL}/api/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
};

export const OfflineQueueService = {
  // Get all pending reports in queue
  getQueue: async () => {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading offline queue:', e);
      return [];
    }
  },

  // Save report payload to local offline queue
  saveToQueue: async (reportData) => {
    try {
      const queue = await OfflineQueueService.getQueue();
      const newItem = {
        id: `OFFLINE-${Date.now()}`,
        status: 'PENDING_SYNC',
        timestamp: new Date().toISOString(),
        ...reportData
      };
      queue.push(newItem);
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      return newItem;
    } catch (e) {
      console.error('Error saving to offline queue:', e);
      throw e;
    }
  },

  // Sync queued reports to backend when connection is restored
  syncQueue: async () => {
    try {
      const online = await isOnline();
      if (!online) return;

      const queue = await OfflineQueueService.getQueue();
      if (queue.length === 0) return;

      const remainingQueue = [];

      for (const item of queue) {
        try {
          const incRes = await incidentAPI.create({
            incident_type_id: item.incident_type_id,
            description: item.description,
            latitude: item.latitude,
            longitude: item.longitude,
            map_pin_address: item.map_pin_address,
            landmark: item.landmark,
            severity: item.severity,
            reporter_name: item.reporter_name,
            reporter_phone: item.reporter_phone,
          });

          const incidentId = incRes.data?.incident_id;

          if (incidentId) {
            try {
              const stored = await AsyncStorage.getItem('my_report_ids');
              const ids = stored ? JSON.parse(stored) : [];
              if (!ids.includes(incidentId)) {
                await AsyncStorage.setItem('my_report_ids', JSON.stringify([incidentId, ...ids]));
              }
            } catch (e) {
              console.error('Failed saving synced incident id locally:', e);
            }
          }

          if (incidentId && item.photos && item.photos.length > 0) {
            for (const photo of item.photos) {
              try {
                const formData = new FormData();
                formData.append('file', {
                  uri: photo.uri,
                  type: 'image/jpeg',
                  name: `evidence_${Date.now()}.jpg`,
                });
                formData.append('incident_id', incidentId);

                await api.post('/evidence', formData, {
                  headers: { 'Content-Type': 'multipart/form-data' },
                });
              } catch (photoErr) {
                console.error('Offline photo sync failed:', photoErr);
              }
            }
          }
        } catch (syncErr) {
          console.error('Failed to sync report item:', item.id, syncErr);
          // Keep item in queue to retry next time if server error
          remainingQueue.push(item);
        }
      }

      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
    } catch (e) {
      console.error('Error executing queue sync:', e);
    }
  }
};
