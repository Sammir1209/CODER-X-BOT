/**
 * CODER System — Browser "Save Card?" Prompt Suppressor
 * 
 * Prevents Chrome/Brave/Edge native credit card autofill popup:
 * "¿Quieres guardar la tarjeta?" ("Do you want to save this card?")
 * 
 * Features:
 * - Overrides autocomplete attributes on all credit card inputs and forms
 * - Continuous MutationObserver to sanitize dynamically mounted inputs
 * - Capture phase event listeners on input/focus/submit
 * - Shadow DOM & iFrame support
 */

import { storageGet } from '../utils/storageAdapter';
import { STORAGE_KEYS } from '../utils/constants';

let isSuppressorActive = false;

export function sanitizeInputElement(input: HTMLInputElement): void {
  try {
    // Set attributes that Chrome/Brave respect to bypass CreditCardSaveManager
    input.setAttribute('autocomplete', 'new-password');
    input.setAttribute('aria-autocomplete', 'none');
    input.setAttribute('data-bwignore', 'true');
    input.setAttribute('data-lpignore', 'true');
    input.setAttribute('data-1p-ignore', 'true');
    input.setAttribute('data-form-type', 'other');
    
    // If input belongs to a form, set autocomplete="off" on the form too
    if (input.form) {
      input.form.setAttribute('autocomplete', 'off');
      input.form.setAttribute('data-bwignore', 'true');
      input.form.setAttribute('data-lpignore', 'true');
    }
  } catch {}
}

export function sanitizeAllInputs(root: ParentNode = document): void {
  try {
    const inputs = root.querySelectorAll<HTMLInputElement>('input');
    inputs.forEach(input => {
      const type = (input.type || '').toLowerCase();
      const name = (input.name || '').toLowerCase();
      const id = (input.id || '').toLowerCase();
      const placeholder = (input.placeholder || '').toLowerCase();
      const autocomplete = (input.getAttribute('autocomplete') || '').toLowerCase();

      const isCreditCardField = 
        /card|cc|cvv|cvc|exp|month|year|owner|holder|number|zip|postal/i.test(name) ||
        /card|cc|cvv|cvc|exp|month|year|owner|holder|number|zip|postal/i.test(id) ||
        /card|cc|cvv|cvc|exp|tarjeta|titular|vencimiento|seguridad/i.test(placeholder) ||
        /cc-/i.test(autocomplete) ||
        type === 'text' || type === 'tel' || type === 'number';

      if (isCreditCardField) {
        sanitizeInputElement(input);
      }
    });

    const forms = root.querySelectorAll<HTMLFormElement>('form');
    forms.forEach(form => {
      form.setAttribute('autocomplete', 'off');
      form.setAttribute('data-bwignore', 'true');
    });
  } catch {}
}

export async function startSaveCardSuppressor(): Promise<void> {
  if (isSuppressorActive) return;

  // Check if suppressed in storage (defaults to true)
  const isEnabled = await storageGet<boolean>(STORAGE_KEYS.SUPPRESS_SAVE_CARD_PROMPT);
  if (isEnabled === false) return; // Only skip if explicitly set to false

  isSuppressorActive = true;

  // Initial pass
  sanitizeAllInputs(document);

  // 1. Capture-phase event listeners to continuously block Chromium credit card save heuristics
  const captureEvents = ['focusin', 'focus', 'input', 'change', 'submit', 'click'];
  captureEvents.forEach(eventType => {
    window.addEventListener(
      eventType,
      (e: Event) => {
        const target = e.target as HTMLElement;
        if (target && target.tagName === 'INPUT') {
          sanitizeInputElement(target as HTMLInputElement);
        } else if (target && target.tagName === 'FORM') {
          sanitizeAllInputs(target);
        } else {
          sanitizeAllInputs(document);
        }
      },
      { capture: true, passive: true }
    );
  });

  // 2. MutationObserver for dynamic React/Vue/Stripe/iFrame DOM updates
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          if (el.tagName === 'INPUT') {
            sanitizeInputElement(el as HTMLInputElement);
          } else {
            sanitizeAllInputs(el);
          }
        }
      }
    }
  });

  if (document.documentElement) {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }
}
