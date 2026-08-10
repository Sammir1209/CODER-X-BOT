/**
 * CODER System — Network Interceptor
 * 
 * Uses chrome.webRequest API to detect payment gateway API calls
 * in real-time. Provides instant detection of Stripe payment results
 * without relying solely on DOM observation.
 * 
 * Leverages admin permissions: webRequest, <all_urls>
 */

const PAYMENT_URL_PATTERNS = [
  '*://api.stripe.com/v1/payment_intents*',
  '*://api.stripe.com/v1/setup_intents*',
  '*://api.stripe.com/v1/tokens*',
  '*://api.stripe.com/v1/payment_methods*',
  '*://api.stripe.com/v1/charges*',
  '*://checkout.stripe.com/*',
  '*://buy.stripe.com/*',
];

interface InterceptedRequest {
  url: string;
  method: string;
  tabId: number;
  timestamp: number;
  type: 'payment_intent' | 'setup_intent' | 'token' | 'charge' | 'other';
}

// Keep last 50 intercepted requests for debugging
const requestLog: InterceptedRequest[] = [];

function classifyUrl(url: string): InterceptedRequest['type'] {
  if (url.includes('payment_intents')) return 'payment_intent';
  if (url.includes('setup_intents')) return 'setup_intent';
  if (url.includes('tokens')) return 'token';
  if (url.includes('charges')) return 'charge';
  return 'other';
}

/**
 * Sets up chrome.webRequest listeners for payment API monitoring.
 */
export function setupNetworkInterceptor(): void {
  if (typeof chrome === 'undefined' || !chrome.webRequest) {
    console.log('[CODER NET] webRequest API not available, skipping interceptor');
    return;
  }

  // ── Monitor outgoing payment requests ──
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      if (details.tabId < 0) return; // Ignore non-tab requests

      const entry: InterceptedRequest = {
        url: details.url,
        method: details.method,
        tabId: details.tabId,
        timestamp: Date.now(),
        type: classifyUrl(details.url),
      };

      requestLog.push(entry);
      if (requestLog.length > 50) requestLog.shift();

      console.log(`[CODER NET] ${details.method} ${entry.type} → ${details.url.slice(0, 80)}...`);
    },
    { urls: PAYMENT_URL_PATTERNS },
    []
  );

  // ── Monitor response headers for status codes ──
  chrome.webRequest.onCompleted.addListener(
    (details) => {
      if (details.tabId < 0) return;

      const type = classifyUrl(details.url);
      const isPaymentIntent = type === 'payment_intent' || type === 'setup_intent';

      if (isPaymentIntent) {
        console.log(
          `[CODER NET] Response: ${details.statusCode} for ${type} (tab: ${details.tabId})`
        );

        // Notify the content script about the completed payment request
        // The actual result parsing happens in stripe-main.ts (MAIN world)
        try {
          chrome.tabs.sendMessage(details.tabId, {
            action: 'CODER_PAYMENT_API_COMPLETED',
            payload: {
              url: details.url,
              statusCode: details.statusCode,
              type,
            },
          }).catch(() => {});
        } catch {
          // Tab may not have content script
        }
      }
    },
    { urls: PAYMENT_URL_PATTERNS },
    []
  );

  // ── Monitor failed requests (network errors) ──
  chrome.webRequest.onErrorOccurred.addListener(
    (details) => {
      if (details.tabId < 0) return;
      const type = classifyUrl(details.url);

      if (type === 'payment_intent' || type === 'setup_intent') {
        console.warn(`[CODER NET] Payment request FAILED: ${details.error} (tab: ${details.tabId})`);
      }
    },
    { urls: PAYMENT_URL_PATTERNS }
  );

  console.log('[CODER NET] Network interceptor active — monitoring payment API calls');
}

/**
 * Returns the recent intercepted request log for debugging.
 */
export function getInterceptedRequests(): InterceptedRequest[] {
  return [...requestLog];
}
