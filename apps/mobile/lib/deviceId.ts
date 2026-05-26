import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = 'qpulse_device_id';

function createId(): string {
  return `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function getDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const id = createId();
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}
