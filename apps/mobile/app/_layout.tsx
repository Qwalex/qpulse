import { useEffect } from 'react';

import { QueryClientProvider } from '@tanstack/react-query';

import { Stack, useRouter } from 'expo-router';

import { StatusBar } from 'expo-status-bar';

import * as Notifications from 'expo-notifications';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { NotificationsEnablePromptModal } from '@/components/NotificationsEnablePromptModal';

import { useSignalRealtime } from '@/hooks/useSignalRealtime';

import {
  subscribePushRegistrationRetry,
  syncPushRegistration,
} from '@/lib/pushRegistration';

import { createAppQueryClient } from '@/lib/query-client';

import { useAppStore } from '@/store/useAppStore';



Notifications.setNotificationHandler({

  handleNotification: async () => ({

    shouldShowAlert: true,

    shouldPlaySound: true,

    shouldSetBadge: false,

    shouldShowBanner: true,

    shouldShowList: true,

  }),

});



const queryClient = createAppQueryClient();



function RealtimeProvider({ children }: { children: React.ReactNode }) {

  useSignalRealtime();

  return <>{children}</>;

}



function ThemeProvider({ children }: { children: React.ReactNode }) {

  const hydrateTheme = useAppStore((s) => s.hydrateTheme);

  const isDarkMode = useAppStore((s) => s.isDarkMode);



  useEffect(() => {

    hydrateTheme();

  }, [hydrateTheme]);



  return (

    <>

      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {children}

    </>

  );

}



function resolveDeepLinkRoute(deepLink: unknown): string | null {

  if (typeof deepLink !== 'string' || !deepLink) return null;

  if (deepLink.startsWith('/')) return deepLink;

  if (deepLink.includes('watch')) return '/(tabs)/watch';
  if (deepLink.includes('results')) return '/results';

  if (deepLink.includes('futures')) return '/(tabs)/futures';

  if (deepLink.includes('spots')) return '/(tabs)/spots';

  return '/(tabs)/spots';

}



export default function RootLayout() {

  const router = useRouter();

  const themeColors = useAppStore((s) => s.colors);
  const hydrateNotifications = useAppStore((s) => s.hydrateNotifications);
  const notificationsHydrated = useAppStore((s) => s.notificationsHydrated);
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);

  useEffect(() => {
    void hydrateNotifications();
  }, [hydrateNotifications]);

  useEffect(() => {
    if (!notificationsHydrated) return;
    void syncPushRegistration();
    return subscribePushRegistrationRetry(() => {
      void syncPushRegistration();
    });
  }, [notificationsHydrated, notificationsEnabled]);



  useEffect(() => {

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {

      const deepLink = response.notification.request.content.data?.deepLink;

      const route = resolveDeepLinkRoute(deepLink);

      if (route) {

        router.push(route as never);

      }

    });



    return () => subscription.remove();

  }, [router]);



  return (

    <AppErrorBoundary screen="root">

      <SafeAreaProvider>

      <QueryClientProvider client={queryClient}>

        <ThemeProvider>

          <RealtimeProvider>

            <NotificationsEnablePromptModal />

            <Stack

              screenOptions={{

                headerStyle: { backgroundColor: themeColors.background },

                headerTintColor: themeColors.text,

                headerTitleStyle: { fontWeight: '600' },

                contentStyle: { backgroundColor: themeColors.background },

              }}

            >

              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

              <Stack.Screen name="results" options={{ title: 'Results' }} />

              <Stack.Screen name="rate-review" options={{ title: 'Rate app' }} />

            </Stack>

          </RealtimeProvider>

        </ThemeProvider>

      </QueryClientProvider>

      </SafeAreaProvider>

    </AppErrorBoundary>

  );

}
