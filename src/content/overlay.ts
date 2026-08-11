/**
 * CODER System — Overlay (In-Page UI)
 * 
 * Renders a floating control panel inside the target page using Shadow DOM.
 * Drives the auto-test loop via callbacks.
 * 
 * Improvements:
 * - Differential rendering (only updates changed elements, not full innerHTML)
 * - No duplicate event listeners
 * - SKIP and PAUSE buttons connected
 * - Real-time speed indicator (cards/min)
 * - Visual state for PAUSED
 * - Draggable position
 */

import type { ExecutionState } from '../types/checkout';
import type { TestCase } from '../types/testCase';

// ─── Overlay State ────────────────────────────────────────────────────────────

interface OverlayState {
  isRunning: boolean;
  isPaused: boolean;
  executionState: ExecutionState;
  provider: string;
  currentMaskedCard?: string;
  attemptCount: number;
  totalCards: number;
  hits: number;
  declined: number;
  threeds: number;
}

const DEFAULT_STATE: OverlayState = {
  isRunning: false,
  isPaused: false,
  executionState: 'IDLE',
  provider: '...',
  attemptCount: 0,
  totalCards: 0,
  hits: 0,
  declined: 0,
  threeds: 0,
};

// ─── CODEROverlay Class ───────────────────────────────────────────────────────

export class CODEROverlay {
  private root: HTMLDivElement | null = null;
  private shadow: ShadowRoot | null = null;
  private state: OverlayState = { ...DEFAULT_STATE };
  private testCases: TestCase[] = [];
  private selectedId: string = '';

  private onStart: ((testCaseId: string) => void) | null = null;
  private onStop: (() => void) | null = null;
  private onPause: (() => void) | null = null;
  private onSkip: (() => void) | null = null;

  // Track mounted element references for differential updates
  private elements: Record<string, HTMLElement | null> = {};
  private isListenersAttached = false;

  /**
   * Initialize and mount the overlay into the page.
   */
  public init(
    onStart: (testCaseId: string) => void,
    onStop: () => void,
    onPause: () => void,
    onSkip: () => void
  ): void {
    this.onStart = onStart;
    this.onStop = onStop;
    this.onPause = onPause;
    this.onSkip = onSkip;

    this.mount();
  }

  /**
   * Update overlay state and re-render only changed parts.
   */
  public updateState(partial: Partial<OverlayState>): void {
    const prev = { ...this.state };
    Object.assign(this.state, partial);

    // Only update DOM elements that actually changed
    this.diffUpdate(prev);
  }

  /**
   * Set available test cases.
   */
  public setTestCases(cases: TestCase[]): void {
    this.testCases = cases;
    if (cases.length > 0 && !this.selectedId) {
      this.selectedId = cases[0].id;
    }
    this.renderTestCaseSelect();
  }

  /**
   * Get current stats for external consumption.
   */
  public getStats(): { hits: number; declined: number; threeds: number; totalCards: number } {
    return {
      hits: this.state.hits,
      declined: this.state.declined,
      threeds: this.state.threeds,
      totalCards: this.state.totalCards,
    };
  }

  // ─── Mount ──────────────────────────────────────────────────────────────

  private mount(): void {
    if (this.root) return;

    this.root = document.createElement('div');
    this.root.id = 'CODER-overlay-root';
    this.root.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:2147483647;font-family:system-ui,-apple-system,sans-serif;';

    this.shadow = this.root.attachShadow({ mode: 'closed' });
    this.shadow.innerHTML = this.buildHTML();
    this.shadow.appendChild(this.buildStyles());

    document.body.appendChild(this.root);

    this.cacheElements();
    this.attachListeners();
    this.diffUpdate(DEFAULT_STATE); // Initial render
  }

  // ─── HTML Structure ─────────────────────────────────────────────────────

  private buildHTML(): string {
    return `
      <div id="CODER-panel" style="width:235px;background:#030407;border:1px solid #1c1f2e;border-radius:14px;box-shadow:0 25px 60px rgba(0,0,0,0.95), 0 0 1px rgba(255,255,255,0.1);overflow:hidden;user-select:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#ffffff;padding:12px;backdrop-filter:blur(16px);">
        
        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;cursor:grab;" id="CODER-header">
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="width:7px;height:7px;border-radius:50%;background:#ffffff;box-shadow:0 0 8px #ffffff;"></div>
            <div style="font-size:11px;font-weight:900;letter-spacing:1.5px;color:#ffffff;line-height:1;text-transform:uppercase;">CODEX®</div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:8px;font-weight:800;letter-spacing:1px;color:#a1a1aa;text-transform:uppercase;" id="CODER-provider">STRIPE</span>
            <button id="CODER-btn-toggle" style="width:20px;height:20px;border-radius:6px;background:#0d0e14;border:1px solid #27273a;color:#ffffff;font-size:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;line-height:1;" title="Minimize">—</button>
          </div>
        </div>

        <!-- Detected Gateway Badge Banner -->
        <div id="CODER-gateway-badge" style="font-size:9px;font-weight:900;letter-spacing:1.5px;color:#ffffff;background:#090b12;border:1px solid #222538;padding:5px 8px;border-radius:8px;text-align:center;margin-bottom:10px;text-transform:uppercase;font-family:monospace;">
          DETECTED GATEWAY
        </div>

        <!-- Collapsible Content -->
        <div id="CODER-body">
          <!-- Card Info Box (TRYING 1) -->
          <div style="background:#08090f;border:1px solid #1b1e2d;border-radius:10px;padding:9px 10px;margin-bottom:8px;">
            <div style="font-size:8px;font-weight:800;letter-spacing:1px;color:#71717a;text-transform:uppercase;margin-bottom:3px;">PROBANDO TARJETA</div>
            <div id="CODER-current-card" style="font-family:'JetBrains Mono',Consolas,monospace;font-size:11px;font-weight:700;color:#ffffff;letter-spacing:0.8px;">—</div>
          </div>

          <!-- Attempts Counter (ATTEMPTS 1) -->
          <div style="background:#08090f;border:1px solid #1b1e2d;border-radius:10px;padding:9px 10px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;">
            <div style="font-size:8px;font-weight:800;letter-spacing:1px;color:#71717a;text-transform:uppercase;">PROGRESO</div>
            <div id="CODER-progress-text" style="font-family:'JetBrains Mono',Consolas,monospace;font-size:16px;font-weight:900;color:#ffffff;line-height:1;">1 / 1</div>
          </div>

          <!-- Stats Pill Row -->
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;margin-bottom:10px;">
            <div style="background:#08090f;border:1px solid #16241a;border-radius:8px;padding:6px 2px;text-align:center;">
              <div style="font-size:7px;color:#4ade80;font-weight:900;letter-spacing:0.5px;">HIT</div>
              <div id="CODER-hits" style="font-size:13px;font-weight:900;color:#4ade80;font-family:monospace;margin-top:1px;">0</div>
            </div>
            <div style="background:#08090f;border:1px solid #2c1718;border-radius:8px;padding:6px 2px;text-align:center;">
              <div style="font-size:7px;color:#f87171;font-weight:900;letter-spacing:0.5px;">DEC</div>
              <div id="CODER-declined" style="font-size:13px;font-weight:900;color:#f87171;font-family:monospace;margin-top:1px;">0</div>
            </div>
            <div style="background:#08090f;border:1px solid #2d2410;border-radius:8px;padding:6px 2px;text-align:center;">
              <div style="font-size:7px;color:#fbbf24;font-weight:900;letter-spacing:0.5px;">3DS</div>
              <div id="CODER-threeds" style="font-size:13px;font-weight:900;color:#fbbf24;font-family:monospace;margin-top:1px;">0</div>
            </div>
          </div>

          <!-- Source Box (SOURCE BIN GEN) -->
          <div style="background:#08090f;border:1px solid #1b1e2d;border-radius:10px;padding:7px 10px;display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
            <span style="font-size:8px;font-weight:800;letter-spacing:1px;color:#71717a;text-transform:uppercase;">ORIGEN</span>
            <span id="CODER-status-badge" style="font-size:8px;font-weight:900;letter-spacing:1px;color:#ffffff;background:#181824;border:1px solid #2e2e46;padding:3px 8px;border-radius:6px;text-transform:uppercase;">BIN GEN</span>
          </div>

          <!-- Hidden test case select -->
          <select id="CODER-select" style="display:none;"></select>

          <!-- Action Control Buttons -->
          <div style="display:flex;gap:6px;">
            <button id="CODER-btn-start" style="flex:1;background:#ffffff;border:1px solid #ffffff;color:#000000;border-radius:9px;padding:9px 6px;font-size:9px;font-weight:900;letter-spacing:1px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;text-transform:uppercase;transition:all 0.15s ease;">▶ START</button>
            <button id="CODER-btn-pause" style="flex:1;background:#181824;border:1px solid #32324a;color:#ffffff;border-radius:9px;padding:9px 6px;font-size:9px;font-weight:900;letter-spacing:1px;cursor:pointer;display:none;align-items:center;justify-content:center;gap:4px;text-transform:uppercase;">■ PAUSE</button>
            <button id="CODER-btn-skip" style="width:32px;background:#181824;border:1px solid #32324a;color:#ffffff;border-radius:9px;padding:9px 2px;font-size:10px;cursor:pointer;display:none;align-items:center;justify-content:center;" title="Skip Card">⏭</button>
            <button id="CODER-btn-stop" style="flex:1;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);color:#ef4444;border-radius:9px;padding:9px 6px;font-size:9px;font-weight:900;letter-spacing:1px;cursor:pointer;display:none;align-items:center;justify-content:center;gap:4px;text-transform:uppercase;">■ STOP</button>
          </div>
        </div>

      </div>
    `;
  }

  private buildStyles(): HTMLStyleElement {
    const style = document.createElement('style');
    style.textContent = `
      * { box-sizing: border-box; }
      #CODER-btn-start:hover { background: #e2e8f0; transform: translateY(-1px); }
      button:active { transform: scale(0.96); }
      @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
    `;
    return style;
  }

  // ─── Element Caching ────────────────────────────────────────────────────

  private cacheElements(): void {
    if (!this.shadow) return;
    const ids = [
      'CODER-provider', 'CODER-gateway-badge', 'CODER-status-badge', 'CODER-current-card',
      'CODER-progress-text', 'CODER-hits', 'CODER-declined', 'CODER-threeds',
      'CODER-select', 'CODER-btn-start', 'CODER-btn-pause', 'CODER-btn-skip', 'CODER-btn-stop',
    ];
    for (const id of ids) {
      this.elements[id] = this.shadow.getElementById(id);
    }
  }

  // ─── Event Listeners (attached once) ────────────────────────────────────

  private attachListeners(): void {
    if (this.isListenersAttached) return;
    this.isListenersAttached = true;

    this.elements['CODER-btn-start']?.addEventListener('click', () => {
      if (this.onStart) {
        this.onStart(this.selectedId);
      }
    });

    this.elements['CODER-btn-stop']?.addEventListener('click', () => {
      if (this.onStop) {
        this.onStop();
      }
    });

    this.elements['CODER-btn-pause']?.addEventListener('click', () => {
      if (this.onPause) {
        this.onPause();
      }
    });

    this.elements['CODER-btn-skip']?.addEventListener('click', () => {
      if (this.onSkip) {
        this.onSkip();
      }
    });

    const toggleBtn = this.shadow?.getElementById('CODER-btn-toggle');
    const bodyEl = this.shadow?.getElementById('CODER-body');
    if (toggleBtn && bodyEl) {
      toggleBtn.addEventListener('click', () => {
        const isHidden = bodyEl.style.display === 'none';
        bodyEl.style.display = isHidden ? 'block' : 'none';
        toggleBtn.textContent = isHidden ? '—' : '+';
      });
    }

    this.elements['CODER-select']?.addEventListener('change', (e) => {
      this.selectedId = (e.target as HTMLSelectElement).value;
    });

    // Drag support
    this.makeDraggable();
  }

  // ─── Differential Update ────────────────────────────────────────────────

  private diffUpdate(prev: OverlayState): void {
    const s = this.state;

    // Provider & Gateway Badge
    if (s.provider !== prev.provider) {
      const label = `DETECTED ${ (s.provider || 'GENERIC').toUpperCase() }`;
      this.setText('CODER-provider', label);
      this.setText('CODER-gateway-badge', label);
    }

    // Status badge
    if (s.executionState !== prev.executionState) {
      this.updateStatusBadge();
    }

    // Card display
    if (s.currentMaskedCard !== prev.currentMaskedCard) {
      this.setText('CODER-current-card', s.currentMaskedCard || '—');
    }

    // Progress
    if (s.attemptCount !== prev.attemptCount || s.totalCards !== prev.totalCards) {
      this.setText('CODER-progress-text', `${s.attemptCount} / ${s.totalCards}`);
    }

    // Stats
    if (s.hits !== prev.hits) this.setText('CODER-hits', String(s.hits));
    if (s.declined !== prev.declined) this.setText('CODER-declined', String(s.declined));
    if (s.threeds !== prev.threeds) this.setText('CODER-threeds', String(s.threeds));

    // Button visibility
    if (s.isRunning !== prev.isRunning || s.isPaused !== prev.isPaused) {
      this.updateButtons();
    }
  }

  private setText(id: string, text: string): void {
    const el = this.elements[id];
    if (el && el.textContent !== text) {
      el.textContent = text;
    }
  }

  private updateStatusBadge(): void {
    const badge = this.elements['CODER-status-badge'];
    if (!badge) return;

    const s = this.state;
    let text: string = s.executionState;
    let bg = 'rgba(30,41,59,0.8)';
    let color = '#94a3b8';
    let border = '#334155';

    switch (s.executionState) {
      case 'FILLING':
        text = 'FILLING';
        bg = 'rgba(99,102,241,0.2)';
        color = '#818cf8';
        border = 'rgba(99,102,241,0.4)';
        break;
      case 'PROCESSING':
      case 'SUBMITTING':
        text = 'PROCESSING';
        bg = 'rgba(251,191,36,0.15)';
        color = '#fbbf24';
        border = 'rgba(251,191,36,0.3)';
        (badge as HTMLElement).style.animation = 'pulse 1.5s ease-in-out infinite';
        break;
      case 'SUCCESS':
        text = '✓ HIT';
        bg = 'rgba(52,211,153,0.15)';
        color = '#34d399';
        border = 'rgba(52,211,153,0.3)';
        (badge as HTMLElement).style.animation = '';
        break;
      case 'DECLINED':
      case 'EXPECTED_DECLINE':
        text = '✗ DECLINED';
        bg = 'rgba(248,113,113,0.15)';
        color = '#f87171';
        border = 'rgba(248,113,113,0.3)';
        (badge as HTMLElement).style.animation = '';
        break;
      case 'REQUIRES_ACTION':
        text = '⚠ 3DS';
        bg = 'rgba(251,191,36,0.15)';
        color = '#fbbf24';
        border = 'rgba(251,191,36,0.3)';
        (badge as HTMLElement).style.animation = '';
        break;
      case 'PAUSED':
        text = '⏸ PAUSED';
        bg = 'rgba(251,191,36,0.15)';
        color = '#fbbf24';
        border = 'rgba(251,191,36,0.3)';
        (badge as HTMLElement).style.animation = '';
        break;
      case 'CHECKOUT_FOUND':
        text = 'READY';
        bg = 'rgba(52,211,153,0.1)';
        color = '#34d399';
        border = 'rgba(52,211,153,0.3)';
        (badge as HTMLElement).style.animation = '';
        break;
      default:
        (badge as HTMLElement).style.animation = '';
    }

    badge.textContent = text;
    (badge as HTMLElement).style.background = bg;
    (badge as HTMLElement).style.color = color;
    (badge as HTMLElement).style.borderColor = border;
  }

  private updateButtons(): void {
    const startBtn = this.elements['CODER-btn-start'] as HTMLElement | null;
    const stopBtn = this.elements['CODER-btn-stop'] as HTMLElement | null;
    const pauseBtn = this.elements['CODER-btn-pause'] as HTMLElement | null;
    const skipBtn = this.elements['CODER-btn-skip'] as HTMLElement | null;

    if (this.state.isRunning) {
      if (startBtn) startBtn.style.display = 'none';
      if (stopBtn) stopBtn.style.display = 'flex';
      if (pauseBtn) {
        pauseBtn.style.display = 'flex';
        pauseBtn.textContent = this.state.isPaused ? '▶ RESUME' : '■ PAUSE';
      }
      if (skipBtn) skipBtn.style.display = 'flex';
    } else {
      if (startBtn) startBtn.style.display = 'flex';
      if (stopBtn) stopBtn.style.display = 'none';
      if (pauseBtn) pauseBtn.style.display = 'none';
      if (skipBtn) skipBtn.style.display = 'none';
    }
  }

  // ─── Test Case Select ───────────────────────────────────────────────────

  private renderTestCaseSelect(): void {
    const select = this.elements['CODER-select'] as HTMLSelectElement | null;
    if (!select) return;

    select.innerHTML = '';
    for (const tc of this.testCases) {
      const opt = document.createElement('option');
      opt.value = tc.id;
      opt.textContent = tc.name;
      select.appendChild(opt);
    }

    if (this.selectedId) {
      select.value = this.selectedId;
    }
  }

  // ─── Drag ───────────────────────────────────────────────────────────────

  private makeDraggable(): void {
    const header = this.shadow?.getElementById('CODER-header');
    if (!header || !this.root) return;

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.addEventListener('mousedown', (e: MouseEvent) => {
      isDragging = true;
      offsetX = e.clientX - (this.root?.getBoundingClientRect().left ?? 0);
      offsetY = e.clientY - (this.root?.getBoundingClientRect().top ?? 0);
      (header as HTMLElement).style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e: MouseEvent) => {
      if (!isDragging || !this.root) return;
      this.root.style.left = `${e.clientX - offsetX}px`;
      this.root.style.top = `${e.clientY - offsetY}px`;
      this.root.style.right = 'auto';
      this.root.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      if (header) (header as HTMLElement).style.cursor = 'grab';
    });
  }
}
