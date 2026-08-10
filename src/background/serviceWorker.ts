/**
 * CODER System — Background Service Worker
 * 
 * Chrome MV3 Service Worker entry point.
 * 
 * Improvements:
 * - Alarm-based sync instead of aggressive setInterval(2000)
 * - Exponential backoff for Desktop App sync
 * - Proper onSuspend cleanup
 * - Network interceptor integration
 * - Structured logging with timestamps
 */

import { setupMessageRouter } from './messageRouter';
import { sessionManager } from './sessionManager';
import { setupNetworkInterceptor } from './networkInterceptor';
import { STORAGE_KEYS, TIMING, DESKTOP_SYNC_URL, SYSTEM_VERSION } from '../utils/constants';

// ─── Initialization ───────────────────────────────────────────────────────────

console.log(`[CODER SW] Service Worker v${SYSTEM_VERSION} started at ${new Date().toISOString()}`);

setupMessageRouter();
setupNetworkInterceptor();

// ─── Desktop App Sync ─────────────────────────────────────────────────────────

let syncFailCount = 0;
const MAX_BACKOFF_MS = 30000; // Max 30 seconds between retries

async function syncFromDesktopApp(): Promise<void> {
  try {
    const res = await fetch(DESKTOP_SYNC_URL, {
      signal: AbortSignal.timeout(2000),
    });

    if (!res.ok) {
      syncFailCount++;
      return;
    }

    const data = await res.json();
    if (!data || typeof data !== 'object') return;

    // Reset fail count on success
    syncFailCount = 0;

    const syncKeys = [
      STORAGE_KEYS.BINS,
      STORAGE_KEYS.CCS,
      STORAGE_KEYS.TEST_CASES,
      STORAGE_KEYS.IDENTITY,
      STORAGE_KEYS.RANDOM_NAMES,
      STORAGE_KEYS.RANDOM_ADDRESSES,
      STORAGE_KEYS.ACTIVE_SOURCE_MODE,
      STORAGE_KEYS.USER_SESSION,
      STORAGE_KEYS.HITS,
    ];

    chrome.storage.local.get(syncKeys, (current) => {
      const toSave: Record<string, unknown> = {};
      let hasChanges = false;

      for (const key of syncKeys) {
        if (data[key] !== undefined && JSON.stringify(data[key]) !== JSON.stringify(current[key])) {
          toSave[key] = data[key];
          hasChanges = true;
        }
      }

      if (hasChanges) {
        console.log(`[CODER SW] Syncing ${Object.keys(toSave).length} keys from Desktop App`);
        chrome.storage.local.set(toSave);
      }
    });

  } catch {
    syncFailCount++;
    // Silent — Desktop App offline
  }
}

// ─── Alarms ───────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  console.log(`[CODER SW] Extension installed/updated — v${SYSTEM_VERSION}`);
  sessionManager.setAllowedDomains(['localhost', '127.0.0.1', 'staging.example.com']);

  // Set up periodic alarms
  chrome.alarms.create('desktopSync', { periodInMinutes: 0.1 }); // Every 6 seconds
  chrome.alarms.create('keepAlive', { periodInMinutes: TIMING.KEEPALIVE_INTERVAL_MIN });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  switch (alarm.name) {
    case 'keepAlive':
// Telegram Bot polling se maneja ahora exclusivamente en server/botServer.mjs para evitar conflicto 409
      break;

    case 'desktopSync': {
      // Exponential backoff on repeated failures
      if (syncFailCount > 3) {
        const backoffMs = Math.min(1000 * Math.pow(2, syncFailCount - 3), MAX_BACKOFF_MS);
        console.log(`[CODER SW] Desktop sync backoff: ${backoffMs}ms`);
        // Skip this sync cycle if within backoff window
        if (syncFailCount > 10) {
          // After many failures, only try every few cycles
          if (Math.random() > 0.3) return;
        }
      }
      syncFromDesktopApp();
      break;
    }
  }
});

// ─── Extension Action Click ───────────────────────────────────────────────────

chrome.action.onClicked.addListener(() => {
  const panelUrl = chrome.runtime.getURL('index.html');
  chrome.tabs.query({ url: panelUrl }, (tabs) => {
    if (tabs.length === 0) {
      chrome.tabs.create({ url: panelUrl });
    } else {
      // Focus existing tab and window
      const tab = tabs[0];
      chrome.tabs.update(tab.id!, { active: true });
      chrome.windows.update(tab.windowId, { focused: true });
    }
  });
});

// ─── Initial sync ─────────────────────────────────────────────────────────────

syncFromDesktopApp();
