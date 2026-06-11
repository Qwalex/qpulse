import { AppState, Platform, type AppStateStatus } from 'react-native';

import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

import { ClientErrorKind } from '@qpulse/shared';

import { registerDevice, unregisterDevice } from '@/lib/api';
import { reportClientError } from '@/lib/client-error-report';
import { getDeviceId } from '@/lib/deviceId';
import {
  clearCachedPushToken,
  getCachedPushToken,
  getNotificationsEnabled,
  setCachedPushToken,
} from '@/lib/notificationPreferences';

const REGISTER_PATH = '/devices/register';

function resolveEasProjectId(): string | undefined {
  const fromExtra = Constants.expoConfig?.extra?.eas?.projectId;
  if (typeof fromExtra === 'string' && fromExtra.length > 0) {
    return fromExtra;
  }
  const fromEas = Constants.easConfig?.projectId;
  if (typeof fromEas === 'string' && fromEas.length > 0) {
    return fromEas;
  }
  return undefined;
}

async function reportPushRegistrationError(message: string, stack?: string): Promise<void> {
  if (__DEV__) {
    console.warn('[pushRegistration]', message);
  }
  await reportClientError({
    kind: ClientErrorKind.MUTATION,
    message: `Push registration: ${message}`,
    stack,
    screen: 'root',
    apiPath: REGISTER_PATH,
  });
}

export async function ensureNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  const channels: Array<{
    id: string;
    name: string;
    importance: Notifications.AndroidImportance;
  }> = [
    { id: 'signals_new', name: 'New signals', importance: Notifications.AndroidImportance.HIGH },
    { id: 'signals_tp', name: 'Take profit', importance: Notifications.AndroidImportance.HIGH },
    { id: 'signals_sl', name: 'Stop loss', importance: Notifications.AndroidImportance.HIGH },
    {
      id: 'signals_liquidation',
      name: 'Liquidation',
      importance: Notifications.AndroidImportance.HIGH,
    },
    {
      id: 'signals_updates',
      name: 'Signal updates',
      importance: Notifications.AndroidImportance.DEFAULT,
    },
    { id: 'price_alerts', name: 'Price alerts', importance: Notifications.AndroidImportance.HIGH },
  ];

  await Promise.all(
    channels.map((channel) =>
      Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        importance: channel.importance,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
      }),
    ),
  );
}

export async function unregisterPushNotifications(): Promise<void> {
  const token = await getCachedPushToken();
  if (!token) return;

  try {
    await unregisterDevice(token);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (__DEV__) {
      console.warn('[pushRegistration] unregister failed', message);
    }
  } finally {
    await clearCachedPushToken();
  }
}

export async function syncPushRegistration(): Promise<boolean> {
  const enabled = await getNotificationsEnabled();
  if (!enabled) {
    await unregisterPushNotifications();
    return false;
  }
  return registerForPushNotifications();
}

export async function registerForPushNotifications(): Promise<boolean> {
  try {
    await ensureNotificationChannels();

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      await reportPushRegistrationError('notification permission not granted');
      return false;
    }

    const projectId = resolveEasProjectId();
    if (!projectId) {
      await reportPushRegistrationError('missing EAS projectId (extra.eas.projectId in app.json)');
      return false;
    }

    const deviceId = await getDeviceId();
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

    if (!tokenData.data?.startsWith('ExponentPushToken[')) {
      await reportPushRegistrationError(`unexpected push token format: ${tokenData.data ?? 'empty'}`);
      return false;
    }

    await registerDevice({
      pushToken: tokenData.data,
      platform: Platform.OS,
      deviceId,
    });
    await setCachedPushToken(tokenData.data);

    if (__DEV__) {
      console.info('[pushRegistration] registered', { deviceId, platform: Platform.OS });
    }
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    await reportPushRegistrationError(message, stack);
    return false;
  }
}

export function subscribePushRegistrationRetry(onRegister: () => void): () => void {
  let lastAttemptAt = 0;
  const MIN_RETRY_MS = 30_000;

  const maybeRegister = (): void => {
    const now = Date.now();
    if (now - lastAttemptAt < MIN_RETRY_MS) return;
    lastAttemptAt = now;
    onRegister();
  };

  const onAppStateChange = (state: AppStateStatus): void => {
    if (state === 'active') {
      maybeRegister();
    }
  };

  const subscription = AppState.addEventListener('change', onAppStateChange);
  return () => subscription.remove();
}
