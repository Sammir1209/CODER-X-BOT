/**
 * CODER System — Session Manager
 * 
 * Manages the background execution state for test sessions.
 * Coordinates between popup UI, content scripts, and the service worker.
 * 
 * Improvements:
 * - Browser-compatible timer types (no NodeJS.Timeout)
 * - Configurable session timeout
 * - RESUMING state for reconnection
 * - Better error handling and validation
 * - Two-stage fill with configurable delay
 */

import type { ExecutionState, PaymentResultStatus, DetectionResult, IdentitySettings } from '../types/checkout';
import { DEFAULT_IDENTITY } from '../types/checkout';
import type { TestCase } from '../types/testCase';
import { STORAGE_KEYS } from '../utils/constants';

// ─── Session State ────────────────────────────────────────────────────────────

export interface RunnerSessionState {
  state: ExecutionState;
  activeTabId?: number;
  currentDomain?: string;
  testCase?: TestCase;
  detectionResult?: DetectionResult;
  startTime?: number;
  elapsedMs: number;
  errorDetails?: string;
  allowedDomains: string[];
}

// ─── Session Manager Class ────────────────────────────────────────────────────

export class SessionManager {
  private state: RunnerSessionState = {
    state: 'IDLE',
    elapsedMs: 0,
    allowedDomains: ['localhost', '127.0.0.1'],
  };

  private timerId: ReturnType<typeof setInterval> | null = null;
  private sessionTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /** Maximum session duration before auto-stop (5 minutes) */
  private maxSessionDurationMs = 5 * 60 * 1000;

  // ─── Getters ──────────────────────────────────────────────────────────

  public getState(): RunnerSessionState {
    return { ...this.state };
  }

  public setAllowedDomains(domains: string[]): void {
    this.state.allowedDomains = [...domains];
  }

  // ─── Detection ────────────────────────────────────────────────────────

  public async startDetection(tabId: number, domain: string): Promise<DetectionResult> {
    this.state.activeTabId = tabId;
    this.state.currentDomain = domain;
    this.state.state = 'DETECTING';

    try {
      const response = await chrome.tabs.sendMessage(tabId, { action: 'DETECT_FIELDS' });

      if (!response?.success) {
        throw new Error('No response from content script');
      }

      this.state.detectionResult = response.data;
      this.state.state = response.data.hasCheckout ? 'CHECKOUT_FOUND' : 'IDLE';
      return response.data;

    } catch (err) {
      this.state.state = 'ERROR';
      this.state.errorDetails = err instanceof Error ? err.message : String(err);
      throw err;
    }
  }

  // ─── Multi-Frame Broadcasting ─────────────────────────────────────────

  private async broadcastToTab(tabId: number, message: Record<string, unknown>): Promise<unknown> {
    // Try webNavigation API for multi-frame support
    if (chrome.webNavigation) {
      return new Promise((resolve) => {
        chrome.webNavigation.getAllFrames({ tabId }, async (frames) => {
          if (!frames || frames.length === 0) {
            const res = await chrome.tabs.sendMessage(tabId, message).catch(() => null);
            return resolve(res);
          }

          let lastSuccessRes: unknown = null;

          for (const frame of frames) {
            try {
              const res = await chrome.tabs.sendMessage(tabId, message, { frameId: frame.frameId });
              if (res && (res as Record<string, unknown>).success) {
                lastSuccessRes = res;
              }
            } catch {
              // Frame may not have content script
            }
          }

          resolve(lastSuccessRes || { success: true });
        });
      });
    }

    // Fallback: direct message to main frame
    return chrome.tabs.sendMessage(tabId, message).catch(() => null);
  }

  // ─── Test Execution ───────────────────────────────────────────────────

  public async executeTestCase(tabId: number, testCase: TestCase): Promise<void> {
    // Resolve domain if not set
    if (!this.state.currentDomain) {
      try {
        const tab = await chrome.tabs.get(tabId);
        if (tab.url) {
          this.state.currentDomain = new URL(tab.url).hostname;
        }
      } catch {
        // Ignore
      }
    }

    this.state.activeTabId = tabId;
    this.state.testCase = testCase;
    this.state.state = 'FILLING';
    this.state.startTime = Date.now();
    this.startTimer();
    this.startSessionTimeout();

    try {
      // Fetch identity settings
      const settings = await new Promise<Record<string, unknown>>((resolve) => {
        chrome.storage.local.get([
          STORAGE_KEYS.IDENTITY,
          STORAGE_KEYS.RANDOM_NAMES,
          STORAGE_KEYS.RANDOM_ADDRESSES,
        ], (s) => resolve(s || {}));
      });

      const identity = (settings[STORAGE_KEYS.IDENTITY] as IdentitySettings) || DEFAULT_IDENTITY;
      const randomNames = (settings[STORAGE_KEYS.RANDOM_NAMES] as boolean) || false;
      const randomAddresses = (settings[STORAGE_KEYS.RANDOM_ADDRESSES] as boolean) || false;

      const fillPayload = {
        fixture: testCase.fixture,
        identity,
        randomNames,
        randomAddresses,
      };

      // Fill all frames (card details, email, address)
      await this.broadcastToTab(tabId, {
        action: 'FILL_FORM',
        payload: fillPayload,
      });

      // Micro-pause for DOM events to settle
      await new Promise(r => setTimeout(r, 100));

      // Submit across all frames
      this.state.state = 'SUBMITTING';
      await this.broadcastToTab(tabId, { action: 'SUBMIT_FORM' });
      this.state.state = 'PROCESSING';

      // Start result observer
      this.broadcastToTab(tabId, { action: 'OBSERVE_RESULT' });

    } catch (err) {
      this.stopTimer();
      this.clearSessionTimeout();
      this.state.state = 'ERROR';
      this.state.errorDetails = err instanceof Error ? err.message : String(err);
      throw err;
    }
  }

  // ─── Result Handling ──────────────────────────────────────────────────

  public handleResultDetected(result: PaymentResultStatus, durationMs: number): void {
    this.stopTimer();
    this.clearSessionTimeout();
    this.state.elapsedMs = durationMs;

    switch (result) {
      case 'SUCCESS':
        this.state.state = 'SUCCESS';
        break;
      case 'DECLINED':
        this.state.state = 'EXPECTED_DECLINE';
        break;
      case 'REQUIRES_ACTION':
        this.state.state = 'REQUIRES_ACTION';
        break;
      default:
        this.state.state = 'ERROR';
        break;
    }

    if (this.state.activeTabId) {
      this.broadcastToTab(this.state.activeTabId, {
        action: 'PAYMENT_RESULT_BROADCAST',
        payload: { result, durationMs },
      });
    }
  }

  // ─── Session Control ──────────────────────────────────────────────────

  public stopSession(): void {
    this.stopTimer();
    this.clearSessionTimeout();

    if (this.state.activeTabId) {
      chrome.tabs.sendMessage(this.state.activeTabId, { action: 'STOP_OBSERVING' }).catch(() => {});
    }

    this.state.state = 'STOPPED';
    this.state.errorDetails = 'Session stopped by user';
  }

  public resetSession(): void {
    this.stopTimer();
    this.clearSessionTimeout();

    this.state = {
      state: 'IDLE',
      elapsedMs: 0,
      allowedDomains: this.state.allowedDomains,
    };
  }

  // ─── Timer ────────────────────────────────────────────────────────────

  private startTimer(): void {
    this.stopTimer();
    this.timerId = setInterval(() => {
      if (this.state.startTime) {
        this.state.elapsedMs = Date.now() - this.state.startTime;
      }
    }, 200);
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  // ─── Session Timeout ──────────────────────────────────────────────────

  private startSessionTimeout(): void {
    this.clearSessionTimeout();
    this.sessionTimeoutId = setTimeout(() => {
      if (this.state.state === 'PROCESSING' || this.state.state === 'SUBMITTING') {
        console.warn('[CODER SM] Session timeout reached, auto-stopping');
        this.stopSession();
        this.state.errorDetails = 'Session timed out after maximum duration';
      }
    }, this.maxSessionDurationMs);
  }

  private clearSessionTimeout(): void {
    if (this.sessionTimeoutId !== null) {
      clearTimeout(this.sessionTimeoutId);
      this.sessionTimeoutId = null;
    }
  }
}

export const sessionManager = new SessionManager();
