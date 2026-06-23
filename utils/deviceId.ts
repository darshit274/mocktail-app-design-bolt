import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';

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
 * Android: uses Application.androidId — hardware-bound, never changes.
 * iOS: uses Keychain via expo-secure-store — Keychain persists after uninstall.
 *   Migration: if an old UUID exists in AsyncStorage (pre-Keychain era) it is
 *   moved to Keychain on first call, so existing users keep their ID.
 * Web/other: falls back to AsyncStorage UUID.
 */
export async function getDeviceId(): Promise<string> {
  // Android — androidId is tied to the app signing key + hardware, survives reinstall
  if (Platform.OS === 'android') {
    const androidId = Application.androidId;
    if (androidId) return androidId;
  }

  // iOS — Keychain survives app deletion; migrate legacy AsyncStorage UUID if present
  if (Platform.OS === 'ios') {
    try {
      let keychainId = await SecureStore.getItemAsync(KEYCHAIN_KEY);
      if (!keychainId) {
        // Migrate: carry over any UUID already registered on the backend
        const legacyId = await AsyncStorage.getItem(ASYNC_KEY);
        keychainId = legacyId || generateUUID();
        await SecureStore.setItemAsync(KEYCHAIN_KEY, keychainId);
      }
      return keychainId;
    } catch {
      // SecureStore unavailable (simulator edge case) — fall through
    }
  }

  // Fallback for web / dev environments
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
