/**
 * CODER System — Content Script Messaging Handler
 * 
 * Handles incoming messages from background/popup in the content script world.
 * Delegates to the appropriate handler: field detection, form filling, submission, etc.
 * 
 * Improvements:
 * - Typed imports for FillFormPayload
 * - Active observer tracking (prevents duplicates)
 * - Error handling with try/catch
 * - Stripe MAIN world bridge via CustomEvent
 * - CODER_PAYMENT_API_COMPLETED handler
 */

import { detectCheckoutFields, invalidateDetectionCache } from './detector';
import { fillCheckoutForm, submitCheckoutForm } from './formFiller';
import { CheckoutObserver } from './checkoutObserver';
import type { FillFormPayload } from '../types/messaging';
import type { IdentitySettings } from '../types/checkout';
import { DEFAULT_IDENTITY } from '../types/checkout';

let activeObserver: CheckoutObserver | null = null;

export function setupContentScriptMessaging(): void {
  if (typeof chrome === 'undefined' || !chrome.runtime) return;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const action = message?.action;
    if (!action) return;

    switch (action) {
      // ── Ping (keepalive check) ──
      case 'PING':
        sendResponse({ success: true, pong: true });
        break;

      // ── Field Detection ──
      case 'DETECT_FIELDS': {
        try {
          const result = detectCheckoutFields();
          sendResponse({ success: true, data: result });
        } catch (err) {
          sendResponse({ success: false, error: err instanceof Error ? err.message : String(err) });
        }
        break;
      }

      // ── Form Filling ──
      case 'FILL_FORM': {
        (async () => {
          try {
            const payload = message.payload as FillFormPayload | undefined;
            if (!payload?.fixture) {
              sendResponse({ success: false, error: 'Missing fixture in FILL_FORM payload' });
              return;
            }

            invalidateDetectionCache();
            const detection = detectCheckoutFields();
            const identity: IdentitySettings = payload.identity || DEFAULT_IDENTITY;

            await fillCheckoutForm(
              detection.fields,
              payload.fixture,
              identity,
              payload.randomNames ?? false,
              payload.randomAddresses ?? false
            );

            sendResponse({ success: true });
          } catch (err) {
            sendResponse({ success: false, error: err instanceof Error ? err.message : String(err) });
          }
        })();
        break;
      }

      // ── Form Submission ──
      case 'SUBMIT_FORM': {
        try {
          const submitted = submitCheckoutForm();
          sendResponse({ success: true, data: { submitted } });
        } catch (err) {
          sendResponse({ success: false, error: err instanceof Error ? err.message : String(err) });
        }
        break;
      }

      // ── Result Observation ──
      case 'OBSERVE_RESULT': {
        // Stop any existing observer to prevent duplicates
        if (activeObserver) {
          activeObserver.stop();
        }

        activeObserver = new CheckoutObserver();
        activeObserver.start((result, durationMs, details) => {
          // Notify background of result
          if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({
              action: 'PAYMENT_RESULT_DETECTED',
              payload: { result, durationMs, details },
            }).catch(() => {});
          }
        });

        sendResponse({ success: true, status: 'Observing' });
        break;
      }

      // ── Stop Observation ──
      case 'STOP_OBSERVING': {
        if (activeObserver) {
          activeObserver.stop();
          activeObserver = null;
        }
        sendResponse({ success: true, status: 'Stopped' });
        break;
      }

      // ── Payment API Completed (from network interceptor) ──
      case 'CODER_PAYMENT_API_COMPLETED': {
        console.log('[CODER Msg] Payment API completed:', message.payload);
        sendResponse({ success: true });
        break;
      }

      // ── AI Scan Form (from popup) ──
      case 'CODER_AI_SCAN_FORM': {
        try {
          const result = detectCheckoutFields();
          sendResponse({ success: true, fieldsCount: result.fields.length, provider: result.provider });
        } catch (err) {
          sendResponse({ success: false, error: err instanceof Error ? err.message : String(err) });
        }
        break;
      }

      default:
        sendResponse({ success: false, error: `Unknown content script action: ${action}` });
    }

    return true; // Keep message channel open for async response
  });

  // ── Bridge Stripe MAIN world events to background ──
  const handlePaymentEvent = (event: CustomEvent) => {
    const detail = event.detail;
    if (detail?.result && typeof chrome !== 'undefined' && chrome.runtime) {
      console.log('[CODEX(R)] Stripe interceptor result:', detail.result);
      chrome.runtime.sendMessage({
        action: 'PAYMENT_RESULT_DETECTED',
        payload: {
          result: detail.result,
          durationMs: 0,
          details: `Stripe interceptor: ${detail.error || detail.result}`,
        },
      }).catch(() => {});
    }
  };

  window.addEventListener('CODEX-payment-result', handlePaymentEvent as EventListener);
  window.addEventListener('codex-payment-result', handlePaymentEvent as EventListener);
}
