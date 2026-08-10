/**
 * CODER System — Auto Test Runner
 * 
 * Extracted from the monolithic content/index.ts into a clean, state-machine-driven class.
 * Handles the full auto-test loop: IDLE → FILLING → SUBMITTING → WAITING → RESULT → NEXT
 * 
 * Features:
 * - AbortController for instant cancellation
 * - Event-driven architecture (callbacks for each state transition)
 * - Configurable delays, timeouts, retry
 * - Persistence across page reloads
 * - Rate limiting (prevents double-start)
 */

import { detectCheckoutFields } from './detector';
import { fillCheckoutForm, submitCheckoutForm } from './formFiller';
import { CheckoutObserver } from './checkoutObserver';
import { ToastNotification } from './toastNotification';
import { addActivityLog } from '../utils/activityLogger';
import type { TestCase } from '../types/testCase';
import type { IdentitySettings, AutoTestProgress, ExecutionState, PaymentResultStatus } from '../types/checkout';
import { DEFAULT_IDENTITY } from '../types/checkout';
import { storageGet, storageSet, storageRemove, storageGetMultiple } from '../utils/storageAdapter';
import { STORAGE_KEYS, TIMING } from '../utils/constants';

// ─── Runner Events ────────────────────────────────────────────────────────────

export interface RunnerCallbacks {
  onStateChange: (state: ExecutionState, data?: RunnerStateData) => void;
  onCardStart: (index: number, total: number, maskedCard: string) => void;
  onCardResult: (index: number, result: PaymentResultStatus, durationMs: number) => void;
  onHit: (card: TestCase, maskedCard: string) => void;
  onComplete: (stats: RunnerStats) => void;
  onError: (error: string) => void;
}

export interface RunnerStateData {
  currentIndex?: number;
  totalCards?: number;
  maskedCard?: string;
  result?: PaymentResultStatus;
}

export interface RunnerStats {
  hits: number;
  declined: number;
  threeds: number;
  totalTested: number;
  totalCards: number;
}

// ─── Auto Test Runner Class ───────────────────────────────────────────────────

export class AutoTestRunner {
  private cards: TestCase[] = [];
  private currentIndex = 0;
  private isRunning = false;
  private isPaused = false;
  private abortController: AbortController | null = null;
  private callbacks: RunnerCallbacks;

  // Stats
  private hits = 0;
  private declined = 0;
  private threeds = 0;

  // Settings
  private identity: IdentitySettings = DEFAULT_IDENTITY;
  private randomNames = false;
  private randomAddresses = false;

  constructor(callbacks: RunnerCallbacks) {
    this.callbacks = callbacks;
  }

  // ─── Public API ───────────────────────────────────────────────────────

  public async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('[CODER Runner] Already running, ignoring duplicate start');
      return;
    }

    // Load settings from storage
    const settings = await storageGetMultiple<Record<string, unknown>>([
      STORAGE_KEYS.TEST_CASES,
      STORAGE_KEYS.IDENTITY,
      STORAGE_KEYS.RANDOM_NAMES,
      STORAGE_KEYS.RANDOM_ADDRESSES,
      STORAGE_KEYS.AUTO_PROGRESS,
    ]);

    this.cards = (settings[STORAGE_KEYS.TEST_CASES] as TestCase[]) || [];
    this.identity = (settings[STORAGE_KEYS.IDENTITY] as IdentitySettings) || DEFAULT_IDENTITY;
    this.randomNames = (settings[STORAGE_KEYS.RANDOM_NAMES] as boolean) || false;
    this.randomAddresses = (settings[STORAGE_KEYS.RANDOM_ADDRESSES] as boolean) || false;

    if (this.cards.length === 0) {
      this.callbacks.onError('No hay tarjetas cargadas. Importa BINs o CCs primero.');
      return;
    }

    // Check for saved progress (resume after 3DS pause or page reload)
    const savedProgress = settings[STORAGE_KEYS.AUTO_PROGRESS] as AutoTestProgress | null;
    if (savedProgress && typeof savedProgress.currentIndex === 'number' && savedProgress.currentIndex < this.cards.length) {
      this.currentIndex = savedProgress.currentIndex;
      this.hits = savedProgress.hits || 0;
      this.declined = savedProgress.declined || 0;
      this.threeds = savedProgress.threeds || 0;
      console.log(`[CODER Runner] Resuming from card #${this.currentIndex + 1}`);
    } else {
      this.currentIndex = 0;
      this.hits = 0;
      this.declined = 0;
      this.threeds = 0;
    }

    this.isRunning = true;
    this.isPaused = false;
    this.abortController = new AbortController();

    this.callbacks.onStateChange('FILLING', {
      totalCards: this.cards.length,
      currentIndex: this.currentIndex,
    });

    await this.runLoop();
  }

  public stop(): void {
    console.log('[CODER Runner] Stop requested');
    this.isRunning = false;
    this.isPaused = false;
    this.abortController?.abort();
    this.abortController = null;
    this.callbacks.onStateChange('IDLE');
    storageRemove(STORAGE_KEYS.AUTO_PROGRESS);
  }

  public pause(): void {
    if (!this.isRunning) return;
    this.isPaused = !this.isPaused;
    this.callbacks.onStateChange(this.isPaused ? 'PAUSED' : 'FILLING');
    console.log(`[CODER Runner] ${this.isPaused ? 'Paused' : 'Resumed'}`);
  }

  public skip(): void {
    if (!this.isRunning) return;
    console.log(`[CODER Runner] Skipping card #${this.currentIndex + 1}`);
    this.currentIndex++;
    // The loop will pick up the next card naturally
  }

  public getStats(): RunnerStats {
    return {
      hits: this.hits,
      declined: this.declined,
      threeds: this.threeds,
      totalTested: this.hits + this.declined + this.threeds,
      totalCards: this.cards.length,
    };
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  // ─── Resume from reload ───────────────────────────────────────────────

  public async tryResumeFromProgress(): Promise<boolean> {
    const progress = await storageGet<AutoTestProgress>(STORAGE_KEYS.AUTO_PROGRESS);
    if (progress && progress.isRunning) {
      console.log(`[CODER Runner] Found active progress, resuming from card #${progress.currentIndex + 1}`);
      await this.sleep(TIMING.INTER_CARD_DELAY);
      await this.start();
      return true;
    }
    return false;
  }

  // ─── Core Loop ────────────────────────────────────────────────────────

  private async runLoop(): Promise<void> {
    while (this.isRunning && this.currentIndex < this.cards.length) {
      // Check abort
      if (this.abortController?.signal.aborted) break;

      // Handle pause
      while (this.isPaused && this.isRunning) {
        await this.sleep(200);
      }
      if (!this.isRunning) break;

      const card = this.cards[this.currentIndex];
      const maskedCard = this.maskCardNumber(card.fixture.number);

      console.log(`[CODEX(R) Runner] Testing card ${this.currentIndex + 1}/${this.cards.length}: ****${card.fixture.number.slice(-4)}`);

      // Show in-page floating toast notification with full CC details
      ToastNotification.showCardTesting(card.fixture, this.currentIndex, this.cards.length);

      // Log start to Activity Log
      addActivityLog(
        'TRYING',
        `Probando CC #${this.currentIndex + 1}/${this.cards.length}: ${card.fixture.number} | Exp: ${card.fixture.expiryMonth}/${card.fixture.expiryYear.slice(-2)} | CVV: ${card.fixture.cvc}`,
        `Nombre: ${card.fixture.cardholderName || 'QA Test User'}`,
        maskedCard
      );

      this.callbacks.onCardStart(this.currentIndex, this.cards.length, maskedCard);
      this.callbacks.onStateChange('FILLING', { maskedCard, currentIndex: this.currentIndex + 1, totalCards: this.cards.length });

      // Save progress for resume
      await this.saveProgress();

      try {
        // ── Step 1: Fill fields on top frame ──
        const detection = detectCheckoutFields();
        if (detection.provider) {
          addActivityLog('GATEWAY', `Pasarela detectada en la página: ${detection.provider.toUpperCase()}`);
        }

        fillCheckoutForm(
          detection.fields,
          card.fixture,
          this.identity,
          this.randomNames,
          this.randomAddresses
        );

        addActivityLog('INFO', `Formulario rellenado con datos de ${card.fixture.cardholderName || 'QA Test User'}`, undefined, maskedCard);

        // ── Step 2: Micro-pause to ensure input change events finish ──
        await this.sleep(200);

        // ── Step 3: Start result listener BEFORE submitting ──
        this.callbacks.onStateChange('PROCESSING', { maskedCard, currentIndex: this.currentIndex + 1, totalCards: this.cards.length });
        const resultPromise = this.waitForResult();

        // ── Step 4: Submit form ──
        addActivityLog('INFO', 'Enviando formulario de checkout...', undefined, maskedCard);
        const submitted = submitCheckoutForm();
        if (!submitted) {
          this.tryFallbackSubmit();
        }

        // ── Step 5: Await API/DOM result for THIS SPECIFIC card ──
        const result = await resultPromise;

        console.log(`[CODEX(R) Runner] Card #${this.currentIndex + 1} result: ${result.result} (${result.duration}ms)`);
        this.callbacks.onCardResult(this.currentIndex, result.result, result.duration);

        // ── Step 6: Process result & trigger toasts & activity logs ──
        if (result.result === 'SUCCESS') {
          this.hits++;
          ToastNotification.showHit(maskedCard, this.currentIndex);
          addActivityLog('SUCCESS', `🎉 ¡HIT APROBADO en tarjeta #${this.currentIndex + 1}!`, `Tarjeta: ${card.fixture.number} | Pago procesado exitosamente`, maskedCard);
          this.callbacks.onHit(card, maskedCard);
          this.callbacks.onStateChange('SUCCESS');
          this.isRunning = false;
          await this.clearProgress();
          console.log(`[CODEX(R) Runner] 🎉 HIT on card #${this.currentIndex + 1}!`);
          break;

        } else if (result.result === 'REQUIRES_ACTION') {
          this.threeds++;
          ToastNotification.show3DS(maskedCard, this.currentIndex);
          addActivityLog('REQUIRES_ACTION', `⚠️ Desafío 3DS requerido en tarjeta #${this.currentIndex + 1}`, 'Se requiere autenticación 3D-Secure', maskedCard);
          this.callbacks.onStateChange('REQUIRES_ACTION');
          console.log(`[CODEX(R) Runner] ⚠️ 3DS on card #${this.currentIndex + 1}. Waiting 10 seconds...`);
          
          await this.sleep(10000);

          this.currentIndex++;
          await this.saveProgress();

          if (this.currentIndex >= this.cards.length) {
            this.callbacks.onStateChange('IDLE');
            this.isRunning = false;
            await this.clearProgress();
            this.callbacks.onComplete(this.getStats());
            break;
          }
          await this.sleep(TIMING.INTER_CARD_DELAY);

        } else {
          // DECLINED / ERROR / UNKNOWN / TIMEOUT
          this.declined++;
          const reason = result.details || 'Card Declined / Error en pago';
          ToastNotification.showDeclined(maskedCard, this.currentIndex, reason);
          addActivityLog('DECLINED', `❌ Tarjeta #${this.currentIndex + 1} RECHAZADA: ${maskedCard}`, reason, maskedCard);
          console.log(`[CODEX(R) Runner] ❌ Declined card #${this.currentIndex + 1}, next...`);
          this.currentIndex++;
          await this.saveProgress();

          if (this.currentIndex >= this.cards.length) {
            this.callbacks.onStateChange('IDLE');
            this.isRunning = false;
            await this.clearProgress();
            this.callbacks.onComplete(this.getStats());
            console.log('[CODEX(R) Runner] All cards tested.');
            break;
          }

          // Continue to next card
          await this.sleep(TIMING.INTER_CARD_DELAY);
        }

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`[CODEX(R) Runner] Error on card #${this.currentIndex + 1}:`, errorMsg);
        ToastNotification.showDeclined(maskedCard, this.currentIndex, errorMsg);
        addActivityLog('DECLINED', `❌ Error en tarjeta #${this.currentIndex + 1}`, errorMsg, maskedCard);
        this.callbacks.onError(errorMsg);
        this.declined++;
        this.currentIndex++;
        await this.saveProgress();
        await this.sleep(TIMING.INTER_CARD_DELAY);
      }
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────

  private maskCardNumber(number: string): string {
    const clean = number.replace(/\D/g, '');
    if (clean.length < 8) return '•••• •••• •••• ????';
    return `${clean.slice(0, 4)} •••• •••• ${clean.slice(-4)}`;
  }

  private async waitForResult(): Promise<{ result: PaymentResultStatus; duration: number; details?: string }> {
    return new Promise((resolve) => {
      const observer = new CheckoutObserver();
      const startTime = Date.now();

      const messageListener = (message: any) => {
        if (message?.action === 'PAYMENT_RESULT_BROADCAST') {
          const payload = message.payload;
          cleanup();
          resolve({
            result: payload.result,
            duration: payload.durationMs || (Date.now() - startTime),
            details: 'Received from background broadcast',
          });
        }
      };

      const cleanup = () => {
        observer.stop();
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          chrome.runtime.onMessage.removeListener(messageListener);
        }
      };

      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.onMessage.addListener(messageListener);
      }

      observer.start((result, durationMs, details) => {
        cleanup();
        resolve({ result, duration: durationMs, details });
      }, TIMING.OBSERVER_TIMEOUT);
    });
  }

  private tryFallbackSubmit(): void {
    const allBtns = Array.from(document.querySelectorAll<HTMLElement>('button, [role="button"], a'));
    const payBtn = allBtns.find((btn) => {
      const txt = (btn.textContent || '').toLowerCase();
      return (
        txt.includes('suscrib') || txt.includes('subscribe') ||
        txt.includes('pagar') || txt.includes('pay') ||
        txt.includes('comprar') || txt.includes('buy') ||
        txt.includes('completar') || txt.includes('complete') ||
        txt.includes('confirm') || txt.includes('place order')
      );
    });
    if (payBtn) {
      payBtn.click();
    }
  }



  private async saveProgress(): Promise<void> {
    const progress: AutoTestProgress = {
      isRunning: this.isRunning,
      currentIndex: this.currentIndex,
      hits: this.hits,
      declined: this.declined,
      threeds: this.threeds,
      startedAt: new Date().toISOString(),
      totalCards: this.cards.length,
    };
    await storageSet(STORAGE_KEYS.AUTO_PROGRESS, progress);
  }

  private async clearProgress(): Promise<void> {
    await storageRemove(STORAGE_KEYS.AUTO_PROGRESS);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const id = setTimeout(resolve, ms);
      // Cancel sleep on abort
      this.abortController?.signal.addEventListener('abort', () => {
        clearTimeout(id);
        resolve();
      }, { once: true });
    });
  }
}
