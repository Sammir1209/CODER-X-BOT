/**
 * CODEX(R) System — Captcha Auto-Clicker
 * 
 * Auto-detects hCaptcha, reCAPTCHA v2, and Cloudflare Turnstile checkbox frames on payment pages
 * and automatically triggers the initial "Soy humano" / "I am human" checkbox click.
 * Allows the user to only focus on solving the visual image puzzle if required.
 */

const clickedCheckboxes = new WeakSet<Element>();

export function autoClickCaptchaCheckbox(): void {
  try {
    // 1. Direct DOM Checkboxes (hCaptcha, reCAPTCHA, Turnstile in same-origin or iframe document)
    const selectors = [
      '#checkbox',
      '#anchor',
      '#recaptcha-anchor',
      '.recaptcha-checkbox-border',
      '.recaptcha-checkbox',
      '#hcaptcha-checkbox',
      'div[id="checkbox"]',
      'iframe[src*="turnstile"] input[type="checkbox"]',
      '.cf-turnstile-wrapper input',
      '[aria-label*="Soy humano"]',
      '[aria-label*="I am human"]',
      '[aria-label*="human"]'
    ];

    for (const sel of selectors) {
      const elements = document.querySelectorAll(sel);
      for (const el of elements) {
        if (clickedCheckboxes.has(el)) continue;

        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          console.log('[CODEX(R) Captcha] Auto-clicking Captcha Checkbox:', sel);
          clickedCheckboxes.add(el);
          (el as HTMLElement).click();
          // Dispatch click events for React/Vue listeners
          el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          break;
        }
      }
    }
  } catch (e) {
    console.warn('[CODEX(R) Captcha] Notice during auto-click:', e);
  }
}

/**
 * Start observing DOM mutations for dynamic Captcha popups
 */
export function startCaptchaAutoClicker(): void {
  autoClickCaptchaCheckbox();

  if (document.body) {
    const observer = new MutationObserver(() => {
      autoClickCaptchaCheckbox();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}
