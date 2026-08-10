/**
 * CODER System — Checkout Types
 * Strong, discriminated types for checkout detection, execution state,
 * payment results, and identity configuration.
 */

import type { PaymentProvider } from '../utils/constants';

// ─── Field Types ──────────────────────────────────────────────────────────────

export type FieldType =
  | 'cardNumber'
  | 'expiry'
  | 'expiryMonth'
  | 'expiryYear'
  | 'cvc'
  | 'cardholderName'
  | 'country'
  | 'state'
  | 'zipCode'
  | 'email'
  | 'address1'
  | 'address2'
  | 'city'
  | 'phone';

export interface DetectedField {
  fieldType: FieldType;
  score: number;
  selector: string;
  isIframe: boolean;
  autocomplete?: string;
  placeholder?: string;
  name?: string;
  id?: string;
  tagName: string;
}

// ─── Detection Result ─────────────────────────────────────────────────────────

export interface DetectionResult {
  hasCheckout: boolean;
  provider: PaymentProvider;
  fields: DetectedField[];
  hasProtectedIframe: boolean;
  iframeNotice?: string;
  detectedAt: number;
}

// ─── Execution State Machine ──────────────────────────────────────────────────

export type ExecutionState =
  | 'IDLE'
  | 'DETECTING'
  | 'CHECKOUT_FOUND'
  | 'READY'
  | 'FILLING'
  | 'SUBMITTING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'DECLINED'
  | 'EXPECTED_DECLINE'
  | 'REQUIRES_ACTION'
  | 'ERROR'
  | 'STOPPED'
  | 'PAUSED'
  | 'RESUMING';

// ─── Payment Results ──────────────────────────────────────────────────────────

export type PaymentResultStatus =
  | 'SUCCESS'
  | 'DECLINED'
  | 'REQUIRES_ACTION'
  | 'ERROR'
  | 'TIMEOUT'
  | 'UNKNOWN';

export interface PaymentResult {
  status: PaymentResultStatus;
  durationMs: number;
  details?: string;
  errorCode?: string;
  detectedVia: 'dom_mutation' | 'url_redirect' | 'poll' | 'network_intercept' | 'timeout' | 'immediate';
}

// ─── Session Results ──────────────────────────────────────────────────────────

export interface TestSessionResult {
  id: string;
  testCaseId: string;
  testCaseName: string;
  domain: string;
  provider: string;
  status: PaymentResultStatus;
  durationMs: number;
  errorCode?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface SessionStats {
  totalRuns: number;
  successCount: number;
  declinedCount: number;
  errorCount: number;
  threedsCount: number;
  avgDurationMs: number;
}

// ─── Identity Settings (replaces `any`) ───────────────────────────────────────

export interface IdentitySettings {
  email: string;
  billingName: string;
  phone?: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  country: string;
  zipCode?: string;
  /** Delay in seconds between stage-1 and stage-2 fill */
  delay: number;
}

export const DEFAULT_IDENTITY: IdentitySettings = {
  email: 'user@example.com',
  billingName: 'John Doe',
  phone: '9145550192',
  address1: '742 Evergreen Terrace',
  address2: 'Apt 4B',
  city: 'Springfield',
  state: 'IL',
  country: 'United States',
  zipCode: '10001',
  delay: 2,
};

// ─── Auto-Test Progress (persistence across reloads) ─────────────────────────

export interface AutoTestProgress {
  isRunning: boolean;
  currentIndex: number;
  hits: number;
  declined: number;
  threeds: number;
  startedAt: string;
  totalCards: number;
}

// ─── Hit Record ───────────────────────────────────────────────────────────────

export interface HitRecord {
  card: string;
  fullCard?: string;
  date: string;
  merchant: string;
  durationMs?: number;
  provider?: string;
}
