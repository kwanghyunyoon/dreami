/**
 * Unified storage layer for sleep-app.
 *
 * Strategy:
 *   SecureStore  — small preference/config keys (encrypted on-device)
 *                  iOS: Keychain  |  Android: EncryptedSharedPreferences
 *   AsyncStorage — large or frequently-updated data (sleep log, active session)
 *                  Persists across restarts; not encrypted but not sensitive.
 *
 * API mirrors AsyncStorage: getItem / setItem / removeItem
 * All values are strings (JSON.stringify before storing objects).
 *
 * SecureStore limit: ~2 KB per value on iOS Keychain.
 * Never put the sleep log in SECURE_KEYS — it grows unbounded.
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// expo-secure-store has no web implementation — fall back to AsyncStorage on web.
const canUseSecureStore = Platform.OS !== 'web';

// Keys stored encrypted in SecureStore
const SECURE_KEYS = new Set([
  'alarm',       // alarm config object (hour, minute, days, etc.)
  'language',    // user language preference
  'onboarding',  // onboarding completion state
]);

// All known keys across both storage backends
const ALL_KEYS = [
  'sleepLog',
  'lastSleep',
  'alarm',
  'language',
  'soundsTimer',
  'soundsCategory',
  'onboarding',
  'sleepStart',
];

export const DATA_INVENTORY = [
  { key: 'sleepLog',       label: 'Sleep log',           storage: 'AsyncStorage',  encrypted: false, description: 'Array of all your sleep sessions (start, end, duration, quality)' },
  { key: 'alarm',          label: 'Alarm settings',      storage: 'SecureStore',   encrypted: true,  description: 'Wake-up time, days, and reminder preferences' },
  { key: 'language',       label: 'Language preference', storage: 'SecureStore',   encrypted: true,  description: 'Your chosen app language' },
  { key: 'soundsTimer',    label: 'Sound timer',         storage: 'AsyncStorage',  encrypted: false, description: 'Last selected sleep timer duration' },
  { key: 'soundsCategory', label: 'Sound category',      storage: 'AsyncStorage',  encrypted: false, description: 'Last selected sound category' },
  { key: 'onboarding',     label: 'Onboarding status',   storage: 'SecureStore',   encrypted: true,  description: 'Whether you have completed the app introduction' },
  { key: 'sleepStart',     label: 'Sleep session',       storage: 'AsyncStorage',  encrypted: false, description: 'Timestamp of current active sleep tracking session' },
  { key: 'lastSleep',      label: 'Last sleep',          storage: 'AsyncStorage',  encrypted: false, description: 'Most recent completed sleep entry' },
];

export async function getItem(key) {
  try {
    if (SECURE_KEYS.has(key) && canUseSecureStore) {
      return await SecureStore.getItemAsync(key);
    }
    return await AsyncStorage.getItem(key);
  } catch (e) {
    console.warn(`[storage] getItem(${key}) failed:`, e);
    return null;
  }
}

export async function setItem(key, value) {
  try {
    if (SECURE_KEYS.has(key) && canUseSecureStore) {
      return await SecureStore.setItemAsync(key, value);
    }
    return await AsyncStorage.setItem(key, value);
  } catch (e) {
    console.warn(`[storage] setItem(${key}) failed:`, e);
  }
}

export async function removeItem(key) {
  try {
    if (SECURE_KEYS.has(key) && canUseSecureStore) {
      return await SecureStore.deleteItemAsync(key);
    }
    return await AsyncStorage.removeItem(key);
  } catch (e) {
    console.warn(`[storage] removeItem(${key}) failed:`, e);
  }
}

/**
 * Reads all known keys and returns their parsed values as a single object.
 * JSON strings are parsed back to objects/arrays; nulls are preserved as null.
 * Returns { exported: true, timestamp: ISO string, data: { ... } }.
 */
export async function exportData() {
  const exportKeys = ['sleepLog', 'lastSleep', 'alarm', 'language', 'soundsTimer', 'soundsCategory', 'onboarding'];

  const entries = await Promise.all(
    exportKeys.map(async (key) => {
      const raw = await getItem(key);
      if (raw === null || raw === undefined) {
        return [key, null];
      }
      try {
        return [key, JSON.parse(raw)];
      } catch {
        // Not valid JSON — return the raw string value
        return [key, raw];
      }
    })
  );

  const data = Object.fromEntries(entries);

  return {
    exported: true,
    timestamp: new Date().toISOString(),
    data,
  };
}

/**
 * Removes every known key from whichever storage backend owns it.
 * Returns { cleared: true } when done.
 */
export async function clearAllData() {
  await Promise.all(ALL_KEYS.map((key) => removeItem(key)));
  return { cleared: true };
}
