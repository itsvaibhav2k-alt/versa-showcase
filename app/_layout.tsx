import '../global.css';

import * as Sentry from '@sentry/react-native';
import { cssInterop } from 'nativewind';
import { BlurView } from 'expo-blur';

cssInterop(BlurView, { className: 'style' });

import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';
import { useFonts } from 'expo-font';
import { Stack, Redirect, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/src/components/ui/toast-config';

import { useColorScheme } from '@/components/useColorScheme';
import { queryClient } from '@/src/lib/query-client';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/hooks/use-auth';
import { usePushNotifications } from '@/src/hooks/use-push-notifications';
import { useAuthStore } from '@/src/stores/auth-store';
import { authService } from '@/src/services/auth.service';
import { OfflineBanner } from '@/src/components/ui/offline-banner';
import { ErrorBoundary as AppErrorBoundary } from '@/src/components/ui/error-boundary';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Initialize Sentry for crash reporting and performance monitoring
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.2,
    profilesSampleRate: 0.1,
    environment: __DEV__ ? 'development' : 'production',
    enabled: !__DEV__,
  });
}

SplashScreen.preventAutoHideAsync();

function RootLayoutInner() {
  const [loaded, error] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    authService.initializeAuth();

    let subscription: { unsubscribe: () => void } | undefined;
    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          const store = useAuthStore.getState();
          store.setSession(session);

          if (session?.user) {
            try {
              const user = await authService.fetchUserProfile(session.user.id);
              store.setUser(user);
              if (user?.organization_id) {
                const org = await authService.fetchOrganization(user.organization_id);
                store.setOrganization(org);
              }
            } catch {
              store.reset();
            }
          } else {
            store.reset();
          }
        },
      );
      subscription = data.subscription;
    } catch {
      // Supabase unreachable — auth state listener will be set up on reconnect
    }

    return () => subscription?.unsubscribe();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AppErrorBoundary>
          <RootLayoutNav />
        </AppErrorBoundary>
        <Toast config={toastConfig} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading, isInitialized } = useAuth();
  const segments = useSegments();
  usePushNotifications();

  if (!isInitialized || isLoading) {
    return null;
  }

  const inAuthGroup = segments[0] === '(auth)';

  return (
    <ThemeProvider value={DefaultTheme}>
      <OfflineBanner />
      {!isAuthenticated && !inAuthGroup && <Redirect href="/(auth)/sign-in" />}
      {isAuthenticated && inAuthGroup && <Redirect href="/(tabs)" />}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen
          name="(modals)"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen name="task" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

// Wrap with Sentry for crash reporting
export default Sentry.wrap(RootLayoutInner);
