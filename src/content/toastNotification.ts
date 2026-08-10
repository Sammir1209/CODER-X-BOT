/**
 * CODEX(R) System — Floating Toast Notification System
 *
 * Displays high-visibility, sleek floating toasts in the top-right corner of the page.
 * Shows card testing details (full card info), DECLINED results, HITS, and 3DS alerts.
 */

export class ToastNotification {
  private static container: HTMLDivElement | null = null;

  private static ensureContainer(): HTMLDivElement {
    if (this.container && document.body.contains(this.container)) {
      return this.container;
    }

    const host = document.createElement('div');
    host.id = 'CODEX-toast-host';
    host.style.position = 'fixed';
    host.style.top = '16px';
    host.style.right = '16px';
    host.style.zIndex = '2147483647';
    host.style.pointerEvents = 'none';
    host.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    const shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      .toast-wrapper {
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 380px;
      }
      .toast-card {
        pointer-events: auto;
        background: rgba(11, 13, 20, 0.95);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 12px 16px;
        color: #f8fafc;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
        animation: toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        align-items: flex-start;
        gap: 12px;
        font-size: 12px;
      }
      .toast-card.declined {
        border-color: rgba(248, 113, 113, 0.4);
        background: rgba(24, 11, 15, 0.95);
      }
      .toast-card.success {
        border-color: rgba(52, 211, 153, 0.6);
        background: rgba(10, 26, 20, 0.95);
        box-shadow: 0 0 30px rgba(52, 211, 153, 0.3);
      }
      .toast-card.threeds {
        border-color: rgba(251, 191, 36, 0.5);
        background: rgba(26, 22, 10, 0.95);
      }
      .toast-card.info {
        border-color: rgba(99, 102, 241, 0.4);
        background: rgba(14, 16, 30, 0.95);
      }
      .toast-icon {
        font-size: 18px;
        line-height: 1;
        margin-top: 1px;
      }
      .toast-content {
        flex: 1;
      }
      .toast-title {
        font-weight: 900;
        font-size: 11px;
        letter-spacing: 0.8px;
        text-transform: uppercase;
        margin-bottom: 2px;
      }
      .toast-desc {
        font-family: 'JetBrains Mono', Consolas, monospace;
        font-size: 11px;
        color: #cbd5e1;
        word-break: break-all;
      }
      .toast-meta {
        font-size: 10px;
        color: #94a3b8;
        margin-top: 3px;
      }
      @keyframes toastIn {
        from { opacity: 0; transform: translateY(-12px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes toastOut {
        from { opacity: 1; transform: translateY(0) scale(1); }
        to { opacity: 0; transform: translateY(-12px) scale(0.95); }
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
   * Shows a toast notification on page.
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

      const card = document.createElement('div');
      card.className = `toast-card ${type}`;

      const iconEl = document.createElement('div');
      iconEl.className = 'toast-icon';
      iconEl.textContent = icon;

      const contentEl = document.createElement('div');
      contentEl.className = 'toast-content';

      const titleEl = document.createElement('div');
      titleEl.className = 'toast-title';
      titleEl.style.color = type === 'success' ? '#34d399' : type === 'declined' ? '#f87171' : type === 'threeds' ? '#fbbf24' : '#818cf8';
      titleEl.textContent = options.title;

      const descEl = document.createElement('div');
      descEl.className = 'toast-desc';
      descEl.textContent = options.description;

      contentEl.appendChild(titleEl);
      contentEl.appendChild(descEl);

      card.appendChild(iconEl);
      card.appendChild(contentEl);

      container.appendChild(card);

      const duration = options.durationMs || (type === 'success' ? 8000 : 4500);

      setTimeout(() => {
        card.style.animation = 'toastOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
        setTimeout(() => {
          if (card.parentNode) {
            card.parentNode.removeChild(card);
          }
        }, 300);
      }, duration);
    } catch (e) {
      console.warn('[CODEX(R)] Error showing toast:', e);
    }
  }

  /**
   * Toast when testing a specific card with full info
   */
  public static showCardTesting(card: { number: string; expiryMonth?: string; expMonth?: string; expiryYear?: string; expYear?: string; cvc: string }, index: number, total: number): void {
    const formattedNum = card.number.replace(/(\d{4})/g, '$1 ').trim();
    const month = card.expiryMonth || card.expMonth || '12';
    const year = (card.expiryYear || card.expYear || '28').slice(-2);
    this.show({
      title: `PROBANDO CC #${index + 1} DE ${total}`,
      description: `${formattedNum} | Exp: ${month}/${year} | CVV: ${card.cvc}`,
      type: 'info',
      icon: '💳',
      durationMs: 4000,
    });
  }

  /**
   * Toast when a card is DECLINED
   */
  public static showDeclined(maskedCard: string, index: number, reason?: string): void {
    this.show({
      title: `❌ TARJETA RECHAZADA #${index + 1}`,
      description: `${maskedCard} — ${reason || 'Card Declined / Error en pago'}`,
      type: 'declined',
      icon: '❌',
      durationMs: 4500,
    });
  }

  /**
   * Toast when a card is a HIT (SUCCESS)
   */
  public static showHit(maskedCard: string, index: number): void {
    this.show({
      title: `🎉 ¡HIT APROBADO EN TARJETA #${index + 1}!`,
      description: `${maskedCard} — Pago procesado exitosamente con éxito!`,
      type: 'success',
      icon: '🎉',
      durationMs: 10000,
    });
  }

  /**
   * Toast when 3DS action is required
   */
  public static show3DS(maskedCard: string, index: number): void {
    this.show({
      title: `⚠️ ACCIÓN 3DS REQUERIDA #${index + 1}`,
      description: `${maskedCard} — El banco solicitó verificación 3D-Secure.`,
      type: 'threeds',
      icon: '⚠️',
      durationMs: 6000,
    });
  }
}
