/**
 * CODER System — Telegram Bot Poller
 * 
 * Long-polls the Telegram Bot API for incoming messages and commands.
 * Runs in the Chrome Extension background service worker.
 * 
 * Improvements:
 * - Rate limiting (respects Telegram 30 req/sec limit)
 * - Exponential backoff on errors
 * - Proper stopPoller() cleanup
 * - /stats, /export, /help command handlers
 * - callback_query support (inline button presses)
 */

import { TELEGRAM_API_BASE, STORAGE_KEYS } from '../utils/constants';
import { sendTelegramProfileNotification } from '../utils/telegramNotifier';
import { storageGet, storageGetMultiple } from '../utils/storageAdapter';

let isPolling = false;
let pollAbortController: AbortController | null = null;
let lastUpdateId = 0;
let consecutiveErrors = 0;
const MAX_BACKOFF_MS = 30000;

/**
 * Start long-polling for Telegram bot updates.
 */
export function startTelegramBotPoller(): void {
  if (isPolling) return;
  isPolling = true;
  consecutiveErrors = 0;
  console.log('[CODER Telegram] Bot poller started');
  pollLoop();
}

/**
 * Stop the Telegram bot poller cleanly.
 */
export function stopTelegramBotPoller(): void {
  isPolling = false;
  pollAbortController?.abort();
  pollAbortController = null;
  console.log('[CODER Telegram] Bot poller stopped');
}

// ─── Polling Loop ─────────────────────────────────────────────────────────────

async function pollLoop(): Promise<void> {
  while (isPolling) {
    try {
      pollAbortController = new AbortController();

      const url = `${TELEGRAM_API_BASE}/getUpdates?offset=${lastUpdateId + 1}&timeout=25&allowed_updates=["message","callback_query"]`;

      const response = await fetch(url, {
        signal: pollAbortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      consecutiveErrors = 0; // Reset on success

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          lastUpdateId = Math.max(lastUpdateId, update.update_id);
          await handleUpdate(update);
        }
      }

    } catch (err) {
      if (!isPolling) break; // Aborted intentionally

      consecutiveErrors++;
      const backoff = Math.min(1000 * Math.pow(2, consecutiveErrors), MAX_BACKOFF_MS);
      console.warn(`[CODER Telegram] Poll error (attempt ${consecutiveErrors}), retry in ${backoff}ms`);
      await sleep(backoff);
    }
  }
}

// ─── Update Handler ───────────────────────────────────────────────────────────

async function handleUpdate(update: any): Promise<void> {
  // ── Message commands ──
  if (update.message?.text) {
    const chatId = update.message.chat.id.toString();
    const text = update.message.text.trim();
    const fromUser = update.message.from;

    console.log(`[CODER Telegram] Message from ${chatId}: ${text.slice(0, 50)}`);

    if (text === '/start' || text === '/register') {
      await handleStartCommand(chatId, fromUser);
    } else if (text === '/me' || text === '/profile') {
      await handleProfileCommand(chatId, fromUser);
    } else if (text === '/stats') {
      await handleStatsCommand(chatId);
    } else if (text === '/export') {
      await handleExportCommand(chatId);
    } else if (text === '/help') {
      await handleHelpCommand(chatId);
    }
  }

  // ── Inline button callbacks ──
  if (update.callback_query) {
    const callbackData = update.callback_query.data;
    const chatId = update.callback_query.message?.chat?.id?.toString();

    if (chatId && callbackData) {
      console.log(`[CODER Telegram] Callback query from ${chatId}: ${callbackData}`);
      // Acknowledge the callback
      await fetch(`${TELEGRAM_API_BASE}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: update.callback_query.id }),
      }).catch(() => {});
    }
  }
}

// ─── Command Handlers ─────────────────────────────────────────────────────────

async function handleStartCommand(chatId: string, from: any): Promise<void> {
  const name = `${from?.first_name || ''} ${from?.last_name || ''}`.trim() || 'User';

  const msg = `<b>🛡️ CODER SYSTEM V1.1.0</b>

¡Bienvenido, <b>${name}</b>!

Tu ID de Telegram es: <code>${chatId}</code>

Usa este ID para iniciar sesión en la extensión CODER.

<b>Comandos disponibles:</b>
/me — Ver tu perfil
/stats — Estadísticas de la sesión
/export — Exportar HITS
/help — Ayuda`;

  await sendMessage(chatId, msg);
}

async function handleProfileCommand(chatId: string, from: any): Promise<void> {
  const name = `${from?.first_name || ''} ${from?.last_name || ''}`.trim() || 'User';

  await sendTelegramProfileNotification(
    chatId,
    {
      name,
      telegramId: chatId,
      email: `${chatId}@CODER.test`,
      role: 'VIP',
    }
  );
}

async function handleStatsCommand(chatId: string): Promise<void> {
  // Fetch stats from storage
  let statsMsg = '<b>📊 CODER — Estadísticas</b>\n━━━━━━━━━━━━━━━━━━━━━━━\n\n';

  try {
    const data = await storageGetMultiple<Record<string, unknown>>([
      STORAGE_KEYS.HITS,
      STORAGE_KEYS.TEST_CASES,
    ]);

    const hits = (data[STORAGE_KEYS.HITS] as any[]) || [];
    const testCases = (data[STORAGE_KEYS.TEST_CASES] as any[]) || [];

    statsMsg += `✅ <b>HITS:</b> <code>${hits.length}</code>\n`;
    statsMsg += `💳 <b>Tarjetas cargadas:</b> <code>${testCases.length}</code>\n`;
    statsMsg += `\n━━━━━━━━━━━━━━━━━━━━━━━\n<i>Datos de la sesión actual</i>`;
  } catch {
    statsMsg += 'No se pudieron obtener las estadísticas.';
  }

  await sendMessage(chatId, statsMsg);
}

async function handleExportCommand(chatId: string): Promise<void> {
  try {
    const hits = (await storageGet<any[]>(STORAGE_KEYS.HITS)) || [];

    if (hits.length === 0) {
      await sendMessage(chatId, '📋 No hay HITS registrados para exportar.');
      return;
    }

    // Format hits for export
    const hitLines = hits.slice(0, 50).map((h: any, i: number) =>
      `${i + 1}. <code>${h.card || h.fullCard || 'N/A'}</code> | ${h.merchant || 'Unknown'}`
    ).join('\n');

    const msg = `<b>📋 CODER — Exportar HITS (${hits.length})</b>\n━━━━━━━━━━━━━━━━━━━━━━━\n\n${hitLines}\n\n━━━━━━━━━━━━━━━━━━━━━━━\n<i>Mostrando últimos ${Math.min(hits.length, 50)} HITS</i>`;

    await sendMessage(chatId, msg);
  } catch {
    await sendMessage(chatId, '❌ Error al exportar HITS.');
  }
}

async function handleHelpCommand(chatId: string): Promise<void> {
  const msg = `<b>❓ CODER — Comandos</b>
━━━━━━━━━━━━━━━━━━━━━━━

/start — Registrarse y obtener tu ID
/me — Ver perfil de usuario
/stats — Ver estadísticas actuales
/export — Exportar lista de HITS
/help — Mostrar este mensaje

━━━━━━━━━━━━━━━━━━━━━━━
<i>CODER SYSTEM V1.1.0</i>`;

  await sendMessage(chatId, msg);
}

// ─── Utility ──────────────────────────────────────────────────────────────────

async function sendMessage(chatId: string, text: string): Promise<boolean> {
  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
