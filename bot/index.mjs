import { BOT_TOKEN, OWNER_IDS } from './config/constants.mjs';
import { apiCall } from './services/telegramApi.mjs';
import { startHealthServer } from './services/healthServer.mjs';
import { handleCallbackQuery } from './handlers/callbackHandlers.mjs';
import {
  handleBroadcastCommand,
  handleChkCommand,
  handleExtension,
  handleGenCommand,
  handleHelp,
  handleListUsersCommand,
  handleProfile,
  handleRegister,
  handleRemoveVipCommand,
  handleStart,
  handleStatus,
  handleVipCommand,
  handleRefCommand
} from './handlers/commandHandlers.mjs';
import { getOrRegisterUser } from './database/userStore.mjs';

// ─── Command Router ──────────────────────────────────────────────────────────
const COMMAND_MAP = {
  '/start':     handleStart,
  '/register':  handleRegister,
  '/registro':  handleRegister,
  '/gen':       handleGenCommand,
  '/generate':  handleGenCommand,
  '/cards':     handleGenCommand,
  '/chk':       handleChkCommand,
  '/check':     handleChkCommand,
  '/scan':      handleChkCommand,
  '/broadcast': handleBroadcastCommand,
  '/anuncio':   handleBroadcastCommand,
  '/me':        handleProfile,
  '/perfil':    handleProfile,
  '/vip':       handleVipCommand,
  '/removevip': handleRemoveVipCommand,
  '/users':     handleListUsersCommand,
  '/usuarios':  handleListUsersCommand,
  '/status':    handleStatus,
  '/estado':    handleStatus,
  '/extension': handleExtension,
  '/zip':       handleExtension,
  '/help':      handleHelp,
  '/ayuda':     handleHelp,
  '/ref':       handleRefCommand,
};

// ─── Update Processor ────────────────────────────────────────────────────────
export async function processUpdate(update) {
  try {
    if (update.message) {
      const msg = update.message;
      const text = (msg.text || msg.caption || '').trim();
      const from = msg.from || {};
      const userId = String(from.id || msg.chat.id);
      const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || 'Operador';
      const username = from.username ? `@${from.username}` : '';

      // Register/update user silently — never let this crash the handler
      try {
        getOrRegisterUser(userId, { name, username });
      } catch (regErr) {
        console.error('[BOT] Error registering user:', regErr.message);
      }

      const cmd = text.split(/\s+/)[0].toLowerCase().replace(/@.*$/, '');
      const handler = COMMAND_MAP[cmd];

      if (handler) {
        try {
          await handler(msg);
        } catch (cmdErr) {
          console.error(`[BOT] Error in handler for ${cmd}:`, cmdErr.message);
        }
      }
    } else if (update.callback_query) {
      try {
        await handleCallbackQuery(update.callback_query);
      } catch (cbErr) {
        console.error('[BOT] Error in callback handler:', cbErr.message);
      }
    }
  } catch (fatalErr) {
    console.error('[BOT] Fatal error processing update:', fatalErr.message);
  }
}

// ─── Polling Engine with Backoff ─────────────────────────────────────────────
let offset = 0;
let consecutiveErrors = 0;
const BASE_DELAY = 1000;
const MAX_DELAY = 30000;

export async function pollUpdates() {
  try {
    const res = await apiCall('getUpdates', {
      offset,
      timeout: 25,
      allowed_updates: ['message', 'callback_query'],
    });

    if (res.ok && Array.isArray(res.result)) {
      consecutiveErrors = 0; // Reset on success
      for (const update of res.result) {
        offset = update.update_id + 1;
        await processUpdate(update);
      }
    } else if (res.error_code === 409) {
      console.warn('[BOT] Conflicto 409 — otra instancia activa. Reintentando deleteWebhook...');
      try {
        await apiCall('deleteWebhook', { drop_pending_updates: true });
      } catch {}
      consecutiveErrors++;
    } else if (res.error_code === 429) {
      // Rate limited by Telegram
      const retryAfter = (res.parameters?.retry_after || 5) * 1000;
      console.warn(`[BOT] Rate limited. Esperando ${retryAfter / 1000}s...`);
      await sleep(retryAfter);
      consecutiveErrors = 0;
    } else {
      console.warn('[BOT] Unexpected getUpdates response:', JSON.stringify(res).slice(0, 200));
      consecutiveErrors++;
    }
  } catch (err) {
    console.error('[BOT] Polling network error:', err.message);
    consecutiveErrors++;
  }

  // Exponential backoff: 1s → 2s → 4s → 8s → ... → 30s max
  const delay = Math.min(BASE_DELAY * Math.pow(2, consecutiveErrors), MAX_DELAY);
  setTimeout(pollUpdates, delay);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Bot Startup ─────────────────────────────────────────────────────────────
export async function startBot() {
  console.log('\n🚀 CODEX® Bot & VIP Manager iniciado (Arquitectura Modular)');
  console.log(`   Bot: @CodexrOutBot`);
  console.log(`   Owner IDs: ${OWNER_IDS.join(', ')}`);
  console.log(`   Comandos Admin: /vip  /removevip  /users  /broadcast`);
  console.log(`   Comandos Usuario: /start  /register  /me  /gen  /chk  /extension  /status  /help\n`);

  startHealthServer();

  // Force clean webhook state before starting long-polling
  try {
    await apiCall('deleteWebhook', { drop_pending_updates: false });
    console.log('[BOT] Webhook eliminado correctamente. Iniciando long-polling...');
  } catch (err) {
    console.warn('[BOT] No se pudo eliminar webhook:', err.message);
  }

  // Small delay to let any previous instance release the getUpdates lock
  await sleep(2000);

  pollUpdates();
}

// ─── Graceful Shutdown ───────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('[BOT] SIGTERM recibido. Cerrando bot...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[BOT] SIGINT recibido. Cerrando bot...');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('[BOT] Excepción no capturada:', err.message);
  // Don't exit — keep running
});

process.on('unhandledRejection', (reason) => {
  console.error('[BOT] Promesa rechazada sin manejar:', reason);
  // Don't exit — keep running
});

// Auto-start
startBot();
