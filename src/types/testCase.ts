/**
 * CODER System — Test Case Types
 * Card fixtures, test cases, import DTOs, and card brand detection.
 */

import type { PaymentResultStatus } from './checkout';
import type { PaymentProvider, CardBrand } from '../utils/constants';

// ─── Card Fixture ─────────────────────────────────────────────────────────────

export interface CardFixture {
  number: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
  cardholderName: string;
  zipCode?: string;
  country?: string;
  state?: string;
  phone?: string;
}

// ─── Test Case ────────────────────────────────────────────────────────────────

export interface TestCase {
  id: string;
  name: string;
  description: string;
  provider: PaymentProvider;
  environment: 'sandbox' | 'staging' | 'local' | 'live';
  expectedResult: PaymentResultStatus;
  fixture: CardFixture;
  brand?: CardBrand;
  isPreset?: boolean;
  createdAt: string;
}

// ─── Import DTOs ──────────────────────────────────────────────────────────────

export interface ImportTestCaseDTO {
  name: string;
  description?: string;
  provider?: PaymentProvider;
  expectedResult?: PaymentResultStatus;
  /** Raw fixture string, e.g. "5549006001718414|06|2028|394" */
  rawFixture: string;
}

// ─── Test Run Result (for session history) ────────────────────────────────────

export interface TestRunResult {
  testCaseId: string;
  cardLast4: string;
  brand: CardBrand;
  result: PaymentResultStatus;
  durationMs: number;
  merchant: string;
  provider: PaymentProvider;
  timestamp: string;
  errorDetails?: string;
}

// ─── Card Brand Detection ─────────────────────────────────────────────────────

export function detectCardBrand(number: string): CardBrand {
  const clean = number.replace(/\D/g, '');
  if (clean.startsWith('4')) return 'VISA';
  if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return 'MASTERCARD';
  if (/^3[47]/.test(clean)) return 'AMEX';
  if (/^6011|^65|^64[4-9]/.test(clean)) return 'DISCOVER';
  if (/^3(?:0[0-5]|[68])/.test(clean)) return 'DINERS';
  if (/^35(?:2[89]|[3-8])/.test(clean)) return 'JCB';
  if (/^62/.test(clean)) return 'UNIONPAY';
  return 'GENERIC';
}

// ─── Luhn Validator ───────────────────────────────────────────────────────────

export function isValidLuhn(number: string): boolean {
  const digits = number.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}
