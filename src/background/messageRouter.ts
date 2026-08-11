/**
 * CODER System — Message Router
 * 
 * Routes all chrome.runtime messages between popup, content scripts,
 * and background service worker.
 * 
 * Improvements:
 * - Typed message handling with validation
 * - Logging of all messages for debugging
 * - Early return on missing payloads
 */

import { sessionManager } from './sessionManager';

export function setupMessageRouter(): void {
  if (typeof chrome === 'undefined' || !chrome.runtime) return;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const action = message?.action;
    const tabId = sender.tab?.id;

    if (!action) {
      sendResponse({ success: false, error: 'Missing action field' });
      return true;
    }

    // Log incoming messages (truncate payload for readability)
    console.log(`[CODER Router] ${action} from ${sender.tab ? `tab:${tabId}` : 'popup/bg'}`);

    switch (action) {
      // ── Session State ──
      case 'GET_SESSION_STATE':
        sendResponse({ success: true, data: sessionManager.getState() });
        break;

      // ── Domain Management ──
      case 'SET_ALLOWED_DOMAINS': {
        const domains = message.payload?.domains;
        if (!Array.isArray(domains)) {
          sendResponse({ success: false, error: 'payload.domains must be an array' });
          break;
        }
        sessionManager.setAllowedDomains(domains);
        sendResponse({ success: true });
        break;
      }

      // ── Detection ──
      case 'START_DETECTION': {
        const targetTabId = message.payload?.tabId || tabId;
        const targetDomain = message.payload?.domain;
        if (!targetTabId || !targetDomain) {
          sendResponse({ success: false, error: 'Missing tabId or domain in payload' });
          break;
        }
        sessionManager
          .startDetection(targetTabId, targetDomain)
          .then((res) => sendResponse({ success: true, data: res }))
          .catch((err) => sendResponse({ success: false, error: err.message }));
        return true; // Keep channel open for async
      }

      // ── Test Execution ──
      case 'EXECUTE_TEST_CASE': {
        const execTabId = message.payload?.tabId || tabId;
        const testCase = message.payload?.testCase;
        if (!execTabId) {
          sendResponse({ success: false, error: 'Missing tabId' });
          break;
        }
        if (!testCase?.fixture) {
          sendResponse({ success: false, error: 'Missing or invalid testCase in payload' });
          break;
        }
        sessionManager
          .executeTestCase(execTabId, testCase)
          .then(() => sendResponse({ success: true }))
          .catch((err) => sendResponse({ success: false, error: err.message }));
        return true; // Keep channel open for async
      }

      // ── Payment Result ──
      case 'PAYMENT_RESULT_DETECTED': {
        const result = message.payload?.result;
        const durationMs = message.payload?.durationMs;
        if (!result) {
          sendResponse({ success: false, error: 'Missing result in payload' });
          break;
        }
        sessionManager.handleResultDetected(result, durationMs || 0);

        // Broadcast to tabs so top-frame AutoTestRunner receives result instantly (0ms lag)
        const activeTabId = tabId || sender.tab?.id;
        if (activeTabId && typeof chrome !== 'undefined' && chrome.tabs) {
          chrome.tabs.sendMessage(activeTabId, {
            action: 'PAYMENT_RESULT_BROADCAST',
            payload: message.payload,
          }).catch(() => {});
        }

        sendResponse({ success: true });
        break;
      }

      // ── Session Control ──
      case 'STOP_SESSION':
        sessionManager.stopSession();
        sendResponse({ success: true });
        break;

      case 'RESET_SESSION':
        sessionManager.resetSession();
        sendResponse({ success: true });
        break;

      // ── Unknown ──
      default:
        sendResponse({ success: false, error: `Unknown action: ${action}` });
    }

    return true; // Always return true for async compatibility
  });
}
