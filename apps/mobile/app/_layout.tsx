import { useEffect } from 'react';

import { Platform } from 'react-native';

import { QueryClientProvider } from '@tanstack/react-query';

import { Stack, useRouter } from 'expo-router';

import { StatusBar } from 'expo-status-bar';

import * as Notifications from 'expo-notifications';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppErrorBoundary } from '@/components/AppErrorBoundary';

import { useSignalRealtime } from '@/hooks/useSignalRealtime';

import { registerDevice } from '@/lib/api';

import { getDeviceId } from '@/lib/deviceId';

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



async function ensureNotificationChannels() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('price_alerts', {
      name: 'Price Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
    });
  }
}



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



async function registerForPushNotifications() {

  const { status: existing } = await Notifications.getPermissionsAsync();

  let finalStatus = existing;

  if (existing !== 'granted') {

    const { status } = await Notifications.requestPermissionsAsync();

    finalStatus = status;

  }

  if (finalStatus !== 'granted') return;



  const deviceId = await getDeviceId();

  const tokenData = await Notifications.getExpoPushTokenAsync();

  await registerDevice({

    pushToken: tokenData.data,

    platform: Platform.OS,

    deviceId,

  });

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



  useEffect(() => {

    void ensureNotificationChannels();

    registerForPushNotifications().catch(() => undefined);

  }, []);



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
