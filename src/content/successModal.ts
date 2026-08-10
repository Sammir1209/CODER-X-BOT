export interface SuccessModalData {
  testCaseName: string;
  maskedCard: string;
  amount: string;
  merchant: string;
  durationSeconds: string;
  environment: string;
}

export class SuccessModal {
  private host: HTMLDivElement | null = null;
  private shadow: ShadowRoot | null = null;

  public show(data: SuccessModalData, onClose?: () => void): void {
    this.close(); // Clean previous

    this.host = document.createElement('div');
    this.host.id = 'CODER-success-host';
    this.host.style.position = 'fixed';
    this.host.style.zIndex = '2147483647';
    this.host.style.inset = '0';
    this.host.style.display = 'flex';
    this.host.style.alignItems = 'center';
    this.host.style.justifyContent = 'center';

    this.shadow = this.host.attachShadow({ mode: 'closed' });
    document.body.appendChild(this.host);

    this.shadow.innerHTML = `
      <style>
        .backdrop {
          position: fixed;
          inset: 0;
          background: rgba(3, 3, 5, 0.92);
          backdrop-filter: blur(14px);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.25s ease-out;
        }
        .modal {
          width: 330px;
          background: #090d16;
          border: 1px solid #10b981;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 0 50px rgba(16, 185, 129, 0.25), 0 30px 60px rgba(0, 0, 0, 0.8);
          color: #f8fafc;
          font-family: 'Inter', system-ui, sans-serif;
          text-align: center;
          position: relative;
          overflow: hidden;
          animation: scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .glow-ring {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.12);
          border: 1.5px solid #10b981;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px auto;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.35);
        }
        .title {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: 2px;
          color: #10b981;
          margin: 0 0 2px 0;
        }
        .subtitle {
          font-size: 9px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 24px;
          font-weight: 800;
        }
        .summary-card {
          background: #05070a;
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 24px;
          text-align: left;
        }
        .row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .row:last-child {
          border-bottom: none;
        }
        .lbl {
          color: #64748b;
          font-weight: 600;
        }
        .val {
          font-weight: 700;
          color: #e2e8f0;
          font-family: 'JetBrains Mono', monospace;
        }
        .val-highlight {
          color: #34d399;
          font-weight: 800;
        }
        .btn-ack {
          width: 100%;
          background: #10b981;
          color: #022c22;
          border: none;
          border-radius: 12px;
          padding: 12px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.5px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-ack:hover {
          background: #34d399;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      </style>

      <div class="backdrop" id="CODER-success-backdrop">
        <div class="modal">
          <div class="glow-ring">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div class="title">PAYMENT HIT</div>
          <div class="subtitle">CODEX(R) STRIPE INTERCEPTOR</div>

          <div class="summary-card">
            <div class="row">
              <span class="lbl">TARJETA</span>
              <span class="val">${data.maskedCard}</span>
            </div>
            <div class="row">
              <span class="lbl">ESTADO</span>
              <span class="val val-highlight">CHARGED (HIT)</span>
            </div>
            <div class="row">
              <span class="lbl">MERCHANT</span>
              <span class="val">${data.merchant}</span>
            </div>
            <div class="row">
              <span class="lbl">DURACIÓN</span>
              <span class="val">${data.durationSeconds}s</span>
            </div>
          </div>

          <button class="btn-ack" id="CODER-success-close-btn">
            CONTINUAR
          </button>
        </div>
      </div>
    `;

    const closeBtn = this.shadow.querySelector('#CODER-success-close-btn');
    const backdrop = this.shadow.querySelector('#CODER-success-backdrop');

    closeBtn?.addEventListener('click', () => {
      this.close();
      if (onClose) onClose();
    });

    backdrop?.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        this.close();
        if (onClose) onClose();
      }
    });
  }

  public close(): void {
    if (this.host) {
      this.host.remove();
      this.host = null;
      this.shadow = null;
    }
  }
}

export const successModal = new SuccessModal();
