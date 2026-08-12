/**
 * CODER System — Stripe MAIN World Interceptor
 * 
 * Injected in "MAIN" world at document_start to share execution context
 * with the page's JavaScript. Intercepts Stripe API calls for:
 * - Payment intent response monitoring
 * - 3DS client_secret capture
 * - Error response detection
 * - Structured logging of all Stripe network activity
 */

(() => {
  // Guard against multiple injections
  if ((window as any).__CODEX_INTERCEPTOR_LOADED) {
    console.log('[CODEX(R)] Interceptor already loaded, exiting.');
    return;
  }
  (window as any).__CODEX_INTERCEPTOR_LOADED = true;
  // Only log in top window to avoid duplicate messages in iframes
  if (window === window.top) {
    console.log('[CODEX(R)] Stripe MAIN World Interceptor v1.1 loaded');
  }

  // ─── Stripe Stealth & Radar Anti-Detection Suite ────────────────────────────────
  try {
    // 1. Webdriver Anti-Detection
    const webdriverDesc = Object.getOwnPropertyDescriptor(Navigator.prototype, 'webdriver');
    if (webdriverDesc) {
      Object.defineProperty(Navigator.prototype, 'webdriver', {
        get: () => undefined,
        configurable: true
      });
    }

    // 2. WebGL Fingerprint Spoofing (Report standard NVIDIA graphics card instead of SwiftShader)
    const getParameterProxy = function (originalGetParameter: Function) {
      return function (this: WebGLRenderingContext | WebGL2RenderingContext, parameter: number) {
        // 0x9245 = UNMASKED_VENDOR_WEBGL, 0x9246 = UNMASKED_RENDERER_WEBGL
        if (parameter === 0x9245) {
          return 'Google Inc. (NVIDIA)';
        }
        if (parameter === 0x9246) {
          return 'ANGLE (NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0)';
        }
        return originalGetParameter.apply(this, [parameter]);
      };
    };

    if (window.WebGLRenderingContext) {
      WebGLRenderingContext.prototype.getParameter = getParameterProxy(WebGLRenderingContext.prototype.getParameter);
    }
    if (window.WebGL2RenderingContext) {
      WebGL2RenderingContext.prototype.getParameter = getParameterProxy(WebGL2RenderingContext.prototype.getParameter);
    }

    // 3. Canvas Fingerprint Noise Injection (Defeats hash-based tracking by slightly modifying pixels)
    const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    CanvasRenderingContext2D.prototype.getImageData = function (this: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, settings?: ImageDataSettings) {
      try {
        // Ensure canvas has willReadFrequently attribute hint if canvas context exists
        if (this.canvas && typeof (this.canvas as any).getContext === 'function') {
          const ctx = (this.canvas as any).getContext('2d', { willReadFrequently: true });
          if (ctx && ctx !== this && ctx.getImageData) {
            return ctx.getImageData(x, y, w, h, settings);
          }
        }
      } catch {}

      const imageData = originalGetImageData.apply(this, [x, y, w, h, settings] as any);
      const data = imageData.data;
      // Add micro-noise to the least significant bits of 10 random pixels
      for (let i = 0; i < 10; i++) {
        const idx = Math.floor(Math.random() * (data.length / 4)) * 4;
        data[idx] = (data[idx] & ~1) | (Math.random() > 0.5 ? 1 : 0); // Red channel LSB
      }
      return imageData;
    };

    // 4. Chrome Runtime mock to bypass headless checkouts
    if (!(window as any).chrome) {
      (window as any).chrome = {
        runtime: {
          id: 'chrome-stealth-bypass-id',
          sendMessage: () => {},
          connect: () => ({ onMessage: { addListener: () => {} } }),
        }
      };
    }

    // 5. Hide automation flags on document
    const documentFlags = ['__webdriver_evaluate', '__selenium_evaluate', '__webdriver_script_fn', '__webdriver_unwrapped'];
    documentFlags.forEach(flag => {
      try {
        Object.defineProperty(document, flag, { get: () => undefined, configurable: true });
      } catch {}
    });

    console.log('[CODEX(R)] Stripe Stealth Radar Bypass enabled successfully');
  } catch (e) {
    console.error('[CODEX(R)] Failed to load stealth suite:', e);
  }

  // ─── Structured Log ──────────────────────────────────────────────────────────

  interface StripeLogEntry {
    timestamp: string;
    type: 'request' | 'response';
    url: string;
    method: string;
    status?: number;
    hasClientSecret?: boolean;
    requires3DS?: boolean;
    error?: string;
  }

  const mainStripeLog: StripeLogEntry[] = [];

  function logMainStripeActivity(entry: StripeLogEntry) {
    mainStripeLog.push(entry);
    // Keep last 100 entries
    if (mainStripeLog.length > 100) {
      mainStripeLog.shift();
    }
    // Post to content script world via CustomEvent
    try {
      window.dispatchEvent(new CustomEvent('CODER-stripe-intercept', {
        detail: entry,
      }));
    } catch {
      // Cross-world communication may fail silently
    }
  }

  // ─── Fetch Interceptor ────────────────────────────────────────────────────────

  const originalFetchMain = window.fetch;

  window.fetch = async function (...args: Parameters<typeof fetch>): Promise<Response> {
    const [input, init] = args;
    const url = typeof input === 'string' ? input : (input as Request).url;
    const method = init?.method || 'GET';

    // Only intercept Stripe API calls
    const isStripeCall = typeof url === 'string' && (
      url.includes('api.stripe.com') ||
      url.includes('stripe.com/v1') ||
      url.includes('checkout.stripe.com')
    );

    if (!isStripeCall) {
      return originalFetchMain(...args);
    }

    logMainStripeActivity({
      timestamp: new Date().toISOString(),
      type: 'request',
      url: typeof url === 'string' ? url : 'unknown',
      method: method.toUpperCase(),
    });

    try {
      const response = await originalFetchMain(...args);

      // Clone response to read body without consuming it
      const cloned = response.clone();
      
      cloned.text().then(bodyText => {
        try {
          const data = JSON.parse(bodyText);
          
          const entry: StripeLogEntry = {
            timestamp: new Date().toISOString(),
            type: 'response',
            url: typeof url === 'string' ? url : 'unknown',
            method: method.toUpperCase(),
            status: response.status,
            hasClientSecret: !!data?.client_secret,
            requires3DS: data?.status === 'requires_action' || data?.next_action?.type === 'redirect_to_url',
          };

          if (data?.error) {
            entry.error = data.error.message || data.error.code || 'Unknown Stripe error';
          }

          logMainStripeActivity(entry);
          processStripeResponse(url, data);

        } catch {
          // Non-JSON response, ignore
        }
      }).catch(() => { });

      return response;
    } catch (err) {
      logMainStripeActivity({
        timestamp: new Date().toISOString(),
        type: 'response',
        url: typeof url === 'string' ? url : 'unknown',
        method: method.toUpperCase(),
        error: err instanceof Error ? err.message : 'Network error',
      });
      throw err;
    }
  };

  // ─── Process Stripe API Result ──────────────────────────────────────────────

  function processStripeResponse(url: string, data: any): void {
    if (!data || typeof data !== 'object') return;

    const urlStr = typeof url === 'string' ? url : '';

    // 3DS failure endpoint (3ds2/authenticate returning error)
    if (urlStr.includes('/3ds2/authenticate') && (data.error || data.state === 'failed')) {
      const errMsg = data.error?.message || '3DS authentication failed';
      console.log('[CODEX(R) Interceptor] ❌ Stripe 3DS Failed on:', urlStr, errMsg);
      window.dispatchEvent(new CustomEvent('CODEX-payment-result', { detail: { result: 'DECLINED', error: errMsg } }));
      return;
    }

    if (data.status === 'succeeded') {
      console.log('[CODEX(R) Interceptor] ✅ Stripe SUCCEEDED on:', urlStr);
      window.dispatchEvent(new CustomEvent('CODEX-payment-result', { detail: { result: 'SUCCESS' } }));
    } else if (data.status === 'requires_action' || data.next_action?.type === 'redirect_to_url') {
      console.log('[CODEX(R) Interceptor] ⚠️ Stripe REQUIRES 3DS on:', urlStr);
      window.dispatchEvent(new CustomEvent('CODEX-payment-result', { detail: { result: 'REQUIRES_ACTION' } }));
    } else if (data.error) {
      const errMsg = data.error.message || data.error.code || 'Stripe card error';
      console.log('[CODEX(R) Interceptor] ❌ Stripe DECLINED on:', urlStr, errMsg);
      window.dispatchEvent(new CustomEvent('CODEX-payment-result', { detail: { result: 'DECLINED', error: errMsg } }));
    }
  }

  // ─── XMLHttpRequest Interceptor ───────────────────────────────────────────────

  const OriginalXHRMain = XMLHttpRequest;
  const originalOpenMain = OriginalXHRMain.prototype.open;
  const originalSendMain = OriginalXHRMain.prototype.send;

  OriginalXHRMain.prototype.open = function (method: string, url: string | URL, ...rest: any[]) {
    (this as any).__CODER_url = typeof url === 'string' ? url : url.toString();
    (this as any).__CODER_method = method;
    return originalOpenMain.apply(this, [method, url, ...rest] as any);
  };

  OriginalXHRMain.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
    const xhrUrl = (this as any).__CODER_url || '';
    const xhrMethod = (this as any).__CODER_method || 'GET';

    const isStripe = typeof xhrUrl === 'string' && (
      xhrUrl.includes('api.stripe.com') ||
      xhrUrl.includes('stripe.com/v1')
    );

    if (isStripe) {
      logMainStripeActivity({
        timestamp: new Date().toISOString(),
        type: 'request',
        url: xhrUrl,
        method: xhrMethod.toUpperCase(),
      });

      this.addEventListener('load', function () {
        try {
          const data = JSON.parse(this.responseText);
          logMainStripeActivity({
            timestamp: new Date().toISOString(),
            type: 'response',
            url: xhrUrl,
            method: xhrMethod.toUpperCase(),
            status: this.status,
            hasClientSecret: !!data?.client_secret,
            requires3DS: data?.status === 'requires_action',
            error: data?.error?.message,
          });
          processStripeResponse(xhrUrl, data);
        } catch {
          // Non-JSON
        }
      });
    }

    return originalSendMain.apply(this, [body]);
  };

  // ─── Expose API for Content Script ────────────────────────────────────────────

  (window as any).__CODER_STRIPE_LOG = mainStripeLog;
})();
