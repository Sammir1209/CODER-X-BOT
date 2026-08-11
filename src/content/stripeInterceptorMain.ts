// src/content/stripeInterceptorMain.ts
// Re-implemented interceptor for Stripe API calls using MAIN world injection.
// CODEX(R) System Interceptor written in readable TypeScript.

function initStealth() {
  const desc = Object.getOwnPropertyDescriptor(Navigator.prototype, 'webdriver');
  if (desc) {
    Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => undefined, configurable: true });
  }

  // ── Anti-Radar Telemetry Spoofing v2 (m.stripe.com/6) ──
  const generateGuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

  (window as any).__CODEX_TELEMETRY = {
    muid: generateGuid(),
    guid: generateGuid(),
    sid: generateGuid(),
  };

  // Spoof localStorage Stripe Radar tokens
  try {
    const origSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function (key: string, val: string) {
      if (key.includes('stripe') || key.includes('muid') || key.includes('guid') || key.includes('sid')) {
        return origSetItem(key, generateGuid());
      }
      return origSetItem(key, val);
    };
  } catch {}

  // ── Hardware Fingerprint Masking ──
  try {
    // 1. Hardware Concurrency & Memory
    Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { get: () => 8, configurable: true });
    Object.defineProperty(Navigator.prototype, 'deviceMemory', { get: () => 8, configurable: true });
    Object.defineProperty(Navigator.prototype, 'languages', { get: () => ['es-ES', 'es', 'en-US', 'en'], configurable: true });
    Object.defineProperty(Navigator.prototype, 'plugins', {
      get: () => [
        { name: 'PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
        { name: 'Chrome PDF Viewer', filename: 'mhjfbdefakjhcfjhgbbhclfifbdfbcbp', description: '' }
      ],
      configurable: true
    });

    // 2. Screen & Color Depth
    Object.defineProperty(Screen.prototype, 'colorDepth', { get: () => 24, configurable: true });
    Object.defineProperty(Screen.prototype, 'pixelDepth', { get: () => 24, configurable: true });

    // 3. AudioContext Fingerprint Noise Injection
    if (window.AudioContext || (window as any).webkitAudioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const origCreateAnalyser = AudioCtx.prototype.createAnalyser;
      AudioCtx.prototype.createAnalyser = function() {
        const analyser = origCreateAnalyser.call(this);
        const origGetFloatFreq = analyser.getFloatFrequencyData.bind(analyser);
        analyser.getFloatFrequencyData = function(array: any) {
          origGetFloatFreq(array);
          if (array && array.length) {
            for (let i = 0; i < array.length; i += 10) {
              array[i] += (Math.random() - 0.5) * 0.0001;
            }
          }
        };
        return analyser;
      };
    }
  } catch (e) {
    console.warn('[CODEX STEALTH] Hardware spoofing notice:', e);
  }

  // ── WebGL & Canvas Noise ──
  const getParam = (orig: Function) => {
    return function(this: any, param: number) {
      if (param === 0x9245) return 'Google Inc. (NVIDIA)';
      if (param === 0x9246) return 'ANGLE (NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0)';
      return orig.call(this, param);
    };
  };
  if (window.WebGLRenderingContext) {
    WebGLRenderingContext.prototype.getParameter = getParam(WebGLRenderingContext.prototype.getParameter);
  }
  if (window.WebGL2RenderingContext) {
    WebGL2RenderingContext.prototype.getParameter = getParam(WebGL2RenderingContext.prototype.getParameter);
  }
  const origGetImg = CanvasRenderingContext2D.prototype.getImageData;
  CanvasRenderingContext2D.prototype.getImageData = function (x, y, w, h) {
    const img = origGetImg.apply(this, [x, y, w, h]);
    const data = img.data;
    for (let i = 0; i < 10; i++) {
      const idx = Math.floor(Math.random() * (data.length / 4)) * 4;
      data[idx] = (data[idx] & ~1) | (Math.random() > 0.5 ? 1 : 0);
    }
    return img;
  };
  if (!(window as any).chrome) {
    (window as any).chrome = { runtime: { id: 'codex-stealth-id', sendMessage: () => {}, connect: () => ({ onMessage: { addListener: () => {} } }) } };
  }
}

initStealth();

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

const stripeLog: StripeLogEntry[] = [];
function log(entry: StripeLogEntry) {
  stripeLog.push(entry);
  if (stripeLog.length > 200) stripeLog.shift();
  window.dispatchEvent(new CustomEvent('codex-stripe-log', { detail: entry }));
}

const originalFetch = window.fetch.bind(window);
window.fetch = async (...args) => {
  const [input, init] = args;
  const url = typeof input === 'string' ? input : (input as Request).url;
  const method = init?.method?.toUpperCase() ?? 'GET';
  const isStripe = typeof url === 'string' && /stripe\.com/.test(url);
  if (!isStripe) return originalFetch(...args);
  log({ timestamp: new Date().toISOString(), type: 'request', url, method });
  try {
    const response = await originalFetch(...args);
    const clone = response.clone();
    clone.text().then(body => {
      try {
        const data = JSON.parse(body);
        const entry: StripeLogEntry = {
          timestamp: new Date().toISOString(),
          type: 'response',
          url,
          method,
          status: response.status,
          hasClientSecret: !!data?.client_secret,
          requires3DS: data?.status === 'requires_action' || data?.next_action?.type === 'redirect_to_url',
          error: data?.error?.message,
        };
        log(entry);
        if (url.includes('payment_intents')) {
          const result = data?.status === 'succeeded' ? 'SUCCESS' : data?.status === 'requires_action' ? 'REQUIRES_3DS' : data?.error ? 'DECLINED' : 'UNKNOWN';
          window.dispatchEvent(new CustomEvent('codex-payment-result', { detail: { result, data } }));
        }
      } catch { }
    }).catch(() => { });
    return response;
  } catch (e) {
    log({ timestamp: new Date().toISOString(), type: 'response', url, method, error: e instanceof Error ? e.message : 'Network error' });
    throw e;
  }
};

const OriginalXHR = XMLHttpRequest;
const openOrig = OriginalXHR.prototype.open;
OriginalXHR.prototype.open = function (method: string, url: string | URL, ...rest: any[]) {
  (this as any).__codex_url = typeof url === 'string' ? url : url.toString();
  (this as any).__codex_method = method;
  return openOrig.apply(this, [method, url, ...rest] as any);
};
const sendOrig = OriginalXHR.prototype.send;
OriginalXHR.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
  const xhrUrl = (this as any).__codex_url || '';
  const xhrMethod = (this as any).__codex_method || 'GET';
  const isStripe = typeof xhrUrl === 'string' && /stripe\.com/.test(xhrUrl);
  if (isStripe) {
    log({ timestamp: new Date().toISOString(), type: 'request', url: xhrUrl, method: xhrMethod.toUpperCase() });
    this.addEventListener('load', function () {
      try {
        const data = JSON.parse(this.responseText);
        const entry: StripeLogEntry = {
          timestamp: new Date().toISOString(),
          type: 'response',
          url: xhrUrl,
          method: xhrMethod.toUpperCase(),
          status: this.status,
          hasClientSecret: !!data?.client_secret,
          requires3DS: data?.status === 'requires_action',
          error: data?.error?.message,
        };
        log(entry);
      } catch { }
    });
  }
  return sendOrig.apply(this, [body]);
};

(window as any).__CODEX_STRIPE_LOG = stripeLog;
