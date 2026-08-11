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
  handleVipCommand
} from './handlers/commandHandlers.mjs';
import { getOrRegisterUser } from './database/userStore.mjs';

export async function processUpdate(update) {
  if (update.message && update.message.text) {
    const msg = update.message;
    const text = msg.text.trim();
    const chatId = String(msg.chat.id);
    const from = msg.from || {};
    const userId = String(from.id || msg.chat.id);
    const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || 'Operador';
    const username = from.username ? `@${from.username}` : '';

    getOrRegisterUser(userId, { name, username });

    const cmd = text.split(/\s+/)[0].toLowerCase().replace(/@.*$/, '');

    switch (cmd) {
      case '/start':
        await handleStart(msg);
        break;
      case '/register':
      case '/registro':
        await handleRegister(msg);
        break;
      case '/gen':
      case '/generate':
      case '/cards':
        await handleGenCommand(msg);
        break;
      case '/chk':
      case '/check':
      case '/scan':
        await handleChkCommand(msg);
        break;
      case '/broadcast':
      case '/anuncio':
        await handleBroadcastCommand(msg);
        break;
      case '/me':
      case '/perfil':
        await handleProfile(msg);
        break;
      case '/vip':
        await handleVipCommand(msg);
        break;
      case '/removevip':
        await handleRemoveVipCommand(msg);
        break;
      case '/users':
      case '/usuarios':
        await handleListUsersCommand(msg);
        break;
      case '/status':
      case '/estado':
        await handleStatus(msg);
        break;
      case '/extension':
      case '/zip':
        await handleExtension(msg);
        break;
      case '/help':
      case '/ayuda':
        await handleHelp(msg);
        break;
      default:
        break;
    }
  } else if (update.callback_query) {
    await handleCallbackQuery(update.callback_query);
  }
}

let offset = 0;

export async function pollUpdates() {
  try {
    const res = await apiCall('getUpdates', {
      offset,
      timeout: 20,
      allowed_updates: ['message', 'callback_query'],
    });

    if (res.ok && Array.isArray(res.result)) {
      for (const update of res.result) {
        offset = update.update_id + 1;
        await processUpdate(update);
      }
    } else if (res.error_code === 409) {
      console.warn('[BOT] Conflicto 409 detectado. Asegúrate de cerrar otras instancias del bot.');
    }
  } catch (err) {
    console.error('[BOT] Polling error:', err.message);
  }

  setTimeout(pollUpdates, 1500);
}

export async function startBot() {
  console.log('\n🚀 CODEX(R) Bot & VIP Manager iniciado (Arquitectura Modular)');
  console.log(`   Bot: @CodexrOutBot`);
  console.log(`   Owner IDs: ${OWNER_IDS.join(', ')}`);
  console.log(`   Comandos Admin: /vip  /removevip  /users`);
  console.log(`   Comandos Usuario: /start  /me  /extension  /status\n`);

  startHealthServer();

  try {
    await apiCall('deleteWebhook', { drop_pending_updates: false });
  } catch {}

  pollUpdates();
}

// Auto start bot if directly invoked
if (process.argv[1] && process.argv[1].endsWith('index.mjs')) {
  startBot();
} else {
  startBot();
}
