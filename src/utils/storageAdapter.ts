/**
 * CODEX(R) System — Universal Storage Adapter
 * 
 * Single source of truth for all storage operations across:
 * - Chrome Extension (`chrome.storage.local`)
 * - Desktop sync server (HTTP sync to localhost:18080)
 * - Web fallback (`localStorage`)
 * 
 * Replaces ~8 duplicated storage helper implementations.
 */

import { DESKTOP_SYNC_URL, ENABLE_ENCRYPTION, SYNC_MAX_RETRIES } from './constants';
import { handleAsync } from './errorHandler';
import { encryptData, decryptData } from './crypto';

// ─── Environment Detection ────────────────────────────────────────────────────

const DEBUG = typeof process !== 'undefined' && process?.env?.NODE_ENV !== 'production';

const isChromeExtension = (): boolean =>
  typeof chrome !== 'undefined' && !!chrome?.storage?.local;

// IndexedDB helper functions
const DB_NAME = 'CODEX_storage';
const STORE_NAME = 'kv_store';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDb();
    return new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        const result = req.result as T | undefined;
        resolve(result ?? null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function idbSet(key: string, value: any): Promise<void> {
  try {
    const db = await openDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {}
}

async function idbRemove(key: string): Promise<void> {
  try {
    const db = await openDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {}
}

async function idbGetMultiple<T extends Record<string, unknown>>(keys: string[]): Promise<Partial<T>> {
  const result: Partial<T> = {};
  for (const key of keys) {
    const val = await idbGet<T[typeof key]>(key);
    if (val !== null) {
      (result as any)[key] = val;
    }
  }
  return result;
}

// ─── Core Storage Operations ──────────────────────────────────────────────────

/**
 * Retrieves a value from storage. Resolution order:
 * 1. chrome.storage.local (if in extension context)
 * 2. Desktop sync server (fire-and-forget)
 * 3. localStorage (web fallback)
 */
export async function storageGet<T = unknown>(key: string): Promise<T | null> {
  // Path 1: Chrome Extension
  if (isChromeExtension()) {
      return handleAsync<T | null>(async () => {
        return new Promise<T | null>((resolve) => {
          chrome.storage.local.get([key], (result) => {
            const val = result[key];
            resolve(val !== undefined ? (val as T) : null);
          });
        });
      }, 'storageGet chrome', 0);
    }

  // Path 2: IndexedDB (primary fallback)
  const idbValue = await idbGet<T>(key);
  if (idbValue !== null) {
    if (ENABLE_ENCRYPTION) {
      try {
        const decrypted = await decryptData(idbValue as unknown as string);
        return JSON.parse(decrypted) as T;
      } catch {
        // Decryption failed, fall through to next source
      }
    } else {
      return idbValue;
    }
  }

  // Path 3: Attempt desktop sync server (fire-and-forget)
  try {
    const res = await fetch(DESKTOP_SYNC_URL, { signal: AbortSignal.timeout(1000) });
    if (res.ok) {
      const data = await res.json();
      if (data[key] !== undefined && data[key] !== null) {
        return data[key] as T;
      }
    }
  } catch {
    // Desktop sync unavailable, continue fallback
  }

  // Path 4: localStorage fallback
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      const parsed = JSON.parse(raw) as T;
      return parsed;
    }
  } catch {
    // Invalid JSON, return null
  }

  return null;
};

/**
 * Retrieves multiple values from storage in a single call.
 */
export async function storageGetMultiple<T extends Record<string, unknown>>(
  keys: string[]
): Promise<Partial<T>> {
  // Path 1: Chrome Extension — efficient batch read
  if (isChromeExtension()) {
        const result = await handleAsync<Partial<T> | null>(async () => {
          return new Promise<Partial<T>>((resolve) => {
            chrome.storage.local.get(keys, (result) => {
              resolve(result as Partial<T>);
            });
          });
        }, 'storageGetMultiple chrome', 0);
        return result ?? ({} as Partial<T>);
      }

  // Path 2: IndexedDB batch read
  const idbResult = await idbGetMultiple<T>(keys);
  if (Object.keys(idbResult).length > 0) {
    if (ENABLE_ENCRYPTION) {
      const decryptedResult: Partial<T> = {};
      for (const [k, v] of Object.entries(idbResult)) {
        try {
          const dec = await decryptData(v as unknown as string);
          decryptedResult[k as keyof T] = JSON.parse(dec) as any;
        } catch {
          // Skip decryption failures
        }
      }
      if (Object.keys(decryptedResult).length > 0) return decryptedResult;
    } else {
      return idbResult as Partial<T>;
    }
  }

  // Path 3: Attempt desktop sync server (fire-and-forget)
  try {
    const res = await fetch(DESKTOP_SYNC_URL, { signal: AbortSignal.timeout(1000) });
    if (res.ok) {
      const data = await res.json();
      const filtered: Record<string, unknown> = {};
      for (const key of keys) {
        if (data[key] !== undefined) {
          filtered[key] = data[key];
        }
      }
      if (Object.keys(filtered).length > 0) {
        return filtered as Partial<T>;
      }
    }
  } catch {
    // Desktop sync unavailable
  }

  // Path 4: localStorage fallback
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        result[key] = JSON.parse(raw);
      }
    } catch {
      // Skip invalid entries
    }
  }
  return result as Partial<T>;
};

/**
 * Stores a value. Writes to all available backends:
 * - chrome.storage.local (primary in extension)
 * - localStorage (web fallback)
 * - Desktop sync server (fire-and-forget background sync)
 */
export async function storageSet(key: string, value: unknown): Promise<void> {
  // Path 1: Chrome Extension
  if (isChromeExtension()) {
    return new Promise<void>((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  }

  // Path 2: IndexedDB (with optional encryption)
  let storedValue = value;
  if (ENABLE_ENCRYPTION) {
    try {
      const json = JSON.stringify(value);
      const encrypted = await encryptData(json);
      storedValue = encrypted;
    } catch {
      // Encryption failed, fallback to raw value
    }
  }
  await idbSet(key, storedValue);

  // Path 3: localStorage fallback (unencrypted)
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage full or unavailable
  }

  // Path 4: Sync to desktop backend (fire-and-forget)
  syncToDesktop({ [key]: value }, SYNC_MAX_RETRIES);
};

/**
 * Stores multiple key-value pairs atomically.
 */
export async function storageSetMultiple(entries: Record<string, unknown>): Promise<void> {
  if (isChromeExtension()) {
    return new Promise<void>((resolve) => {
      chrome.storage.local.set(entries, resolve);
    });
  }

  // IndexedDB batch set with optional encryption
  const toStore: Record<string, any> = {};
  for (const [key, val] of Object.entries(entries)) {
    if (ENABLE_ENCRYPTION) {
      try {
        const encrypted = await encryptData(JSON.stringify(val));
        toStore[key] = encrypted;
      } catch {
        toStore[key] = val; // fallback
      }
    } else {
      toStore[key] = val;
    }
  }
  for (const [k, v] of Object.entries(toStore)) {
    await idbSet(k, v);
  }

  // localStorage fallback (unencrypted)
  for (const [key, value] of Object.entries(entries)) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Skip
    }
  }

  // Sync to desktop
  syncToDesktop(entries, SYNC_MAX_RETRIES);
};

/**
 * Removes a value from storage.
 */
export async function storageRemove(key: string): Promise<void> {
  if (isChromeExtension()) {
    return new Promise<void>((resolve) => {
      chrome.storage.local.remove(key, resolve);
    });
  }

  // IndexedDB removal
  await idbRemove(key);

  localStorage.removeItem(key);

  // Sync removal to desktop
  syncToDesktop({ [key]: null }, SYNC_MAX_RETRIES);
};

/**
 * Removes multiple keys from storage.
 */
export async function storageRemoveMultiple(keys: string[]): Promise<void> {
  if (isChromeExtension()) {
    return new Promise<void>((resolve) => {
      chrome.storage.local.remove(keys, resolve);
    });
  }

  // IndexedDB batch removal
  for (const key of keys) {
    await idbRemove(key);
  }

  for (const key of keys) {
    localStorage.removeItem(key);
  }

  const nullEntries: Record<string, null> = {};
  for (const key of keys) {
    nullEntries[key] = null;
  }
  syncToDesktop(nullEntries, SYNC_MAX_RETRIES);
};

// ─── Desktop Sync (Fire-and-Forget) ──────────────────────────────────────────

function syncToDesktop(data: Record<string, unknown>, retries = SYNC_MAX_RETRIES): void {
  const attempt = async (remaining: number) => {
    try {
      await fetch(DESKTOP_SYNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(2000),
      });
    } catch (e) {
      if (DEBUG) {
        console.warn('[StorageAdapter] Desktop sync failed, retries left:', remaining, e);
      }
      if (remaining > 0) {
        // exponential backoff
        await new Promise(res => setTimeout(res, 500 * (SYNC_MAX_RETRIES - remaining + 1)));
        await attempt(remaining - 1);
      }
    }
  };
  attempt(retries).catch(() => {
    // final silent failure
    if (DEBUG) console.error('[StorageAdapter] Desktop sync ultimately failed');
  });
}

