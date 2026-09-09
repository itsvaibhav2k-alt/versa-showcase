import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import type { EventSubscription } from 'expo-modules-core';
import { router } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/hooks/use-auth';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const { userId, isAuthenticated } = useAuth();
  const notificationListener = useRef<EventSubscription | null>(null);
  const responseListener = useRef<EventSubscription | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    registerForPushNotifications().then(async (token) => {
      if (token) {
        setExpoPushToken(token);
        try {
          const { error } = await supabase
            .from('users')
            .update({ expo_push_token: token })
            .eq('id', userId);
          if (error) {
            console.error('[PushNotifications] Failed to save push token:', error);
          }
        } catch (err) {
          console.error('[PushNotifications] Failed to save push token:', err);
        }
      }
    });

    // Listen for incoming notifications (foreground)
    notificationListener.current =
      Notifications.addNotificationReceivedListener(() => {
        // Notification received in foreground — handled by system banner
      });

    // Listen for notification interactions (tap)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.action_url && typeof data.action_url === 'string' && data.action_url.startsWith('/')) {
          try {
            router.push(data.action_url as any);
          } catch (error) {
            console.warn('[PushNotifications] Failed to navigate to:', data.action_url, error);
          }
        }
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isAuthenticated, userId]);

  return { expoPushToken };
}

async function registerForPushNotifications(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return null;

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
    return tokenData.data;
  } catch (error) {
    console.warn('Push notification registration failed:', error);
    return null;
  }
}
