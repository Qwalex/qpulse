import AsyncStorage from '@react-native-async-storage/async-storage';

export const NOTIFICATIONS_ENABLED_KEY = 'qpulse_notifications_enabled';
export const PUSH_TOKEN_KEY = 'qpulse_push_token';
export const NOTIFICATIONS_PROMPT_AT_KEY = 'qpulse_notifications_prompt_at';

export const NOTIFICATIONS_PROMPT_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

export async function getNotificationsEnabled(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
  return stored === null ? true : stored === '1';
}

export async function setNotificationsEnabledPreference(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? '1' : '0');
  if (!enabled) {
    await markNotificationsPromptShown();
  }
}

export async function getCachedPushToken(): Promise<string | null> {
  return AsyncStorage.getItem(PUSH_TOKEN_KEY);
}

export async function setCachedPushToken(token: string): Promise<void> {
  await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
}

export async function clearCachedPushToken(): Promise<void> {
  await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
}

export async function getNotificationsPromptShownAt(): Promise<number> {
  const stored = await AsyncStorage.getItem(NOTIFICATIONS_PROMPT_AT_KEY);
  if (!stored) return 0;
  const parsed = Number.parseInt(stored, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function markNotificationsPromptShown(): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATIONS_PROMPT_AT_KEY, String(Date.now()));
}

export async function shouldShowNotificationsPrompt(): Promise<boolean> {
  const enabled = await getNotificationsEnabled();
  if (enabled) return false;
  const lastShownAt = await getNotificationsPromptShownAt();
  return Date.now() - lastShownAt >= NOTIFICATIONS_PROMPT_INTERVAL_MS;
}
