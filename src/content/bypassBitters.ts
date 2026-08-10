// src/content/bypassBitters.ts
// Utilities for advanced Stripe bypass ("bitters")
// Includes fingerprint rotation, header spoofing, and token injection.

/** Rotate user‑agent and other fingerprint headers randomly. */
export function rotateFingerprint(): void {
  const uas = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  ];
  const ua = uas[Math.floor(Math.random() * uas.length)];
  Object.defineProperty(navigator, 'userAgent', { get: () => ua, configurable: true });
  Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'], configurable: true });
  Object.defineProperty(navigator, 'platform', { get: () => 'Win32', configurable: true });
}

/** Inject a dummy Stripe token into hidden inputs of a form. */
export function injectDummyToken(form: HTMLFormElement): void {
  form.querySelectorAll('input[type="hidden"]').forEach(input => {
    const el = input as HTMLInputElement;
    if (el.name && el.name.toLowerCase().includes('token')) {
      el.value = 'tok_' + Math.random().toString(36).substring(2, 15);
    }
  });
}

/** Apply full bypass: fingerprint rotation + token injection. */
export function applyBittersBypass(form: HTMLFormElement): void {
  rotateFingerprint();
  injectDummyToken(form);
}
