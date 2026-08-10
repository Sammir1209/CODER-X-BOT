/**
 * CODEX(R) System — Messaging Types
 * Discriminated union types for ALL messages exchanged between:
 * - Content Script ↔ Background (Service Worker)
 * - Popup ↔ Background
 * - Content Script ↔ Content Script (cross-frame)
 * 
 * Eliminates all `any` types in message handlers.
 */

import type { DetectionResult, PaymentResultStatus, IdentitySettings } from './checkout';
import type { CardFixture, TestCase } from './testCase';

// ─── Content Script → Background Messages ─────────────────────────────────────

export type ContentToBackgroundMessage =
  | { action: 'PAYMENT_RESULT_DETECTED'; payload: PaymentResultPayload }
  | { action: 'CODEX_AI_SCAN_FORM' }
  | { action: 'GET_SESSION_STATE' }
  | { action: 'STOP_SESSION' }
  | { action: 'RESET_SESSION' };

export interface PaymentResultPayload {
  result: PaymentResultStatus;
  durationMs: number;
  details?: string;
}

// ─── Background → Content Script Messages ──────────────────────────────────────

export type BackgroundToContentMessage =
  | { action: 'PING' }
  | { action: 'DETECT_FIELDS' }
  | { action: 'FILL_FORM'; payload: FillFormPayload }
  | { action: 'SUBMIT_FORM' }
  | { action: 'OBSERVE_RESULT' }
  | { action: 'STOP_OBSERVING' };

export interface FillFormPayload {
  fixture: CardFixture;
  identity?: IdentitySettings;
  randomNames?: boolean;
  randomAddresses?: boolean;
}

// ─── Popup → Background Messages ───────────────────────────────────────────────

export type PopupToBackgroundMessage =
  | { action: 'GET_SESSION_STATE' }
  | { action: 'SET_ALLOWED_DOMAINS'; payload: { domains: string[] } }
  | { action: 'START_DETECTION'; payload: { tabId?: number; domain: string } }
  | { action: 'EXECUTE_TEST_CASE'; payload: ExecuteTestCasePayload }
  | { action: 'STOP_SESSION' }
  | { action: 'RESET_SESSION' };

export interface ExecuteTestCasePayload {
  tabId?: number;
  testCase: TestCase;
}

// ─── Universal Message (any direction) ─────────────────────────────────────────

export type CODEXMessage =
  | ContentToBackgroundMessage
  | BackgroundToContentMessage
  | PopupToBackgroundMessage;

// ─── Standard Responses ────────────────────────────────────────────────────────

export interface SuccessResponse<T = unknown> {
  success: true;
  data?: T;
  status?: string;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
}

export type CODEXResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

// ─── Detection Response ────────────────────────────────────────────────────────

export type DetectionResponse = CODEXResponse<DetectionResult>;
export type FillFormResponse = CODEXResponse<void>;
export type SubmitFormResponse = CODEXResponse<{ submitted: boolean }>;

// ─── Type Guards ───────────────────────────────────────────────────────────────

export function isSuccessResponse<T>(res: CODEXResponse<T>): res is SuccessResponse<T> {
  return res.success === true;
}

export function isErrorResponse(res: CODEXResponse): res is ErrorResponse {
  return res.success === false;
}
