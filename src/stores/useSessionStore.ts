/**
 * CODER System — Session Store
 * 
 * Zustand store for session state, test cases, domains, and stats.
 * Uses centralized storageAdapter (eliminates duplicated helpers).
 * 
 * Improvements:
 * - Centralized storage via storageAdapter
 * - Card deduplication on import
 * - Better fixture parsing (supports more delimiters)
 * - Typed with no `any`
 * - Stats include 3DS count
 */

import { create } from 'zustand';
import type { ExecutionState, TestSessionResult, SessionStats } from '../types/checkout';
import type { TestCase } from '../types/testCase';
import { detectCardBrand } from '../types/testCase';
import { storageGet, storageSet } from '../utils/storageAdapter';
import { STORAGE_KEYS } from '../utils/constants';

interface SessionStoreState {
  executionState: ExecutionState;
  currentDomain: string;
  provider: string;
  hasCheckout: boolean;
  selectedTestCase: TestCase | null;
  testCases: TestCase[];
  allowedDomains: string[];
  sessionHistory: TestSessionResult[];
  stats: SessionStats;
  soundEnabled: boolean;

  // Actions
  initializeStore: () => void;
  setExecutionState: (state: ExecutionState) => void;
  setDetectionResult: (domain: string, provider: string, hasCheckout: boolean) => void;
  setTestCases: (cases: TestCase[]) => void;
  setSelectedTestCase: (testCase: TestCase | null) => void;
  setAllowedDomains: (domains: string[]) => void;
  addDomain: (domain: string) => void;
  removeDomain: (domain: string) => void;
  addSessionResult: (result: TestSessionResult) => void;
  toggleSound: () => void;
  importRawFixtures: (rawText: string) => number;
}

const DEFAULT_PRESET_TEST_CASES: TestCase[] = [
  {
    id: 'tc-success-01',
    name: 'SUCCESS_TEST (Stripe Sandbox)',
    description: 'Valid test card expecting successful payment authorization',
    provider: 'stripe',
    environment: 'sandbox',
    expectedResult: 'SUCCESS',
    fixture: {
      number: '4242424242424242',
      expiryMonth: '12',
      expiryYear: '2028',
      cvc: '123',
      cardholderName: 'QA Test User',
      zipCode: '10001',
      country: 'US',
    },
    brand: 'VISA',
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tc-declined-01',
    name: 'DECLINED_TEST (Card Refused)',
    description: 'Test card expected to produce immediate card decline',
    provider: 'stripe',
    environment: 'sandbox',
    expectedResult: 'DECLINED',
    fixture: {
      number: '4000000000000002',
      expiryMonth: '06',
      expiryYear: '2028',
      cvc: '394',
      cardholderName: 'Declined QA User',
      zipCode: '10001',
      country: 'US',
    },
    brand: 'VISA',
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tc-3ds-01',
    name: 'THREE_DS_TEST (3DS Required)',
    description: 'Test card triggering 3D Secure challenge flow',
    provider: 'stripe',
    environment: 'sandbox',
    expectedResult: 'REQUIRES_ACTION',
    fixture: {
      number: '4000000000003155',
      expiryMonth: '08',
      expiryYear: '2028',
      cvc: '723',
      cardholderName: '3DS QA User',
      zipCode: '10001',
      country: 'US',
    },
    brand: 'VISA',
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
];

export const useSessionStore = create<SessionStoreState>((set) => ({
  executionState: 'IDLE',
  currentDomain: 'localhost',
  provider: 'Local Sandbox TEST',
  hasCheckout: false,
  selectedTestCase: DEFAULT_PRESET_TEST_CASES[0],
  testCases: DEFAULT_PRESET_TEST_CASES,
  allowedDomains: ['localhost', '127.0.0.1', 'staging.example.com'],
  sessionHistory: [],
  stats: {
    totalRuns: 0,
    successCount: 0,
    declinedCount: 0,
    errorCount: 0,
    threedsCount: 0,
    avgDurationMs: 0,
  },
  soundEnabled: true,

  initializeStore: () => {
    storageGet<TestCase[]>(STORAGE_KEYS.TEST_CASES).then((cases) => {
      if (cases && cases.length > 0) {
        set({
          testCases: cases,
          selectedTestCase: cases[0],
        });
      }
    });
  },

  setExecutionState: (state) => set({ executionState: state }),

  setDetectionResult: (domain, provider, hasCheckout) =>
    set({ currentDomain: domain, provider, hasCheckout }),

  setTestCases: (cases) => {
    set({ testCases: cases });
    storageSet(STORAGE_KEYS.TEST_CASES, cases);
  },

  setSelectedTestCase: (testCase) => set({ selectedTestCase: testCase }),

  setAllowedDomains: (domains) => set({ allowedDomains: domains }),

  addDomain: (domain) =>
    set((state) => ({
      allowedDomains: Array.from(new Set([...state.allowedDomains, domain.trim()])),
    })),

  removeDomain: (domain) =>
    set((state) => ({
      allowedDomains: state.allowedDomains.filter((d) => d !== domain),
    })),

  addSessionResult: (result) =>
    set((state) => {
      const history = [result, ...state.sessionHistory];
      const totalRuns = history.length;
      const successCount = history.filter((h) => h.status === 'SUCCESS').length;
      const declinedCount = history.filter((h) => h.status === 'DECLINED').length;
      const errorCount = history.filter((h) => h.status === 'ERROR').length;
      const threedsCount = history.filter((h) => h.status === 'REQUIRES_ACTION').length;
      const avgDurationMs = Math.round(
        history.reduce((acc, curr) => acc + curr.durationMs, 0) / totalRuns
      );

      return {
        sessionHistory: history,
        stats: { totalRuns, successCount, declinedCount, errorCount, threedsCount, avgDurationMs },
      };
    }),

  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

  importRawFixtures: (rawText) => {
    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const newCases: TestCase[] = [];
    const seenNumbers = new Set<string>();

    lines.forEach((line, idx) => {
      // Support multiple delimiters: | : , space tab
      const parts = line.split(/[|:,\s\t]+/).map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 3) {
        const [number, rawMonth, rawYear, cvc] = parts;
        const cleanNumber = number.replace(/\D/g, '');

        // Deduplication
        if (seenNumbers.has(cleanNumber)) return;
        seenNumbers.add(cleanNumber);

        const month = rawMonth.padStart(2, '0');
        let year = rawYear;
        if (year.length === 2) year = `20${year}`;

        const brand = detectCardBrand(cleanNumber);

        newCases.push({
          id: `imported-${Date.now()}-${idx}`,
          name: `[${brand}] •••• ${cleanNumber.slice(-4)} (${month}/${year})`,
          description: `Exp: ${month}/${year} | CVC: ${cvc || '123'}`,
          provider: 'generic',
          environment: 'sandbox',
          expectedResult: 'SUCCESS',
          brand,
          fixture: {
            number: cleanNumber,
            expiryMonth: month,
            expiryYear: year,
            cvc: cvc || '123',
            cardholderName: 'QA Test User',
            zipCode: '10001',
          },
          createdAt: new Date().toISOString(),
        });
      }
    });

    if (newCases.length > 0) {
      set((state) => {
        const merged = [...state.testCases, ...newCases];
        storageSet(STORAGE_KEYS.TEST_CASES, merged);
        return {
          testCases: merged,
          selectedTestCase: newCases[0],
        };
      });
    }

    return newCases.length;
  },
}));
