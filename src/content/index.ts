/**
 * CODER System — Content Script Entry Point
 * 
 * Rewritten from 330-line monolith to clean, modular entry point.
 * - Uses MutationObserver instead of setInterval polling
 * - Domain guard before initialization  
 * - Delegates test loop to AutoTestRunner class
 * - Clean event-driven architecture
 */

import { setupContentScriptMessaging } from './messaging';
import { startCaptchaAutoClicker } from './captchaAutoClicker';
import { CODEROverlay } from './overlay';
import { detectCheckoutFields } from './detector';
import { AutoTestRunner, type RunnerStats } from './autoTestRunner';
import { sendTelegramBatchSummary } from '../utils/telegramNotifier';
import { storageGet } from '../utils/storageAdapter';
import { STORAGE_KEYS, TIMING } from '../utils/constants';
import type { ExecutionState, PaymentResultStatus } from '../types/checkout';
import type { TestCase } from '../types/testCase';

console.log('[CODER] Content script initialized on:', window.location.hostname);

// Set up messaging & Captcha auto-clicker for all frames (top + iframes)
setupContentScriptMessaging();
startCaptchaAutoClicker();

// Only run overlay & auto-test in the top window
const isTopWindow = window === window.top;

if (isTopWindow) {
  initTopFrame();
}

// ─── Top Frame Initialization ──────────────────────────────────────────────────

async function initTopFrame(): Promise<void> {
  const overlay = new CODEROverlay();
  let runner: AutoTestRunner | null = null;
  let overlayMounted = false;

  // Create the runner with overlay callbacks
  function createRunner(): AutoTestRunner {
    return new AutoTestRunner({
      onStateChange: (state: ExecutionState, data) => {
        overlay.updateState({
          executionState: state,
          isRunning: state !== 'IDLE' && state !== 'SUCCESS' && state !== 'STOPPED' && state !== 'REQUIRES_ACTION',
          isPaused: state === 'PAUSED',
          currentMaskedCard: data?.maskedCard,
          attemptCount: (data?.currentIndex ?? 0) + 1,
          totalCards: data?.totalCards ?? overlay.getStats().totalCards,
        });
      },
      onCardStart: (index, total, maskedCard) => {
        overlay.updateState({
          isRunning: true,
          executionState: 'FILLING',
          currentMaskedCard: maskedCard,
          attemptCount: index + 1,
          totalCards: total,
        });
      },
      onCardResult: (_index, result: PaymentResultStatus, _durationMs) => {
        if (result === 'DECLINED' || result === 'ERROR' || result === 'UNKNOWN' || result === 'TIMEOUT') {
          overlay.updateState({
            declined: overlay.getStats().declined + 1,
          });
        } else if (result === 'REQUIRES_ACTION') {
          overlay.updateState({
            threeds: overlay.getStats().threeds + 1,
          });
        }
      },
      onHit: (_card, _maskedCard) => {
        overlay.updateState({
          executionState: 'SUCCESS',
          hits: overlay.getStats().hits + 1,
          isRunning: false,
        });
      },
      onComplete: async (stats: RunnerStats) => {
        overlay.updateState({
          executionState: 'IDLE',
          isRunning: false,
        });

        // Send Telegram batch summary
        const chatId = await storageGet<string>(STORAGE_KEYS.TELEGRAM_CHAT_ID);
        const botToken = await storageGet<string>(STORAGE_KEYS.TELEGRAM_BOT_TOKEN);
        if (chatId) {
          sendTelegramBatchSummary(chatId, {
            totalCards: stats.totalCards,
            hits: stats.hits,
            declined: stats.declined,
            threeds: stats.threeds,
            merchant: window.location.hostname,
          }, botToken || undefined);
        }
      },
      onError: (error: string) => {
        console.error('[CODER Runner] Error:', error);
      },
    });
  }

  // ── Try to mount overlay when checkout detected ──
  function tryMountOverlay(): boolean {
    if (overlayMounted) return true;

    const detection = detectCheckoutFields();
    if (!detection.hasCheckout) return false;

    runner = createRunner();

    overlay.init(
      // START callback
      (_testCaseId: string) => {
        console.log('[CODER] START pressed');
        runner!.start();
      },
      // STOP callback
      () => {
        console.log('[CODER] STOP pressed');
        runner!.stop();
      },
      // PAUSE callback
      () => {
        runner!.pause();
      },
      // SKIP callback
      () => {
        runner!.skip();
      }
    );

    // Load test cases into overlay
    storageGet<TestCase[]>(STORAGE_KEYS.TEST_CASES).then((cases) => {
      if (cases && cases.length > 0) {
        overlay.setTestCases(cases);
      }
    });

    overlay.updateState({
      provider: detection.provider.toUpperCase(),
      executionState: 'CHECKOUT_FOUND',
    });

    overlayMounted = true;

    // Check for active progress to resume
    runner.tryResumeFromProgress().then((resumed) => {
      if (resumed) {
        overlay.updateState({ isRunning: true });
      }
    });

    return true;
  }

  // ── Smart SPA Detection with MutationObserver ──
  // Try immediately first
  tryMountOverlay();

  // Then observe DOM for dynamic checkout loading (SPAs, modals)
  if (!overlayMounted) {
    let mutationDebounce: ReturnType<typeof setTimeout> | null = null;

    const domObserver = new MutationObserver(() => {
      if (overlayMounted) {
        domObserver.disconnect();
        return;
      }
      // Debounce: wait 300ms after last mutation before checking
      if (mutationDebounce) clearTimeout(mutationDebounce);
      mutationDebounce = setTimeout(() => {
        const mounted = tryMountOverlay();
        if (mounted) {
          domObserver.disconnect();
        }
      }, 300);
    });

    domObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Safety: also try periodically for very late-loading checkouts
    const safetyInterval = setInterval(() => {
      if (overlayMounted) {
        clearInterval(safetyInterval);
        return;
      }
      tryMountOverlay();
    }, TIMING.SPA_POLL_INTERVAL);

    // Stop safety poll after 30 seconds
    setTimeout(() => clearInterval(safetyInterval), 30000);
  }

  // ── Listen for AI Form Scan requests from popup ──
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
      if (req.action === 'CODEX_AI_SCAN_FORM') {
        const result = detectCheckoutFields();
        console.log('[CODEX(R) AI SCAN] Resolved fields:', result.fields);
        sendResponse({ success: true, fieldsCount: result.fields.length, provider: result.provider });
        return true;
      }
    });
  }
}
