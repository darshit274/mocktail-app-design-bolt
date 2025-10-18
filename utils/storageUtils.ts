/**
 * Storage Utilities
 *
 * Utility functions for AsyncStorage operations with error handling.
 * Provides type-safe wrappers for common storage operations.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from './logger';
import { STORAGE_KEYS } from './appConstants';

const storageLogger = logger.createLogger('Storage');

/**
 * Storage result type
 */
export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Set item in storage
 * @param key - Storage key
 * @param value - Value to store (will be JSON stringified)
 * @returns Storage result
 */
export const setItem = async <T>(key: string, value: T): Promise<StorageResult<void>> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    storageLogger.debug(`Stored item: ${key}`);
    return { success: true };
  } catch (error) {
    storageLogger.error(`Failed to store item: ${key}`, error);
    return { success: false, error: 'Failed to save data' };
  }
};

/**
 * Get item from storage
 * @param key - Storage key
 * @returns Storage result with data
 */
export const getItem = async <T>(key: string): Promise<StorageResult<T>> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    if (jsonValue === null) {
      return { success: true, data: undefined };
    }
    const data = JSON.parse(jsonValue) as T;
    storageLogger.debug(`Retrieved item: ${key}`);
    return { success: true, data };
  } catch (error) {
    storageLogger.error(`Failed to retrieve item: ${key}`, error);
    return { success: false, error: 'Failed to load data' };
  }
};

/**
 * Remove item from storage
 * @param key - Storage key
 * @returns Storage result
 */
export const removeItem = async (key: string): Promise<StorageResult<void>> => {
  try {
    await AsyncStorage.removeItem(key);
    storageLogger.debug(`Removed item: ${key}`);
    return { success: true };
  } catch (error) {
    storageLogger.error(`Failed to remove item: ${key}`, error);
    return { success: false, error: 'Failed to remove data' };
  }
};

/**
 * Clear all storage
 * @returns Storage result
 */
export const clearAll = async (): Promise<StorageResult<void>> => {
  try {
    await AsyncStorage.clear();
    storageLogger.info('Cleared all storage');
    return { success: true };
  } catch (error) {
    storageLogger.error('Failed to clear storage', error);
    return { success: false, error: 'Failed to clear data' };
  }
};

/**
 * Get multiple items from storage
 * @param keys - Array of storage keys
 * @returns Storage result with data object
 */
export const getMultipleItems = async <T extends Record<string, any>>(
  keys: string[]
): Promise<StorageResult<T>> => {
  try {
    const pairs = await AsyncStorage.multiGet(keys);
    const data = pairs.reduce((acc, [key, value]) => {
      if (value !== null) {
        try {
          acc[key] = JSON.parse(value);
        } catch {
          acc[key] = value;
        }
      }
      return acc;
    }, {} as any);
    storageLogger.debug(`Retrieved ${keys.length} items`);
    return { success: true, data: data as T };
  } catch (error) {
    storageLogger.error('Failed to retrieve multiple items', error);
    return { success: false, error: 'Failed to load data' };
  }
};

/**
 * Set multiple items in storage
 * @param items - Object with key-value pairs to store
 * @returns Storage result
 */
export const setMultipleItems = async (items: Record<string, any>): Promise<StorageResult<void>> => {
  try {
    const pairs = Object.entries(items).map(([key, value]) => [key, JSON.stringify(value)]);
    await AsyncStorage.multiSet(pairs as [string, string][]);
    storageLogger.debug(`Stored ${pairs.length} items`);
    return { success: true };
  } catch (error) {
    storageLogger.error('Failed to store multiple items', error);
    return { success: false, error: 'Failed to save data' };
  }
};

/**
 * Remove multiple items from storage
 * @param keys - Array of storage keys to remove
 * @returns Storage result
 */
export const removeMultipleItems = async (keys: string[]): Promise<StorageResult<void>> => {
  try {
    await AsyncStorage.multiRemove(keys);
    storageLogger.debug(`Removed ${keys.length} items`);
    return { success: true };
  } catch (error) {
    storageLogger.error('Failed to remove multiple items', error);
    return { success: false, error: 'Failed to remove data' };
  }
};

/**
 * Get all storage keys
 * @returns Storage result with array of keys
 */
export const getAllKeys = async (): Promise<StorageResult<string[]>> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    storageLogger.debug(`Found ${keys.length} storage keys`);
    return { success: true, data: keys };
  } catch (error) {
    storageLogger.error('Failed to get all keys', error);
    return { success: false, error: 'Failed to retrieve keys' };
  }
};

/**
 * Check if key exists in storage
 * @param key - Storage key
 * @returns True if key exists
 */
export const hasItem = async (key: string): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value !== null;
  } catch (error) {
    storageLogger.error(`Failed to check if item exists: ${key}`, error);
    return false;
  }
};

/**
 * Merge item with existing data (for objects)
 * @param key - Storage key
 * @param value - Value to merge
 * @returns Storage result
 */
export const mergeItem = async <T extends Record<string, any>>(
  key: string,
  value: Partial<T>
): Promise<StorageResult<void>> => {
  try {
    await AsyncStorage.mergeItem(key, JSON.stringify(value));
    storageLogger.debug(`Merged item: ${key}`);
    return { success: true };
  } catch (error) {
    storageLogger.error(`Failed to merge item: ${key}`, error);
    return { success: false, error: 'Failed to merge data' };
  }
};

// ==================== APP-SPECIFIC STORAGE FUNCTIONS ====================

/**
 * Store authentication token
 * @param token - JWT token
 * @returns Storage result
 */
export const storeAuthToken = async (token: string): Promise<StorageResult<void>> => {
  return setItem(STORAGE_KEYS.AUTH_TOKEN, token);
};

/**
 * Get authentication token
 * @returns Storage result with token
 */
export const getAuthToken = async (): Promise<StorageResult<string>> => {
  return getItem<string>(STORAGE_KEYS.AUTH_TOKEN);
};

/**
 * Remove authentication token
 * @returns Storage result
 */
export const removeAuthToken = async (): Promise<StorageResult<void>> => {
  return removeItem(STORAGE_KEYS.AUTH_TOKEN);
};

/**
 * Store user data
 * @param user - User data object
 * @returns Storage result
 */
export const storeUser = async (user: any): Promise<StorageResult<void>> => {
  return setItem(STORAGE_KEYS.USER_DATA, user);
};

/**
 * Get user data
 * @returns Storage result with user data
 */
export const getUser = async <T>(): Promise<StorageResult<T>> => {
  return getItem<T>(STORAGE_KEYS.USER_DATA);
};

/**
 * Remove user data
 * @returns Storage result
 */
export const removeUser = async (): Promise<StorageResult<void>> => {
  return removeItem(STORAGE_KEYS.USER_DATA);
};

/**
 * Store theme preference
 * @param theme - Theme value ('light', 'dark', etc.)
 * @returns Storage result
 */
export const storeTheme = async (theme: string): Promise<StorageResult<void>> => {
  return setItem(STORAGE_KEYS.THEME, theme);
};

/**
 * Get theme preference
 * @returns Storage result with theme
 */
export const getTheme = async (): Promise<StorageResult<string>> => {
  return getItem<string>(STORAGE_KEYS.THEME);
};

/**
 * Store language preference
 * @param language - Language code ('en', 'gu', etc.)
 * @returns Storage result
 */
export const storeLanguage = async (language: string): Promise<StorageResult<void>> => {
  return setItem(STORAGE_KEYS.LANGUAGE, language);
};

/**
 * Get language preference
 * @returns Storage result with language
 */
export const getLanguage = async (): Promise<StorageResult<string>> => {
  return getItem<string>(STORAGE_KEYS.LANGUAGE);
};

/**
 * Store onboarding completion status
 * @param completed - Onboarding completion status
 * @returns Storage result
 */
export const storeOnboardingCompleted = async (completed: boolean): Promise<StorageResult<void>> => {
  return setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, completed);
};

/**
 * Get onboarding completion status
 * @returns Storage result with status
 */
export const getOnboardingCompleted = async (): Promise<StorageResult<boolean>> => {
  return getItem<boolean>(STORAGE_KEYS.ONBOARDING_COMPLETED);
};

/**
 * Clear all authentication data (token, user)
 * @returns Storage result
 */
export const clearAuthData = async (): Promise<StorageResult<void>> => {
  try {
    await removeMultipleItems([STORAGE_KEYS.AUTH_TOKEN, STORAGE_KEYS.USER_DATA]);
    storageLogger.info('Cleared authentication data');
    return { success: true };
  } catch (error) {
    storageLogger.error('Failed to clear auth data', error);
    return { success: false, error: 'Failed to clear authentication data' };
  }
};

/**
 * Store data with expiration
 * @param key - Storage key
 * @param value - Value to store
 * @param expirationMinutes - Expiration time in minutes
 * @returns Storage result
 */
export const setItemWithExpiration = async <T>(
  key: string,
  value: T,
  expirationMinutes: number
): Promise<StorageResult<void>> => {
  try {
    const now = new Date();
    const item = {
      value,
      expiry: now.getTime() + expirationMinutes * 60 * 1000,
    };
    return setItem(key, item);
  } catch (error) {
    storageLogger.error(`Failed to store item with expiration: ${key}`, error);
    return { success: false, error: 'Failed to save data' };
  }
};

/**
 * Get data with expiration check
 * @param key - Storage key
 * @returns Storage result with data (undefined if expired)
 */
export const getItemWithExpiration = async <T>(key: string): Promise<StorageResult<T>> => {
  try {
    const result = await getItem<{ value: T; expiry: number }>(key);
    if (!result.success || !result.data) {
      return { success: true, data: undefined };
    }

    const now = new Date();
    if (now.getTime() > result.data.expiry) {
      // Expired, remove it
      await removeItem(key);
      storageLogger.debug(`Item expired and removed: ${key}`);
      return { success: true, data: undefined };
    }

    return { success: true, data: result.data.value };
  } catch (error) {
    storageLogger.error(`Failed to retrieve item with expiration: ${key}`, error);
    return { success: false, error: 'Failed to load data' };
  }
};

/**
 * Get storage size (estimate)
 * @returns Storage result with size info
 */
export const getStorageSize = async (): Promise<StorageResult<{ keys: number; estimatedSize: string }>> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const pairs = await AsyncStorage.multiGet(keys);

    let totalSize = 0;
    pairs.forEach(([key, value]) => {
      totalSize += key.length + (value?.length || 0);
    });

    // Rough estimate in KB
    const estimatedSize = `${(totalSize / 1024).toFixed(2)} KB`;

    storageLogger.debug(`Storage size: ${estimatedSize} (${keys.length} keys)`);
    return {
      success: true,
      data: { keys: keys.length, estimatedSize },
    };
  } catch (error) {
    storageLogger.error('Failed to get storage size', error);
    return { success: false, error: 'Failed to calculate storage size' };
  }
};

export default {
  setItem,
  getItem,
  removeItem,
  clearAll,
  getMultipleItems,
  setMultipleItems,
  removeMultipleItems,
  getAllKeys,
  hasItem,
  mergeItem,
  storeAuthToken,
  getAuthToken,
  removeAuthToken,
  storeUser,
  getUser,
  removeUser,
  storeTheme,
  getTheme: getTheme,
  storeLanguage,
  getLanguage,
  storeOnboardingCompleted,
  getOnboardingCompleted,
  clearAuthData,
  setItemWithExpiration,
  getItemWithExpiration,
  getStorageSize,
};
