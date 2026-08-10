/**
 * CODER System — Checkout Detector
 * 
 * Scans the current document for payment forms, input fields, and payment provider iframes.
 * Uses AI Heuristic resolver for high detection rate on any gateway.
 * 
 * Improvements:
 * - Detection cache to avoid re-scanning unchanged DOM
 * - Square, Recurly, PayPal Hosted Fields detection
 * - Faster execution with early returns
 */

import type { DetectionResult } from '../types/checkout';
import type { PaymentProvider } from '../utils/constants';
import { aiResolveCheckoutFields } from './aiFieldResolver';

// ─── Detection Cache ──────────────────────────────────────────────────────────

let cachedResult: DetectionResult | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 3000; // 3 seconds

function isCacheValid(): boolean {
  return cachedResult !== null && (Date.now() - cacheTimestamp) < CACHE_TTL_MS;
}

/**
 * Invalidate detection cache (call when DOM changes significantly)
 */
export function invalidateDetectionCache(): void {
  cachedResult = null;
  cacheTimestamp = 0;
}

// ─── Main Detection ───────────────────────────────────────────────────────────

/**
 * Scans the current document for payment checkout fields and providers.
 * Results are cached for 3 seconds to avoid redundant DOM scans.
 */
export function detectCheckoutFields(): DetectionResult {
  // Return cache if fresh
  if (isCacheValid()) {
    return cachedResult!;
  }

  // Run AI heuristic field resolver
  const finalFields = aiResolveCheckoutFields();

  // Detect provider from scripts and iframes
  const { provider, hasProtectedIframe } = detectProvider();

  // Determine if this is a checkout page
  const isPaymentUrl = /payment|payments|checkout|airwallex|add_card|billing|pay|subscribe|my\/payments|purchase|order/i.test(
    window.location.href
  );
  const hasCheckout = finalFields.length >= 1 || hasProtectedIframe || isPaymentUrl;

  const result: DetectionResult = {
    hasCheckout,
    provider,
    fields: finalFields,
    hasProtectedIframe,
    iframeNotice: hasProtectedIframe
      ? 'Payment fields are hosted inside a protected cross-origin iframe.'
      : undefined,
    detectedAt: Date.now(),
  };

  // Cache the result
  cachedResult = result;
  cacheTimestamp = Date.now();

  return result;
}

// ─── Provider Detection ───────────────────────────────────────────────────────

interface ProviderDetection {
  provider: PaymentProvider;
  hasProtectedIframe: boolean;
}

function detectProvider(): ProviderDetection {
  let detectedProvider: PaymentProvider = 'generic';
  let hasProtectedIframe = false;

  // ── 1. Global Window Checks ──
  const win = window as any;
  if (win.Stripe || win.__stripe) detectedProvider = 'stripe';
  else if (win.AdyenCheckout || win.adyen) detectedProvider = 'adyen';
  else if (win.braintree) detectedProvider = 'braintree';
  else if (win.paypal) detectedProvider = 'paypal';

  // ── 2. Script-based detection ──
  if (detectedProvider === 'generic') {
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const src = (script.getAttribute('src') || '').toLowerCase();
      
      if (src.includes('stripe.com')) {
        detectedProvider = 'stripe';
        break;
      } else if (src.includes('paypal.com') || src.includes('paypalobjects.com')) {
        detectedProvider = 'paypal';
        break;
      } else if (src.includes('braintreegateway.com') || src.includes('braintree')) {
        detectedProvider = 'braintree';
        break;
      } else if (src.includes('adyen.com')) {
        detectedProvider = 'adyen';
        break;
      } else if (src.includes('airwallex.com')) {
        detectedProvider = 'airwallex';
        break;
      } else if (src.includes('squareup.com') || src.includes('square.com')) {
        detectedProvider = 'square';
        break;
      } else if (src.includes('recurly.com')) {
        detectedProvider = 'recurly';
        break;
      }
    }
  }

  // ── 3. DOM & Class / Data attribute detection ──
  if (detectedProvider === 'generic') {
    const pageText = (document.body ? document.body.innerHTML : '').slice(0, 5000).toLowerCase();
    if (pageText.includes('adyen') || pageText.includes('adyen-checkout')) detectedProvider = 'adyen';
    else if (pageText.includes('stripe-elements') || pageText.includes('data-stripe')) detectedProvider = 'stripe';
    else if (pageText.includes('braintree')) detectedProvider = 'braintree';
  }

  // ── 4. iframe-based detection ──
  const iframes = document.querySelectorAll('iframe');
  for (const iframe of iframes) {
    const src = (iframe.getAttribute('src') || '').toLowerCase();
    const title = (iframe.getAttribute('title') || '').toLowerCase();
    const name = (iframe.getAttribute('name') || '').toLowerCase();
    const id = (iframe.getAttribute('id') || '').toLowerCase();

    const identifiers = `${src} ${title} ${name} ${id}`;

    if (identifiers.includes('stripe')) {
      hasProtectedIframe = true;
      detectedProvider = 'stripe';
    } else if (identifiers.includes('adyen')) {
      hasProtectedIframe = true;
      detectedProvider = 'adyen';
    } else if (identifiers.includes('braintree') || identifiers.includes('paypal')) {
      hasProtectedIframe = true;
      detectedProvider = identifiers.includes('braintree') ? 'braintree' : 'paypal';
    } else if (identifiers.includes('airwallex')) {
      hasProtectedIframe = true;
      detectedProvider = 'airwallex';
    } else if (identifiers.includes('square') || identifiers.includes('squareup')) {
      hasProtectedIframe = true;
      detectedProvider = 'square';
    } else if (identifiers.includes('recurly')) {
      hasProtectedIframe = true;
      detectedProvider = 'recurly';
    } else if (identifiers.includes('checkout') || identifiers.includes('payment') || identifiers.includes('card')) {
      hasProtectedIframe = true;
    }
  }

  return { provider: detectedProvider, hasProtectedIframe };
}
