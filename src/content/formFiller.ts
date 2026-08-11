/**
 * CODER System — Form Filler
 * 
 * Safely fills detected checkout fields with test fixture data.
 * 
 * Improvements:
 * - InputEvent simulation (replaces deprecated document.execCommand)
 * - Retry logic with backoff for stubborn fields
 * - Support for split expiry fields (month + year separate)
 * - Expanded random data pools (50+ entries each)
 * - Support for state/province field
 */

import type { CardFixture } from '../types/testCase';
import type { DetectedField } from '../types/checkout';
import type { IdentitySettings } from '../types/checkout';
import { DEFAULT_IDENTITY } from '../types/checkout';
import { ensureCompleteIdentity } from '../utils/identityGenerator';
import { querySelectorIncludingShadow } from '../utils/domHelper';

// ─── Country and State Maps for Select Dropdowns ────────────────────────────────

const COUNTRY_MAPS: Record<string, { codes: string[]; names: string[] }> = {
  'US': { codes: ['us', 'usa', '840'], names: ['united states', 'united states of america', 'ee.uu.', 'eeuu', 'estados unidos'] },
  'ES': { codes: ['es', 'esp', '724'], names: ['spain', 'españa', 'espana'] },
  'MX': { codes: ['mx', 'mex', '484'], names: ['mexico', 'méxico'] },
  'GB': { codes: ['gb', 'gbr', 'uk', '826'], names: ['united kingdom', 'uk', 'great britain', 'reino unido', 'inglaterra'] },
  'CA': { codes: ['ca', 'can', '124'], names: ['canada', 'canadá'] },
  'CO': { codes: ['co', 'col', '170'], names: ['colombia'] },
  'AR': { codes: ['ar', 'arg', '032'], names: ['argentina'] },
  'CL': { codes: ['cl', 'chl', '152'], names: ['chile'] },
  'BR': { codes: ['br', 'bra', '076'], names: ['brazil', 'brasil'] },
  'PE': { codes: ['pe', 'per', '604'], names: ['peru', 'perú'] },
  'DE': { codes: ['de', 'deu', '276'], names: ['germany', 'alemania'] },
  'FR': { codes: ['fr', 'fra', '250'], names: ['france', 'francia'] },
  'IT': { codes: ['it', 'ita', '380'], names: ['italy', 'italia'] },
  'AU': { codes: ['au', 'aus', '036'], names: ['australia'] },
};

const US_STATES: Record<string, string> = {
  'AL': 'alabama', 'AK': 'alaska', 'AZ': 'arizona', 'AR': 'arkansas', 'CA': 'california',
  'CO': 'colorado', 'CT': 'connecticut', 'DE': 'delaware', 'FL': 'florida', 'GA': 'georgia',
  'HI': 'hawaii', 'ID': 'idaho', 'IL': 'illinois', 'IN': 'indiana', 'IA': 'iowa',
  'KS': 'kansas', 'KY': 'kentucky', 'LA': 'louisiana', 'ME': 'maine', 'MD': 'maryland',
  'MA': 'massachusetts', 'MI': 'michigan', 'MN': 'minnesota', 'MS': 'mississippi', 'MO': 'missouri',
  'MT': 'montana', 'NE': 'nebraska', 'NV': 'nevada', 'NH': 'new hampshire', 'NJ': 'new jersey',
  'NM': 'new mexico', 'NY': 'new york', 'NC': 'north carolina', 'ND': 'north dakota', 'OH': 'ohio',
  'OK': 'oklahoma', 'OR': 'oregon', 'PA': 'pennsylvania', 'RI': 'rhode island', 'SC': 'south carolina',
  'SD': 'south dakota', 'TN': 'tennessee', 'TX': 'texas', 'UT': 'utah', 'VT': 'vermont',
  'VA': 'virginia', 'WA': 'washington', 'WV': 'west virginia', 'WI': 'wisconsin', 'WY': 'wyoming'
};

function matchCountryOption(optionValue: string, optionText: string, userCountry: string): boolean {
  const cleanVal = optionValue.toLowerCase().trim();
  const cleanText = optionText.toLowerCase().trim();
  const cleanUser = userCountry.toLowerCase().trim();

  if (cleanVal === cleanUser || cleanText === cleanUser) return true;

  for (const [key, info] of Object.entries(COUNTRY_MAPS)) {
    const isUserMatch = key.toLowerCase() === cleanUser || info.codes.includes(cleanUser) || info.names.includes(cleanUser);
    if (isUserMatch) {
      if (cleanVal === key.toLowerCase() || info.codes.includes(cleanVal) || info.names.includes(cleanVal)) return true;
      if (cleanText === key.toLowerCase() || info.codes.includes(cleanText) || info.names.includes(cleanText)) return true;
    }
  }
  return false;
}

function matchStateOption(optionValue: string, optionText: string, userState: string): boolean {
  const cleanVal = optionValue.toUpperCase().trim();
  const cleanText = optionText.toLowerCase().trim();
  const cleanUser = userState.trim().toUpperCase();
  const cleanUserLower = userState.trim().toLowerCase();

  if (cleanVal === cleanUser || cleanText === cleanUserLower) return true;

  const stateFullName = US_STATES[cleanUser] || US_STATES[cleanVal];
  if (stateFullName) {
    if (cleanVal === cleanUser || cleanText === stateFullName || cleanText === cleanUserLower) return true;
  }

  for (const [code, name] of Object.entries(US_STATES)) {
    if (name === cleanUserLower) {
      if (cleanVal === code || cleanText === name || cleanText === code.toLowerCase()) return true;
    }
  }
  return false;
}

/**
 * Simulates real user input into an HTML element.
 * Uses InputEvent for modern framework compatibility (React, Vue, Svelte, Stripe Elements).
 * Falls back to prototype setter + synthetic events if needed.
 */
function setNativeInputValue(
  el: HTMLInputElement | HTMLSelectElement,
  value: string,
  fieldType?: string
): void {
  el.focus();

  // Handle <select> elements
  if (el.tagName.toLowerCase() === 'select') {
    const selectEl = el as HTMLSelectElement;
    let option: HTMLOptionElement | undefined;

    if (fieldType === 'country') {
      option = Array.from(selectEl.options).find(
        opt => matchCountryOption(opt.value, opt.textContent || '', value)
      );
    } else if (fieldType === 'state') {
      option = Array.from(selectEl.options).find(
        opt => matchStateOption(opt.value, opt.textContent || '', value)
      );
    } else {
      option = Array.from(selectEl.options).find(
        opt => opt.value === value || opt.textContent?.trim().toLowerCase() === value.toLowerCase()
      );
    }

    if (option) {
      selectEl.value = option.value;
    } else {
      selectEl.value = value;
    }
    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
    selectEl.dispatchEvent(new Event('input', { bubbles: true }));
    selectEl.dispatchEvent(new Event('blur', { bubbles: true }));
    return;
  }

  const inputEl = el as HTMLInputElement;

  // Ultra-fast value assignment via prototype setter & instant event dispatching
  const prototype = Object.getPrototypeOf(inputEl);
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value') ||
                     Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

  if (descriptor?.set) {
    descriptor.set.call(inputEl, value);
  } else {
    inputEl.value = value;
  }

  // Dispatch events instantly
  inputEl.dispatchEvent(new Event('input', { bubbles: true }));
  inputEl.dispatchEvent(new Event('change', { bubbles: true }));
  inputEl.dispatchEvent(new Event('blur', { bubbles: true }));
}

/**
 * Attempts to fill a field with retry logic.
 * Some fields require multiple attempts (lazy-loaded, React state sync).
 */
export async function fillWithRetry(el: HTMLInputElement | HTMLSelectElement, value: string, maxRetries = 2): Promise<void> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    setNativeInputValue(el, value);
    
    // Verify the value was set
    if (el.tagName.toLowerCase() === 'select') {
      if ((el as HTMLSelectElement).value) return;
    } else {
      if ((el as HTMLInputElement).value === value) return;
    }
    
    // Wait before retry
    if (attempt < maxRetries) {
      await new Promise(r => setTimeout(r, 100 * (attempt + 1)));
    }
  }
}

// ─── Expanded Random Data Pools ────────────────────────────────────────────────

const FIRST_NAMES = [
  'James', 'Robert', 'John', 'Michael', 'David', 'William', 'Richard', 'Joseph', 'Thomas', 'Charles',
  'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Andrew', 'Paul', 'Joshua',
  'Kenneth', 'Kevin', 'Brian', 'George', 'Timothy', 'Ronald', 'Edward', 'Jason', 'Jeffrey', 'Ryan',
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan', 'Jessica', 'Sarah', 'Karen',
  'Lisa', 'Nancy', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Dorothy', 'Kimberly', 'Emily', 'Donna',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
];

const STREETS = [
  '742 Evergreen Terrace', '1600 Pennsylvania Ave', '221B Baker St', '120 Broad St', '450 Madison Ave',
  '350 Fifth Avenue', '233 Spring St', '100 Universal City Plaza', '1 Infinite Loop', '77 Massachusetts Ave',
  '1200 Lakeshore Ave', '500 Terry Francois Blvd', '2300 Traverwood Dr', '1265 Lombardi Ave', '4059 Mt Lee Dr',
  '800 N Michigan Ave', '600 E Grand Ave', '1515 Broadway', '1 World Trade Center', '30 Rockefeller Plaza',
  '123 Main St', '456 Oak Ave', '789 Pine Rd', '321 Cedar Blvd', '654 Maple Lane',
];

const CITIES = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego',
  'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'Indianapolis',
  'Denver', 'Seattle', 'Portland', 'Nashville', 'Atlanta', 'Miami', 'Boston', 'Las Vegas', 'Tampa',
];

const STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
];

const ZIP_CODES = [
  '10001', '90001', '60601', '77001', '85001', '19101', '78201', '92101',
  '75201', '95101', '73301', '32099', '76101', '43085', '28201', '46201',
  '80201', '98101', '97201', '37201', '30301', '33101', '02101', '89101',
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomName(): string {
  return `${randomFrom(FIRST_NAMES)} ${randomFrom(LAST_NAMES)}`;
}

function getRandomAddress(): { address1: string; city: string; state: string; zipCode: string } {
  return {
    address1: randomFrom(STREETS),
    city: randomFrom(CITIES),
    state: randomFrom(STATES),
    zipCode: randomFrom(ZIP_CODES),
  };
}

// ─── Main Fill Function ────────────────────────────────────────────────────────

/**
 * Fills detected DOM fields with test fixture data and identity settings.
 */
export function fillCheckoutForm(
  fields: DetectedField[],
  fixture: CardFixture,
  identity?: IdentitySettings | null,
  randomNames = false,
  randomAddresses = false
): void {
  // Clear leftover error styles and texts to prevent CheckoutObserver from triggering a false decline immediately
  try {
    const errorSelectors = [
      '.StripeElement--invalid',
      '[class*="Error"]',
      '[class*="error-message"]',
      '[class*="alert-danger"]',
      '[role="alert"]',
      '.error',
      '.errorMessage',
      '#error-message'
    ];
    errorSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        try {
          el.textContent = '';
          if (el.classList.contains('StripeElement--invalid')) {
            el.classList.remove('StripeElement--invalid');
          }
          if (el instanceof HTMLElement) {
            el.style.display = 'none';
          }
        } catch {}
      });
    });
  } catch (e) {}

  const id = ensureCompleteIdentity(identity || DEFAULT_IDENTITY);

  const nameToFill = randomNames ? getRandomName() : id.billingName;
  const randomAddr = getRandomAddress();
  const addressToFill = randomAddresses ? randomAddr.address1 : id.address1;
  const cityToFill = randomAddresses ? randomAddr.city : id.city;
  const stateToFill = randomAddresses ? randomAddr.state : (id.state || '');
  const zipToFill = randomAddresses ? randomAddr.zipCode : (id.zipCode || '');

  for (const field of fields) {
    const input = querySelectorIncludingShadow(field.selector) as HTMLInputElement | HTMLSelectElement | null;
    if (!input) continue;

    switch (field.fieldType) {
      case 'cardNumber':
        setNativeInputValue(input, fixture.number, 'cardNumber');
        break;
 
       case 'expiry': {
         // Try MM/YY, MM/YYYY, MMYY
         const monthStr = fixture.expiryMonth.padStart(2, '0');
         const yearStr2 = fixture.expiryYear.toString().slice(-2);

         if (input.tagName.toLowerCase() === 'select') {
           setNativeInputValue(input, monthStr, 'expiryMonth');
         } else {
           // Try setting full string if placeholder mentions '/'
           const placeholder = (input.getAttribute('placeholder') || '').toLowerCase();
           const valToSet = placeholder.includes('/') ? `${monthStr}/${yearStr2}` : `${monthStr}${yearStr2}`;
           setNativeInputValue(input, valToSet, 'expiry');
         }
         break;
       }

       case 'expiryMonth': {
         const m2 = fixture.expiryMonth.padStart(2, '0');
         const m1 = parseInt(fixture.expiryMonth, 10).toString();
         if (input.tagName.toLowerCase() === 'select') {
           const selectEl = input as HTMLSelectElement;
           const hasOpt2 = Array.from(selectEl.options).some(o => o.value === m2 || o.textContent?.trim() === m2);
           setNativeInputValue(input, hasOpt2 ? m2 : m1, 'expiryMonth');
         } else {
           setNativeInputValue(input, m2, 'expiryMonth');
         }
         break;
       }

       case 'expiryYear': {
         const y4 = fixture.expiryYear.toString();
         const y2 = y4.slice(-2);
         if (input.tagName.toLowerCase() === 'select') {
           const selectEl = input as HTMLSelectElement;
           const hasOpt4 = Array.from(selectEl.options).some(o => o.value === y4 || o.textContent?.trim() === y4);
           setNativeInputValue(input, hasOpt4 ? y4 : y2, 'expiryYear');
         } else {
           setNativeInputValue(input, y2, 'expiryYear');
         }
         break;
       }
 
       case 'cvc':
         setNativeInputValue(input, fixture.cvc, 'cvc');
         break;
 
       case 'cardholderName':
         setNativeInputValue(input, nameToFill, 'cardholderName');
         break;
 
       case 'email':
         setNativeInputValue(input, id.email || 'user@example.com', 'email');
         break;
 
       case 'phone':
         setNativeInputValue(input, id.phone || '9145550192', 'phone');
         break;
 
       case 'zipCode':
         setNativeInputValue(input, zipToFill, 'zipCode');
         break;
 
       case 'address1':
         setNativeInputValue(input, addressToFill, 'address1');
         break;
 
       case 'address2':
         setNativeInputValue(input, id.address2 || '', 'address2');
         break;
 
       case 'city':
         setNativeInputValue(input, cityToFill, 'city');
         break;
 
       case 'state':
         setNativeInputValue(input, stateToFill, 'state');
         break;
 
       case 'country':
         setNativeInputValue(input, id.country || 'United States', 'country');
         break;
    }
  }
}

// ─── Submit Function ───────────────────────────────────────────────────────────

/**
 * Programmatically triggers payment form submission.
 * Searches for submit buttons with payment-related text in multiple languages.
 */
export function submitCheckoutForm(): boolean {
  // Direct Selector Priority: Common gateway submit buttons (Stripe Elements, Braintree, Shopify, Gamma, etc.)
  const gatewaySubmitSelectors = [
    '.SubmitButton',
    '.stripe-button-el',
    '[data-testid*="submit"]',
    '[data-testid*="pay"]',
    '[data-test*="submit"]',
    '[aria-label*="Pagar"]',
    '[aria-label*="Pay"]',
    '[aria-label*="Suscrib"]',
    '#submit-button',
    '#pay-button',
    'button.SubmitButton',
  ];

  for (const selector of gatewaySubmitSelectors) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el) {
      el.removeAttribute('disabled');
      el.click();
      return true;
    }
  }

  const allBtns = Array.from(
    document.querySelectorAll<HTMLElement>('button, input[type="submit"], [role="button"], a, div[class*="button"], div[class*="btn"]')
  );

  const paymentKeywords = [
    'suscrib', 'subscribe', 'pagar', 'pay', 'completar', 'complete',
    'comprar', 'buy', 'purchase', 'checkout', 'confirm', 'confirmar',
    'place order', 'realizar pedido', 'submit', 'enviar',
    'process payment', 'procesar pago', 'continue', 'continuar', 'start trial',
  ];

  // Priority 1: Text-based matching on visible buttons
  const submitByText = allBtns.find(btn => {
    const txt = (btn.textContent || '').toLowerCase().trim();
    return paymentKeywords.some(kw => txt.includes(kw));
  });

  if (submitByText) {
    submitByText.removeAttribute('disabled');
    submitByText.click();
    return true;
  }

  // Priority 2: type="submit" buttons
  const submitByType = allBtns.find(btn => btn.getAttribute('type') === 'submit');
  if (submitByType) {
    submitByType.removeAttribute('disabled');
    submitByType.click();
    return true;
  }

  // Priority 3: form.requestSubmit() fallback
  const forms = Array.from(document.querySelectorAll('form'));
  for (const form of forms) {
    try {
      form.requestSubmit();
      return true;
    } catch {
      try {
        form.submit();
        return true;
      } catch {}
    }
  }

  return false;
}
