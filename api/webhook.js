/**
 * CODEX(R) — Vercel Serverless Webhook Endpoint for Telegram Bot
 *
 * Hosted on Vercel: https://<your-vercel-app>.vercel.app/api/webhook
 * Receives instant POST requests from Telegram whenever users send commands.
 */

import {
  getOrRegisterUser,
  getVipStatus,
  loadUsersDb,
  saveUsersDb
} from '../server/botServer.mjs';

const BOT_TOKEN  = process.env.BOT_TOKEN || '8953633941:AAE8E0o00iIlVBnP57_y3Q8UIk5I_-ZwRCw';
const API_BASE   = `https://api.telegram.org/bot${BOT_TOKEN}`;
const OWNER_IDS  = ['7794982496', '7317734631'];
const OWNER_LINK = 'https://t.me/S_14xx';

function isOwner(telegramId) {
  const idStr = String(telegramId).trim();
  return OWNER_IDS.includes(idStr);
}

async function apiCall(method, params = {}) {
  const url = `${API_BASE}/${method}`;
  const res = await fetch(url, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify(params),
  });
  return res.json();
}

async function sendMessage(chatId, text, extra = {}) {
  return apiCall('sendMessage', {
    chat_id   : chatId,
    text,
    parse_mode: 'HTML',
    ...extra,
  });
}

const OWNER_1_LINK = 'https://t.me/S_14xx';
const OWNER_2_LINK = 'https://t.me/mrcodexofc';

function getNoPlanKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '👑 Owner 1: @S_14xx', url: OWNER_1_LINK },
          { text: '👑 Owner 2: @mrcodexofc', url: OWNER_2_LINK },
        ],
        [
          { text: '👤 Ver Mi Perfil / Estado', callback_data: 'check_profile' },
        ],
      ],
    },
  };
}

function getActivePlanKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '👑 Owner 1: @S_14xx', url: OWNER_1_LINK },
          { text: '👑 Owner 2: @mrcodexofc', url: OWNER_2_LINK },
        ],
        [
          { text: '👤 Ver Mi Perfil', callback_data: 'check_profile' },
        ],
      ],
    },
  };
}

async function handleStart(msg) {
  const chatId = String(msg.chat.id);
  const from = msg.from || {};
  const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || 'Operador';
  const username = from.username ? `@${from.username}` : '';

  const user = getOrRegisterUser(chatId, { name, username });
  const status = getVipStatus(user);

  if (status.hasPlan) {
    await sendMessage(chatId,
      `👋 <b>¡Hola, ${user.name}!</b>\n\n` +
      `Bienvenido a <b>CODEX(R) SYSTEM</b>.\n\n` +
      `👤 <b>Nombre:</b> ${user.name}\n` +
      `📌 <b>Tu ID de Telegram:</b> <code>${chatId}</code>\n` +
      `💬 <b>Usuario:</b> <code>${user.username || 'Sin @'}</code>\n` +
      `🌟 <b>Membresía:</b> ✅ <b>${status.label}</b>\n\n` +
      `<b>Comandos disponibles:</b>\n` +
      `🔹 /me — Ver tu perfil de acceso\n` +
      `🔹 /help — Lista de comandos`,
      getActivePlanKeyboard()
    );
  } else {
    await sendMessage(chatId,
      `👋 <b>¡Hola, ${user.name}!</b>\n\n` +
      `👤 <b>Nombre:</b> ${user.name}\n` +
      `📌 <b>Tu ID de Telegram:</b> <code>${chatId}</code> fue verificado.\n` +
      `💬 <b>Usuario:</b> <code>${user.username || 'Sin @'}</code>\n` +
      `⚠️ <b>Estado:</b> ❌ <b>SIN PLAN VIP ACTIVO</b>\n\n` +
      `Para ingresar a la extensión y obtener tus códigos de acceso OTP, necesitas un <b>Plan VIP</b>.\n\n` +
      `Ponte en contacto con cualquiera de nuestros administradores para activar tu membresía.`,
      getNoPlanKeyboard()
    );
  }
}

async function handleProfile(msg) {
  const chatId = String(msg.chat.id);
  const from = msg.from || {};
  const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || 'Operador';
  const username = from.username ? `@${from.username}` : '';

  const user = getOrRegisterUser(chatId, { name, username });
  const status = getVipStatus(user);

  const expDateStr = isOwner(user.telegramId) || user.role === 'owner'
    ? 'VIP OWNER (Ilimitado)'
    : user.planExpiry
      ? new Date(user.planExpiry).toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' })
      : 'Sin plan activo';

  const text =
    `👤 <b>CODEX(R) — Perfil de Usuario</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `👤 <b>Nombre:</b> ${user.name}\n` +
    `🆔 <b>Telegram ID:</b> <code>${chatId}</code>\n` +
    `💬 <b>Usuario:</b> ${user.username || 'Sin @'}\n` +
    `🌟 <b>Membresía:</b> ${status.hasPlan ? '✅ ' + status.label : '❌ SIN PLAN'}\n` +
    `📅 <b>Expiración:</b> ${expDateStr}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `<i>Ingresa tu ID <code>${chatId}</code> en el panel de la extensión CODEX(R) para iniciar sesión.</i>`;

  const keyboard = status.hasPlan ? getActivePlanKeyboard() : getNoPlanKeyboard();
  await sendMessage(chatId, text, keyboard);
}

async function handleVipCommand(msg) {
  const chatId = String(msg.chat.id);
  if (chatId !== OWNER_ID) {
    await sendMessage(chatId, '❌ <b>Acceso Denegado.</b> Este comando es exclusivo del Administrador.');
    return;
  }

  const parts = msg.text.trim().split(/\s+/);
  if (parts.length < 3) {
    await sendMessage(chatId,
      `💡 <b>Uso del comando /vip:</b>\n` +
      `<code>/vip [telegramId o @username] [días]</code>\n\n` +
      `Ejemplo: <code>/vip 7794982496 30</code>`
    );
    return;
  }

  const targetInput = parts[1];
  const daysNum = parseInt(parts[2], 10);
  if (isNaN(daysNum) || daysNum <= 0) {
    await sendMessage(chatId, '❌ Los días deben ser un número mayor a 0.');
    return;
  }

  const users = loadUsersDb();
  let user = users.find((u) =>
    u.telegramId === targetInput ||
    (u.username && u.username.toLowerCase() === targetInput.toLowerCase()) ||
    (u.username && u.username.toLowerCase() === `@${targetInput.toLowerCase().replace('@', '')}`)
  );

  const now = Date.now();
  let baseExpiry = (user && user.planExpiry && user.planExpiry > now) ? user.planExpiry : now;
  const newExpiry = baseExpiry + (daysNum * 86400000);

  if (!user) {
    const isId = /^\d+$/.test(targetInput);
    user = {
      telegramId: isId ? targetInput : `user_${Date.now()}`,
      username: isId ? '' : (targetInput.startsWith('@') ? targetInput : `@${targetInput}`),
      name: isId ? `User ${targetInput}` : targetInput.replace('@', ''),
      role: 'vip',
      planExpiry: newExpiry,
      createdAt: now,
    };
    users.push(user);
  } else {
    user.planExpiry = newExpiry;
    user.role = user.role === 'owner' ? 'owner' : 'vip';
  }

  saveUsersDb(users);

  const expDateStr = new Date(newExpiry).toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });

  await sendMessage(chatId,
    `🎉 <b>¡PLAN VIP OTORGADO CON ÉXITO!</b>\n\n` +
    `👤 <b>Usuario:</b> ${user.name} (${user.username || 'Sin @'})\n` +
    `🆔 <b>ID:</b> <code>${user.telegramId}</code>\n` +
    `⏳ <b>Días Agregados:</b> ${daysNum} días\n` +
    `📅 <b>Nueva Fecha Expiración:</b> ${expDateStr}`
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'online', system: 'CODEX(R) Telegram Webhook Engine' });
  }

  const update = req.body;
  if (!update) return res.status(200).send('OK');

  try {
    if (update.callback_query) {
      const data = update.callback_query.data;
      if (data === 'check_profile') {
        await handleProfile(update.callback_query.message);
      }
    } else if (update.message && update.message.text) {
      const msg = update.message;
      const text = msg.text.trim().toLowerCase();

      if (text.startsWith('/start')) await handleStart(msg);
      else if (text.startsWith('/me') || text.startsWith('/perfil')) await handleProfile(msg);
      else if (text.startsWith('/vip')) await handleVipCommand(msg);
    }
  } catch (err) {
    console.error('[WEBHOOK ERROR]', err);
  }

  return res.status(200).send('OK');
}
