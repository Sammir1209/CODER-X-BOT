/**
 * CODEX(R) System — Floating Toast Notification System
 *
 * Displays high-visibility, ultra-sleek floating toasts in the top-right corner.
 * Features an intelligent queue manager that automatically prevents toast stacking/overlapping
 * by limiting active notifications and instantly transitioning previous card status updates.
 */

export class ToastNotification {
  private static container: HTMLDivElement | null = null;
  private static activeToasts: HTMLElement[] = [];

  private static ensureContainer(): HTMLDivElement {
    if (this.container && document.body.contains(this.container)) {
      return this.container;
    }

    const host = document.createElement('div');
    host.id = 'CODEX-toast-host';
    host.style.position = 'fixed';
    host.style.top = '20px';
    host.style.right = '20px';
    host.style.zIndex = '2147483647';
    host.style.pointerEvents = 'none';
    host.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    const shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      .toast-wrapper {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-width: 360px;
        align-items: flex-end;
      }
      .toast-card {
        pointer-events: auto;
        width: 340px;
        background: rgba(5, 7, 12, 0.96);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 12px;
        padding: 12px 14px;
        color: #ffffff;
        box-shadow: 0 20px 45px rgba(0, 0, 0, 0.9), 0 0 1px rgba(255, 255, 255, 0.15);
        animation: toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 12px;
        transition: all 0.2s ease;
      }
      .toast-card.declined {
        border-left: 4px solid #f43f5e;
        background: rgba(18, 6, 10, 0.96);
      }
      .toast-card.success {
        border-left: 4px solid #10b981;
        background: rgba(6, 20, 14, 0.96);
        box-shadow: 0 0 35px rgba(16, 185, 129, 0.35);
      }
      .toast-card.threeds {
        border-left: 4px solid #f59e0b;
        background: rgba(22, 16, 6, 0.96);
      }
      .toast-card.info {
        border-left: 4px solid #6366f1;
        background: rgba(10, 12, 24, 0.96);
      }
      .toast-icon {
        font-size: 20px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.06);
        flex-shrink: 0;
      }
      .toast-content {
        flex: 1;
        min-width: 0;
      }
      .toast-title {
        font-weight: 900;
        font-size: 10px;
        letter-spacing: 0.9px;
        text-transform: uppercase;
        margin-bottom: 2px;
        line-height: 1.2;
      }
      .toast-desc {
        font-family: 'JetBrains Mono', Consolas, monospace;
        font-size: 11px;
        color: #e2e8f0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-weight: 600;
      }
      @keyframes toastSlideIn {
        from { opacity: 0; transform: translateX(30px) scale(0.95); }
        to { opacity: 1; transform: translateX(0) scale(1); }
      }
      @keyframes toastSlideOut {
        from { opacity: 1; transform: translateX(0) scale(1); }
        to { opacity: 0; transform: translateX(30px) scale(0.92); }
      }
    `;

    const containerDiv = document.createElement('div');
    containerDiv.className = 'toast-wrapper';

    shadow.appendChild(style);
    shadow.appendChild(containerDiv);
    document.body.appendChild(host);

    this.container = containerDiv;
    return containerDiv;
  }

  /**
   * Dismisses previous info/declined toasts to prevent stacking/crossing on screen.
   */
  private static pruneToasts(): void {
    while (this.activeToasts.length >= 2) {
      const oldest = this.activeToasts.shift();
      if (oldest && oldest.parentNode) {
        oldest.style.animation = 'toastSlideOut 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards';
        setTimeout(() => {
          if (oldest.parentNode) {
            oldest.parentNode.removeChild(oldest);
          }
        }, 200);
      }
    }
  }

  /**
   * Shows a clean floating toast notification.
   */
  public static show(options: {
    title: string;
    description: string;
    type?: 'info' | 'success' | 'declined' | 'threeds';
    icon?: string;
    durationMs?: number;
  }): void {
    try {
      const container = this.ensureContainer();

      const type = options.type || 'info';
      const icon = options.icon || (type === 'success' ? '🎉' : type === 'declined' ? '❌' : type === 'threeds' ? '⚠️' : '💳');

      // Prune previous toasts if type is info or declined to avoid overlap
      if (type === 'info' || type === 'declined') {
        this.pruneToasts();
      }

      const card = document.createElement('div');
      card.className = `toast-card ${type}`;

      const iconEl = document.createElement('div');
      iconEl.className = 'toast-icon';
      iconEl.textContent = icon;

      const contentEl = document.createElement('div');
      contentEl.className = 'toast-content';

      const titleEl = document.createElement('div');
      titleEl.className = 'toast-title';
      titleEl.style.color = type === 'success' ? '#4ade80' : type === 'declined' ? '#f87171' : type === 'threeds' ? '#fbbf24' : '#818cf8';
      titleEl.textContent = options.title;

      const descEl = document.createElement('div');
      descEl.className = 'toast-desc';
      descEl.textContent = options.description;

      contentEl.appendChild(titleEl);
      contentEl.appendChild(descEl);

      card.appendChild(iconEl);
      card.appendChild(contentEl);

      container.appendChild(card);
      this.activeToasts.push(card);

      const duration = options.durationMs || (type === 'success' ? 6000 : 2500);

      setTimeout(() => {
        card.style.animation = 'toastSlideOut 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards';
        setTimeout(() => {
          const idx = this.activeToasts.indexOf(card);
          if (idx !== -1) this.activeToasts.splice(idx, 1);
          if (card.parentNode) {
            card.parentNode.removeChild(card);
          }
        }, 200);
      }, duration);
    } catch (e) {
      console.warn('[CODEX(R)] Error showing toast:', e);
    }
  }

  /**
   * Toast when testing a specific card with full info
   */
  public static showCardTesting(card: { number: string; expiryMonth?: string; expMonth?: string; expiryYear?: string; expYear?: string; cvc: string }, index: number, total: number): void {
    const cleanNum = card.number.replace(/\D/g, '');
    const masked = cleanNum.length >= 8 ? `${cleanNum.slice(0, 4)} •••• •••• ${cleanNum.slice(-4)}` : cleanNum;
    const month = card.expiryMonth || card.expMonth || '12';
    const year = (card.expiryYear || card.expYear || '28').slice(-2);
    this.show({
      title: `PROBANDO CC #${index + 1} DE ${total}`,
      description: `${masked} | ${month}/${year} | CVV ${card.cvc}`,
      type: 'info',
      icon: '💳',
      durationMs: 2000,
    });
  }

  /**
   * Toast when a card is DECLINED
   */
  public static showDeclined(maskedCard: string, index: number, reason?: string): void {
    this.show({
      title: `❌ TARJETA RECHAZADA #${index + 1}`,
      description: `${maskedCard} — ${reason || 'Declinada / Error'}`,
      type: 'declined',
      icon: '❌',
      durationMs: 2200,
    });
  }

  /**
   * Toast when a card is a HIT (SUCCESS)
   */
  public static showHit(maskedCard: string, index: number): void {
    this.show({
      title: `🎉 ¡HIT APROBADO EN TARJETA #${index + 1}!`,
      description: `${maskedCard} — ¡Pago procesado exitosamente!`,
      type: 'success',
      icon: '🎉',
      durationMs: 8000,
    });
  }

  /**
   * Toast when 3DS action is required
   */
  public static show3DS(maskedCard: string, index: number): void {
    this.show({
      title: `⚠️ ACCIÓN 3DS REQUERIDA #${index + 1}`,
      description: `${maskedCard} — Desafío 3D-Secure detectado.`,
      type: 'threeds',
      icon: '⚠️',
      durationMs: 5000,
    });
  }
}
