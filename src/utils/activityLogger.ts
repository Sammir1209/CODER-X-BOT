/**
 * CODEX(R) System — Real-Time Activity Logger Utility
 *
 * Persists and broadcasts activity logs (gateway detection, card testing, filling, submit, results)
 * so that the Activity Log tab in the Popup/Dashboard updates live in real-time.
 */

import { storageGet, storageSet } from './storageAdapter';
import { STORAGE_KEYS } from './constants';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'INFO' | 'GATEWAY' | 'TRYING' | 'SUCCESS' | 'DECLINED' | 'REQUIRES_ACTION' | 'ERROR';
  message: string;
  details?: string;
  maskedCard?: string;
}

/**
 * Appends a new activity log entry, saves it to storage and broadcasts to UI listeners.
 */
export async function addActivityLog(
  type: LogEntry['type'],
  message: string,
  details?: string,
  maskedCard?: string
): Promise<LogEntry> {
  const entry: LogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    type,
    message,
    details,
    maskedCard,
  };

  try {
    const logs = (await storageGet<LogEntry[]>(STORAGE_KEYS.ACTIVITY_LOGS)) || [];
    const updated = [entry, ...logs].slice(0, 300); // Keep last 300 logs
    await storageSet(STORAGE_KEYS.ACTIVITY_LOGS, updated);

    // Broadcast live event to open popup/dashboard UI
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'NEW_ACTIVITY_LOG', payload: entry }).catch(() => {});
    }
  } catch (e) {
    console.warn('[CODEX(R) Logger] Error adding log entry:', e);
  }

  return entry;
}

/**
 * Gets all saved activity logs from storage.
 */
export async function getActivityLogs(): Promise<LogEntry[]> {
  return (await storageGet<LogEntry[]>(STORAGE_KEYS.ACTIVITY_LOGS)) || [];
}

/**
 * Clears all activity logs.
 */
export async function clearActivityLogs(): Promise<void> {
  await storageSet(STORAGE_KEYS.ACTIVITY_LOGS, []);
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'CLEAR_ACTIVITY_LOGS' }).catch(() => {});
    }
  } catch {}
}
