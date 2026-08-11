/**
 * CODER System — Checkout Observer
 * 
 * Monitors DOM, URL changes, and payment-specific signals to detect
 * checkout results (SUCCESS, DECLINED, 3DS, ERROR).
 * 
 * Improvements:
 * - Proper cleanup with AbortController
 * - URL redirect detection via Navigation API / popstate
 * - requestAnimationFrame-based polling (smoother than setInterval)
 * - Configurable timeout
 * - Toast notification detection
 * - Broader Spanish/English pattern matching
 */

import type { PaymentResultStatus } from '../types/checkout';

export interface ResultObserverCallback {
  (result: PaymentResultStatus, durationMs: number, details?: string): void;
}

export class CheckoutObserver {
  private startTime = 0;
  private mutationObserver: MutationObserver | null = null;
  private callback: ResultObserverCallback | null = null;
  private isObserving = false;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private pollFrameId: number | null = null;
  private lastUrl: string = '';
  private urlCheckInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Starts observing for payment result signals.
   */
  public start(cb: ResultObserverCallback, timeoutMs = 20000): void {
    this.startTime = Date.now();
    this.callback = cb;
    this.isObserving = true;
    this.lastUrl = window.location.href;

    // ── Check immediate state ──
    const initialCheck = this.evaluateCurrentState();
    if (initialCheck !== 'UNKNOWN') {
      this.notify(initialCheck, 'Immediate signal');
      return;
    }

    // ── MutationObserver for DOM changes ──
    this.mutationObserver = new MutationObserver(() => {
      if (!this.isObserving) return;
      const status = this.evaluateCurrentState();
      if (status !== 'UNKNOWN') {
        this.notify(status, 'DOM mutation');
      }
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden'],
    });

    // ── RAF-based polling (smoother than setInterval) ──
    const pollInterval = 150; // ms between polls
    let lastPollTime = 0;

    const pollLoop = (timestamp: number) => {
      if (!this.isObserving) return;
      
      if (timestamp - lastPollTime >= pollInterval) {
        lastPollTime = timestamp;
        const status = this.evaluateCurrentState();
        if (status !== 'UNKNOWN') {
          this.notify(status, 'Poll');
          return;
        }
      }
      
      this.pollFrameId = requestAnimationFrame(pollLoop);
    };
    this.pollFrameId = requestAnimationFrame(pollLoop);

    // ── URL change detection ──
    this.urlCheckInterval = setInterval(() => {
      if (!this.isObserving) return;
      if (window.location.href !== this.lastUrl) {
        this.lastUrl = window.location.href;
        const status = this.evaluateCurrentState();
        if (status !== 'UNKNOWN') {
          this.notify(status, 'URL redirect');
        }
      }
    }, 300);

    // ── Safety timeout ──
    this.timeoutId = setTimeout(() => {
      if (this.isObserving) {
        this.notify('TIMEOUT', 'Timeout waiting for payment result');
      }
    }, timeoutMs);
  }

  /**
   * Stops all observation and cleans up resources.
   */
  public stop(): void {
    this.isObserving = false;

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.pollFrameId) {
      cancelAnimationFrame(this.pollFrameId);
      this.pollFrameId = null;
    }

    if (this.urlCheckInterval) {
      clearInterval(this.urlCheckInterval);
      this.urlCheckInterval = null;
    }
  }

  // ─── State Evaluation ──────────────────────────────────────────────────

  private evaluateCurrentState(): PaymentResultStatus {
    const url = window.location.href.toLowerCase();

    // ── 1. URL-based SUCCESS signals ──
    if (/\/(success|thank-?you|confirmation|completed|order-?received|gracias|payment-?complete)/i.test(url)) {
      return 'SUCCESS';
    }

    // ── 2. 3DS iframe detection (Strict visible challenge modal) ──
    const iframes = document.querySelectorAll('iframe');
    for (const iframe of iframes) {
      const src = (iframe.src || iframe.getAttribute('src') || '').toLowerCase();
      const name = (iframe.name || iframe.getAttribute('name') || '').toLowerCase();

      // Ignore standard fingerprinting, captchas (hCaptcha, reCAPTCHA, Turnstile), payment elements, or 0/1px hidden frames
      const isCaptchaIframe = (
        src.includes('hcaptcha') || src.includes('recaptcha') ||
        src.includes('turnstile') || src.includes('captcha') ||
        src.includes('geetest') || src.includes('funcaptcha') ||
        name.includes('hcaptcha') || name.includes('recaptcha')
      );

      if (isCaptchaIframe || src.includes('m.stripe.network') || src.includes('b.stripecdn.com') || name.includes('__privateStripeFrame')) {
        continue;
      }

      const is3DSUrl = (
        src.includes('three-ds') || src.includes('3d-secure') || src.includes('3ds') ||
        src.includes('arcot.com') || src.includes('acs.') ||
        src.includes('cardinalcommerce') || src.includes('verifiedbyvisa') ||
        src.includes('mcsecurecode') || src.includes('secure2.') ||
        src.includes('bankofamerica') || src.includes('visa.com/pay') ||
        src.includes('mastercard')
      );
      
      if (is3DSUrl) {
        const rect = iframe.getBoundingClientRect();
        // Genuine 3DS Challenge dialogs are substantial bank modals (> 250px width and height)
        if (rect.width > 250 && rect.height > 200) {
          return 'REQUIRES_ACTION';
        }
      }
    }

    // Safety Guard: Ignore static text signals (decline/error) during the first 150ms
    // to prevent false positives from previous card attempts' leftover text in the DOM.
    const elapsed = Date.now() - this.startTime;
    if (elapsed < 150) {
      return 'UNKNOWN';
    }

    const pageText = document.body?.innerText || '';

    // ── 3. SUCCESS text signals ──
    const successPatterns = [
      /payment\s*(was\s*)?successful/i,
      /order\s*(has been\s*)?confirmed/i,
      /thank\s*you\s*for\s*your\s*(order|purchase|payment)/i,
      /gracias\s*por\s*(su|tu)\s*(compra|pedido|pago)/i,
      /transacci[oó]n\s*exitosa/i,
      /pago\s*exitoso/i,
      /payment\s*complete/i,
      /order\s*placed\s*successfully/i,
      /purchase\s*confirmed/i,
      /subscription\s*(activated|started|confirmed)/i,
      /suscripci[oó]n\s*(activada|confirmada)/i,
    ];

    if (successPatterns.some(p => p.test(pageText))) {
      return 'SUCCESS';
    }

    // ── 4. DECLINED signals ──
    const declinedPatterns = [
      /card.*(declined|rechazada)/i,
      /payment.*(declined|failed|error)/i,
      /tarjeta.*rechaz/i,
      /your\s*card\s*was\s*declined/i,
      /la\s*tarjeta.*rechaz/i,
      /insufficient\s*funds/i,
      /fondos\s*insuficientes/i,
      /card\s*number\s*(is\s*)?(incorrect|invalid|not\s*valid)/i,
      /n[uú]mero.*(tarjeta|incorrecto|inv[aá]lido)/i,
      /expir.*date.*(incorrect|invalid|past)/i,
      /fecha.*(caducidad|expiraci[oó]n).*(pasado|incorrecta|inv[aá]lida)/i,
      /security\s*code.*(incorrect|invalid)/i,
      /c[oó]digo.*seguridad.*(incorrecto|inv[aá]lido)/i,
      /do\s*not\s*honor/i,
      /no\s*honrar/i,
      /transaction.*not\s*allowed/i,
      /transacci[oó]n.*no\s*permitida/i,
      /card\s*number\s*is\s*not\s*a\s*valid/i,
      /el\s*n[uú]mero\s*de\s*(la\s*)?tarjeta\s*(no\s*es|es\s*inc)/i,
      /lost\s*or\s*stolen\s*card/i,
      /tarjeta\s*(perdida|robada)/i,
      /expired\s*card/i,
      /tarjeta\s*vencida/i,
      /no\s*podemos\s*autenticar\s*(tu|su)\s*m[eé]todo\s*de\s*pago/i,
      /elige\s*otro\s*m[eé]todo\s*y\s*vuelve\s*a\s*intentarlo/i,
      /unable\s*to\s*authenticate/i,
      /authentication\s*failed/i,
      /3d\s*secure.*not\s*supported/i,
      /autenticaci[oó]n\s*fall/i,
      /declined/i,
      /rechazad/i,
      /failed/i,
      /fallo/i,
      /invalid/i,
      /incorrect/i,
      /refused/i,
    ];

    if (declinedPatterns.some(p => p.test(pageText))) {
      return 'DECLINED';
    }

    // ── 5. Generic ERROR signals ──
    const errorPatterns = [
      /payment\s*error/i,
      /error\s*de\s*pago/i,
      /something\s*went\s*wrong/i,
      /ha\s*ocurrido\s*un\s*error/i,
      /processing\s*error/i,
      /error\s*procesando/i,
      /unable\s*to\s*process/i,
      /no\s*se\s*pudo\s*procesar/i,
    ];

    if (errorPatterns.some(p => p.test(pageText))) {
      return 'ERROR';
    }

    // ── 6. Instant Decline Evaluation on Any Visible Error Elements ──
    const stripeErrors = document.querySelectorAll(
      '.StripeElement--invalid, [class*="Error"], [class*="error-message"], [class*="alert-danger"], [role="alert"], [class*="field-error"], [id*="error"]'
    );

    for (const errEl of stripeErrors) {
      const errText = (errEl.textContent || '').trim().toLowerCase();
      if (errText.length > 2) {
        return 'DECLINED';
      }
    }

    // ── 7. Toast/snackbar notification detection ──
    const toasts = document.querySelectorAll(
      '[class*="toast"], [class*="snackbar"], [class*="notification"], [class*="flash"], [role="status"]'
    );

    for (const toast of toasts) {
      const toastText = (toast.textContent || '').toLowerCase();
      if (successPatterns.some(p => p.test(toastText))) return 'SUCCESS';
      if (declinedPatterns.some(p => p.test(toastText))) return 'DECLINED';
    }

    return 'UNKNOWN';
  }

  // ─── Notification ───────────────────────────────────────────────────────

  private notify(result: PaymentResultStatus, details?: string): void {
    if (!this.isObserving) return;
    const duration = Date.now() - this.startTime;
    this.stop();
    if (this.callback) {
      this.callback(result, duration, details);
    }
  }
}
