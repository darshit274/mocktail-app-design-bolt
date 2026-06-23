import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const ASYNC_KEY = '@mocktail_device_id';
const KEYCHAIN_KEY = 'mocktail_device_id';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Returns a stable device ID that survives app uninstall/reinstall.
 *
 * Android: uses Application.androidId — hardware-bound, never changes across reinstalls.
 *   If androidId is unavailable (rare edge case), falls back to AsyncStorage UUID.
 *
 * iOS: stores UUID in Keychain via expo-secure-store — Keychain persists after uninstall.
 *   Migration-safe: if an old UUID exists in AsyncStorage, it is moved to Keychain on
 *   first call so existing users keep their registered device ID.
 *
 * Web/other: falls back to AsyncStorage UUID.
 */
export async function getDeviceId(): Promise<string> {
  // Android — androidId is tied to app signing key + hardware, survives reinstall
  if (Platform.OS === 'android') {
    try {
      const { default: Application } = await import('expo-application');
      const androidId: string | null = Application.androidId;
      if (androidId) return androidId;
    } catch {
      // expo-application not available in this build — fall through
    }
  }

  // iOS — Keychain survives app deletion
  if (Platform.OS === 'ios') {
    try {
      const SecureStore = await import('expo-secure-store');
      let keychainId = await SecureStore.getItemAsync(KEYCHAIN_KEY);
      if (!keychainId) {
        // Migrate: carry over any UUID already registered on the backend so the
        // student is not locked out after the first reinstall on a new build.
        const legacyId = await AsyncStorage.getItem(ASYNC_KEY);
        keychainId = legacyId || generateUUID();
        await SecureStore.setItemAsync(KEYCHAIN_KEY, keychainId);
      }
      return keychainId;
    } catch {
      // SecureStore unavailable — fall through to AsyncStorage
    }
  }

  // Fallback for web, dev, or when platform-native storage is unavailable
  try {
    let id = await AsyncStorage.getItem(ASYNC_KEY);
    if (!id) {
      id = generateUUID();
      await AsyncStorage.setItem(ASYNC_KEY, id);
    }
    return id;
  } catch {
    return generateUUID();
  }
}
