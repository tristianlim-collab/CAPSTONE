import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import AppNavigator from './src/navigation/AppNavigator';
import pushNotificationService from './src/services/push_notification_service';

export default function App() {
  const navigationRef = useRef(null);

  useEffect(() => {
    // Start listening for push notifications
    pushNotificationService.startListening(
      // Foreground notification received
      (notification) => {
        console.log('[App] Push received in foreground:', notification.request.content.title);
      },
      // Notification tapped — navigate to relevant screen
      (data) => {
        if (navigationRef.current?.isReady()) {
          pushNotificationService.setNavigationRef(navigationRef.current);
          pushNotificationService._handleNotificationTap(data);
        }
      }
    );

    return () => {
      pushNotificationService.stopListening();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SocketProvider>
          <NavigationContainer ref={navigationRef}>
            <StatusBar style="auto" />
            <AppNavigator />
          </NavigationContainer>
        </SocketProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

