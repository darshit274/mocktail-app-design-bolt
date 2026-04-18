import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@mocktail_device_id';

/** RFC 4122 v4 UUID using Math.random — no extra packages required */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Returns a stable device ID for this app installation.
 * Generated once on first call and persisted in AsyncStorage.
 * Used to enforce single-device login from the mobile app.
 */
export async function getDeviceId(): Promise<string> {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = generateUUID();
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch {
    // If storage fails (unlikely), return a fresh UUID for this session
    return generateUUID();
  }
}
