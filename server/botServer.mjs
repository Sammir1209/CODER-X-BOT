/**
 * CODEX(R) — Telegram Bot Server & VIP User Management
 *
 * Handles VIP plan subscriptions, user registration, OTP generation,
 * and extension distribution (.zip) via Telegram.
 *
 * Commands:
 *   /start              — Register user profile & view VIP status
 *   /me                 — View your user profile & active plan
 *   /extension          — Build and download updated extension (.zip) (VIP required)
 *   /vip <id/@user> <d> — [ADMIN] Grant X days of VIP plan to user
 *   /removevip <id>     — [ADMIN] Revoke VIP plan from user
 *   /users              — [ADMIN] List all registered users & VIP plans
 *   /status             — Server & build status
 *   /help               — Command list
 */

import { execSync } from 'child_process';
import { createReadStream, existsSync, statSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import FormData from 'form-data';
import { createClient } from '@supabase/supabase-js';

// ─── Config ──────────────────────────────────────────────────────────────────

const BOT_TOKEN = process.env.BOT_TOKEN || '8953633941:AAE8E0o00iIlVBnP57_y3Q8UIk5I_-ZwRCw';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ypqthyglthytkwcikczz.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwcXRoeWdsdGh5dGt3Y2lrY3p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzMTQwMzksImV4cCI6MjEwMTg5MDAzOX0.6V5xYGmzwJ_YJYAxFiYORewn5t3cggtS-dzSyFBlwuw';
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST_DIR = resolve(ROOT, 'dist');
const ZIP_PATH = resolve(ROOT, 'CODEX_R_Extension.zip');
const DB_FILE = resolve(__dirname, 'usersDb.json');

// Admin / Owner Telegram IDs
const OWNER_IDS  = ['7794982496', '7317734631'];
const OWNER_LINK = 'https://t.me/S_14xx';

export function isOwner(telegramId) {
  const idStr = String(telegramId).trim();
  return OWNER_IDS.includes(idStr);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function syncUserToSupabase(user) {
  try {
    await supabase.from('codex_users').upsert({
      telegram_id: String(user.telegramId),
      username: user.username || null,
      name: user.name || 'User',
      role: user.role || 'user',
      plan_expiry: user.planExpiry || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'telegram_id' });
  } catch (e) {
    console.warn('[SUPABASE] Warning syncing user:', e.message);
  }
}

// ─── User Database Manager ───────────────────────────────────────────────────

export function loadUsersDb() {
  if (!existsSync(DB_FILE)) {
    const initial = [
      {
        telegramId: '7794982496',
        username: '@S_14xx',
        name: '𝐶𝑜𝑑𝑒𝑟 | ɮʟʊɛʟօօƈӄ | 『 𝙏𝙚𝙖𝙢 𝙉𝙚𝙭𝙪𝙨 』',
        role: 'owner',
        planExpiry: 4102444800000,
        createdAt: 1770000000000,
      },
      {
        telegramId: '7317734631',
        username: '@mrcodexofc',
        name: '𝐌𝐫. 𝐂𝐎𝐃𝐄𝐗',
        role: 'owner',
        planExpiry: 4102444800000,
        createdAt: 1786319145409,
      },
    ];
    saveUsersDb(initial);
    return initial;
  }
  try {
    const content = readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export function saveUsersDb(users) {
  writeFileSync(DB_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

export function getOrRegisterUser(telegramId, userInfo = {}) {
  const users = loadUsersDb();
  const idStr = String(telegramId).trim();

  const inputName = userInfo.name || '';
  const inputUsername = userInfo.username
    ? (userInfo.username.startsWith('@') ? userInfo.username : `@${userInfo.username}`)
    : '';

  // 1. Search by numeric Telegram ID
  let user = users.find((u) => u.telegramId === idStr);

  // 2. Fallback: Search by username if registered before /start (e.g. via /vip @user)
  if (!user && inputUsername) {
    const cleanInputUser = inputUsername.toLowerCase().replace('@', '');
    user = users.find((u) => u.username && u.username.toLowerCase().replace('@', '') === cleanInputUser);
    if (user) {
      user.telegramId = idStr; // Bind real numeric ID
    }
  }

  const name = inputName || user?.name || `User ${idStr}`;
  const username = inputUsername || user?.username || '';

  if (!user) {
    user = {
      telegramId: idStr,
      username,
      name,
      role: isOwner(idStr) ? 'owner' : 'user',
      planExpiry: isOwner(idStr) ? 4102444800000 : null,
      createdAt: Date.now(),
    };
    users.push(user);
    saveUsersDb(users);
  } else {
    let updated = false;
    if (name && user.name !== name) { user.name = name; updated = true; }
    if (username && user.username !== username) { user.username = username; updated = true; }
    if (isOwner(idStr)) {
      if (user.role !== 'owner') { user.role = 'owner'; updated = true; }
      if (user.planExpiry !== 4102444800000) { user.planExpiry = 4102444800000; updated = true; }
    }
    if (updated) saveUsersDb(users);
  }

  // Sync with Supabase asynchronously
  syncUserToSupabase(user).catch(() => {});

  return user;
}

export function getVipStatus(user) {
  if (!user) return { hasPlan: false, daysLeft: 0, label: 'Sin Registro' };
  if (isOwner(user.telegramId) || user.role === 'owner') {
    return { hasPlan: true, daysLeft: 9999, label: 'VIP OWNER (Ilimitado)' };
  }
  if (!user.planExpiry) {
    return { hasPlan: false, daysLeft: 0, label: 'Sin Plan Activo' };
  }

  const now = Date.now();
  if (user.planExpiry <= now) {
    return { hasPlan: false, daysLeft: 0, label: 'Plan Expirado' };
  }

  const diffMs = user.planExpiry - now;
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return {
    hasPlan: true,
    daysLeft,
    label: `VIP ACTIVO (${daysLeft}d restantes)`,
  };
}

// ─── Telegram API Helpers ─────────────────────────────────────────────────────

async function apiCall(method, params = {}) {
  const url = `${API_BASE}/${method}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
}

async function sendMessage(chatId, text, extra = {}) {
  return apiCall('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    ...extra,
  });
}

async function sendDocument(chatId, filePath, caption = '', extra = {}) {
  try {
    const fileBuffer = readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: 'application/zip' });
    const formData = new globalThis.FormData();
    formData.append('chat_id', String(chatId));
    formData.append('caption', caption);
    formData.append('parse_mode', 'HTML');
    formData.append('document', blob, 'CODEX_R_Extension.zip');

    const res = await fetch(`${API_BASE}/sendDocument`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (data.ok) return data;
  } catch (e) {
    console.warn('[BOT] Native FormData upload failed, retrying stream upload:', e.message);
  }

  // Fallback to npm form-data stream
  const form = new FormData();
  form.append('chat_id', String(chatId));
  form.append('caption', caption);
  form.append('parse_mode', 'HTML');
  form.append('document', createReadStream(filePath), {
    filename: 'CODEX_R_Extension.zip',
    contentType: 'application/zip',
  });

  const res = await fetch(`${API_BASE}/sendDocument`, {
    method: 'POST',
    headers: form.getHeaders(),
    body: form,
  });
  return res.json();
}

const OWNER_1_LINK = 'https://t.me/S_14xx';
const OWNER_2_LINK = 'https://t.me/mrcodexofc';

// ─── NewsEmoji Custom Telegram Emoji IDs ──────────────────────────────────────

const EMOJI = {
  LIGHTNING: '<tg-emoji emoji-id="5456140674028019486">⚡️</tg-emoji>',
  DIAMOND:   '<tg-emoji emoji-id="5427168083074628963">💎</tg-emoji>',
  CROWN:     '<tg-emoji emoji-id="5217822164362739968">👑</tg-emoji>',
  SHIELD:    '<tg-emoji emoji-id="5251203410396458957">🛡</tg-emoji>',
  LOCK:      '<tg-emoji emoji-id="5296369303661067030">🔒</tg-emoji>',
  GEAR:      '<tg-emoji emoji-id="5341715473882955310">⚙️</tg-emoji>',
  CHART:     '<tg-emoji emoji-id="5231200819986047254">📊</tg-emoji>',
  GREEN:     '<tg-emoji emoji-id="5416081784641168838">🟢</tg-emoji>',
  RED:       '<tg-emoji emoji-id="5411225014148014586">🔴</tg-emoji>',
  ARROW:     '<tg-emoji emoji-id="5416117059207572332">➡️</tg-emoji>',
  PIN:       '<tg-emoji emoji-id="5397782960512444700">📌</tg-emoji>',
  CALENDAR:  '<tg-emoji emoji-id="5413879192267805083">🗓</tg-emoji>',
  SPARKLES:  '<tg-emoji emoji-id="5325547803936572038">✨</tg-emoji>',
  STAR:      '<tg-emoji emoji-id="5438496463044752972">⭐️</tg-emoji>',
  PLUS:      '<tg-emoji emoji-id="5397916757333654639">➕</tg-emoji>',
  INFO:      '<tg-emoji emoji-id="5334544901428229844">ℹ️</tg-emoji>',
  CHAT:      '<tg-emoji emoji-id="5443038326535759644">💬</tg-emoji>',
  GLOBE:     '<tg-emoji emoji-id="5447410659077661506">🌐</tg-emoji>',
  WARNING:   '<tg-emoji emoji-id="5447644880824181073">⚠️</tg-emoji>',
  CROSS:     '<tg-emoji emoji-id="5210952531676504517">❌</tg-emoji>',
  CHECK:     '<tg-emoji emoji-id="5206607081334906820">✔️</tg-emoji>',
  PARTY:     '<tg-emoji emoji-id="5461151367559141950">🎉</tg-emoji>',
};

// ─── Standard Buttons ─────────────────────────────────────────────────────────

function getNoPlanKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🔹 COMPRAR PLAN | @S_14xx 🔹', url: OWNER_1_LINK },
        ],
        [
          { text: '🔹 COMPRAR PLAN | @mrcodexofc 🔹', url: OWNER_2_LINK },
        ],
        [
          { text: '👤 MI PERFIL / ESTADO', callback_data: 'check_profile' },
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
          { text: '📦 DESCARGAR EXTENSIÓN VIP (.ZIP)', callback_data: 'get_extension' },
        ],
        [
          { text: '👑 OWNER | @S_14xx', url: OWNER_1_LINK },
          { text: '👑 OWNER | @mrcodexofc', url: OWNER_2_LINK },
        ],
        [
          { text: '👤 MI PERFIL / ESTADO', callback_data: 'check_profile' },
        ],
      ],
    },
  };
}

// ─── Command Handlers ─────────────────────────────────────────────────────────

async function handleStart(msg) {
  const chatId = String(msg.chat.id);
  const from = msg.from || {};
  const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || 'Operador';
  const username = from.username ? `@${from.username}` : '';

  const user = getOrRegisterUser(chatId, { name, username });
  const status = getVipStatus(user);

  if (status.hasPlan) {
    await sendMessage(chatId,
      `${EMOJI.LIGHTNING} <b>CODEX(R) SYSTEM — PLATAFORMA DE CONTROL</b> ${EMOJI.LIGHTNING}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `${EMOJI.SPARKLES} <b>¡Hola, ${user.name}!</b>\n` +
      `Tu identidad ha sido verificada en el servidor central.\n\n` +
      `${EMOJI.CHART} <b>DATOS DE TU CUENTA</b>\n` +
      ` ├ 👤 <b>Nombre:</b> ${user.name}\n` +
      ` ├ 🆔 <b>ID Telegram:</b> <code>${chatId}</code>\n` +
      ` └ 💬 <b>Usuario:</b> ${user.username || 'Sin Username'}\n\n` +
      `${EMOJI.DIAMOND} <b>ESTADO DE SUSCRIPCIÓN</b>\n` +
      ` └ 🌟 <b>Membresía:</b> ${EMOJI.CHECK} <b>${status.label}</b>\n\n` +
      `${EMOJI.PIN} <b>COMANDOS RÁPIDOS:</b>\n` +
      ` 🔹 /extension — Descargar paquete de extensión (.zip)\n` +
      ` 🔹 /me — Ver tu perfil de acceso\n` +
      ` 🔹 /help — Lista de comandos`,
      getActivePlanKeyboard()
    );
  } else {
    await sendMessage(chatId,
      `${EMOJI.LIGHTNING} <b>CODEX(R) SYSTEM — PLATAFORMA DE CONTROL</b> ${EMOJI.LIGHTNING}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `👋 <b>¡Hola, ${user.name}!</b>\n` +
      `Tu ID de Telegram ha sido registrado correctamente.\n\n` +
      `${EMOJI.CHART} <b>DATOS REGISTRADOS</b>\n` +
      ` ├ 👤 <b>Nombre:</b> ${user.name}\n` +
      ` ├ 🆔 <b>ID Telegram:</b> <code>${chatId}</code>\n` +
      ` └ 💬 <b>Usuario:</b> ${user.username || 'Sin Username'}\n\n` +
      `${EMOJI.WARNING} <b>ESTADO DE SUSCRIPCIÓN</b>\n` +
      ` └ ${EMOJI.CROSS} <b>SIN PLAN VIP ACTIVO</b>\n\n` +
      `${EMOJI.LOCK} <i>Para acceder a la extensión CODEX(R) y generar códigos OTP, adquiere un Plan VIP con nuestros Administradores.</i>`,
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
    `${EMOJI.DIAMOND} <b>CODEX(R) — PANEL DE PERFIL DE OPERADOR</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `👤 <b>INFORMACIÓN PERSONAL</b>\n` +
    ` ├ 🪪 <b>Nombre:</b> ${user.name}\n` +
    ` ├ 🆔 <b>Telegram ID:</b> <code>${chatId}</code>\n` +
    ` └ 💬 <b>Handle:</b> ${user.username || 'Sin @'}\n\n` +
    `${EMOJI.SHIELD} <b>ESTADO Y LICENCIA</b>\n` +
    ` ├ 🌟 <b>Rango:</b> ${isOwner(user.telegramId) || user.role === 'owner' ? `${EMOJI.CROWN} OWNER (Ilimitado)` : user.role.toUpperCase()}\n` +
    ` ├ 🔑 <b>Estado VIP:</b> ${status.hasPlan ? `${EMOJI.CHECK} ACTIVO` : `${EMOJI.CROSS} INACTIVO`}\n` +
    ` └ ${EMOJI.CALENDAR} <b>Expiración:</b> <code>${expDateStr}</code>\n\n` +
    `${EMOJI.LIGHTNING} <b>CÓDIGO DE ACCESO PANEL</b>\n` +
    ` └ 🗝️ <code>${chatId}</code>\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `<i>Ingresa tu ID <code>${chatId}</code> en el panel de la extensión CODEX(R) para iniciar sesión.</i>`;

  const keyboard = status.hasPlan ? getActivePlanKeyboard() : getNoPlanKeyboard();
  await sendMessage(chatId, text, keyboard);
}

async function handleVipCommand(msg) {
  const chatId = String(msg.chat.id);
  if (!isOwner(chatId)) {
    await sendMessage(chatId, `${EMOJI.CROSS} <b>Acceso Denegado.</b> Este comando es exclusivo del Administrador.`);
    return;
  }

  const parts = msg.text.trim().split(/\s+/);
  if (parts.length < 3) {
    await sendMessage(chatId,
      `${EMOJI.INFO} <b>CODEX(R) — USO DEL COMANDO /vip</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Sintaxis: <code>/vip [telegramId o @username] [días]</code>\n\n` +
      `Ejemplos:\n` +
      `• <code>/vip 7794982496 30</code>\n` +
      `• <code>/vip @mrcodexofc 60</code>`
    );
    return;
  }

  const targetInput = parts[1];
  const daysNum = parseInt(parts[2], 10);

  if (isNaN(daysNum) || daysNum <= 0) {
    await sendMessage(chatId, `${EMOJI.CROSS} <b>Error:</b> Los días deben ser un número entero mayor a 0.`);
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
  syncUserToSupabase(user).catch(() => {});

  const expDateStr = new Date(newExpiry).toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });

  // 1. Notify Owner
  await sendMessage(chatId,
    `${EMOJI.PARTY} <b>CODEX(R) — MEMBRESÍA VIP ACTIVADA CON ÉXITO</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `👤 <b>DATOS DEL OPERADOR</b>\n` +
    ` ├ 🪪 <b>Nombre:</b> ${user.name}\n` +
    ` ├ 💬 <b>Usuario:</b> ${user.username || 'Sin @'}\n` +
    ` └ 🆔 <b>Telegram ID:</b> <code>${user.telegramId}</code>\n\n` +
    `${EMOJI.STAR} <b>LICENCIA CONCEDIDA</b>\n` +
    ` ├ ${EMOJI.PLUS} <b>Días Agregados:</b> <code>+${daysNum} Días</code>\n` +
    ` └ ${EMOJI.CALENDAR} <b>Nueva Expiración:</b> <code>${expDateStr}</code>\n\n` +
    `${EMOJI.CROWN} <i>Otorgado por el Administrador de CODEX(R) System.</i>`
  );

  // 2. Notify Target User if valid Telegram ID
  if (/^\d+$/.test(user.telegramId)) {
    try {
      await sendMessage(user.telegramId,
        `${EMOJI.PARTY} <b>¡TU PLAN VIP HA SIDO ACTIVADO!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `El administrador te ha otorgado <b>${daysNum} días</b> de membresía VIP.\n\n` +
        `${EMOJI.CALENDAR} <b>Fecha Expiración:</b> <code>${expDateStr}</code>\n\n` +
        `🔑 Tu código de acceso para la extensión es: <code>${user.telegramId}</code>`,
        getActivePlanKeyboard()
      );
    } catch { }
  }
}

async function handleRemoveVipCommand(msg) {
  const chatId = String(msg.chat.id);
  if (!isOwner(chatId)) {
    await sendMessage(chatId, `${EMOJI.CROSS} Acceso denegado.`);
    return;
  }

  const parts = msg.text.trim().split(/\s+/);
  if (parts.length < 2) {
    await sendMessage(chatId, `${EMOJI.INFO} Uso: <code>/removevip [telegramId o @username]</code>`);
    return;
  }

  const targetInput = parts[1];
  const users = loadUsersDb();
  const user = users.find((u) =>
    u.telegramId === targetInput ||
    (u.username && u.username.toLowerCase() === targetInput.toLowerCase()) ||
    (u.username && u.username.toLowerCase() === `@${targetInput.toLowerCase().replace('@', '')}`)
  );

  if (!user) {
    await sendMessage(chatId, `${EMOJI.CROSS} Usuario no encontrado en la base de datos.`);
    return;
  }

  user.planExpiry = null;
  user.role = 'user';
  saveUsersDb(users);
  syncUserToSupabase(user).catch(() => {});

  await sendMessage(chatId,
    `🚫 <b>CODEX(R) — PLAN VIP REMOVIDO</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `👤 <b>Operador:</b> ${user.name}\n` +
    `🆔 <b>ID:</b> <code>${user.telegramId}</code>\n` +
    `${EMOJI.WARNING} <b>Estado:</b> ${EMOJI.CROSS} Membresía VIP cancelada.`
  );
}

async function handleListUsersCommand(msg) {
  const chatId = String(msg.chat.id);
  if (!isOwner(chatId)) {
    await sendMessage(chatId, `${EMOJI.CROSS} Acceso denegado.`);
    return;
  }

  const users = loadUsersDb();
  if (users.length === 0) {
    await sendMessage(chatId, `${EMOJI.INFO} No hay usuarios registrados.`);
    return;
  }

  let text =
    `${EMOJI.CHART} <b>CODEX(R) — BASE DE DATOS DE OPERADORES (${users.length})</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  users.forEach((u, idx) => {
    const status = getVipStatus(u);
    const badge = isOwner(u.telegramId) || u.role === 'owner' ? EMOJI.CROWN : '👤';
    text += `<b>${idx + 1}.</b> ${badge} <b>${u.name}</b> (${u.username || 'Sin @'})\n`;
    text += `   └ 🆔 <code>${u.telegramId}</code> | 🌟 <b>${status.label}</b>\n\n`;
  });

  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${EMOJI.CHART} Total Registrados: <code>${users.length}</code>`;

  await sendMessage(chatId, text);
}

async function handleStatus(msg) {
  const distExists = existsSync(DIST_DIR);
  const zipExists = existsSync(ZIP_PATH);
  const zipSize = zipExists ? `${(statSync(ZIP_PATH).size / 1024 / 1024).toFixed(1)} MB` : 'N/A';
  const usersCount = loadUsersDb().length;

  await sendMessage(msg.chat.id,
    `${EMOJI.CHART} <b>CODEX(R) — ESTADO TÉCNICO DEL SERVIDOR</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `${EMOJI.GLOBE} <b>INFRAESTRUCTURA DE RED</b>\n` +
    ` ├ 🤖 <b>Bot Telegram:</b> @CodexrOutBot\n` +
    ` ├ ${EMOJI.LIGHTNING} <b>Health Check Server:</b> <code>Online (Puerto 10000)</code>\n` +
    ` └ ☁️ <b>Base de Datos:</b> Supabase Connected\n\n` +
    `📦 <b>SISTEMA Y COMPILACIÓN</b>\n` +
    ` ├ 📁 <b>Extensión (dist/):</b> ${distExists ? `${EMOJI.CHECK} Compilado` : `${EMOJI.CROSS} Pendiente`}\n` +
    ` ├ 📦 <b>ZIP VIP:</b> ${zipExists ? `${EMOJI.CHECK} Listo (${zipSize})` : `${EMOJI.CROSS} Sin crear`}\n` +
    ` └ 👥 <b>Usuarios Registrados:</b> <code>${usersCount}</code>\n\n` +
    `${EMOJI.CALENDAR} <b>HORA SERVIDOR:</b> <code>${new Date().toLocaleString('es-MX')}</code>`
  );
}

async function handleExtension(msg) {
  const chatId = String(msg.chat.id);
  const from = msg.from || {};
  const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || 'Operador';
  const username = from.username ? `@${from.username}` : '';

  const user = getOrRegisterUser(chatId, { name, username });
  const status = getVipStatus(user);

  if (!status.hasPlan) {
    await sendMessage(chatId,
      `${EMOJI.LOCK} <b>CODEX(R) — ACCESO DENEGADO (SIN PLAN VIP)</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Hola <b>${user.name}</b>, tu ID de Telegram (<code>${chatId}</code>) no cuenta con una membresía VIP activa.\n\n` +
      `Para descargar el paquete de la extensión (.zip) y obtener tus códigos de acceso OTP, contacta a nuestros Administradores.`,
      getNoPlanKeyboard()
    );
    return;
  }

  await sendMessage(chatId,
    `${EMOJI.GEAR} <b>PREPARANDO PAQUETE DE EXTENSIÓN CODEX(R)...</b>\n` +
    `Verificando compilación del sistema y empaquetando archivo ZIP actualizado... por favor espera unos segundos.`
  );

  try {
    console.log(`[BOT] Preparando envío de extensión a usuario VIP ${chatId}...`);

    if (!existsSync(ZIP_PATH)) {
      console.log('[BOT] Compilando extensión...');
      execSync('npm run build', { cwd: ROOT, stdio: 'ignore' });
      execSync(
        `powershell -Command "Compress-Archive -Path '${DIST_DIR}\\*' -DestinationPath '${ZIP_PATH}' -Force"`,
        { cwd: ROOT, stdio: 'ignore' }
      );
      console.log('[BOT] ZIP empaquetado.');
    }

    const zipSize = existsSync(ZIP_PATH) ? (statSync(ZIP_PATH).size / 1024 / 1024).toFixed(1) : '1.5';
    const caption =
      `📦 <b>CODEX(R) — PAQUETE DE EXTENSIÓN VIP (V1.1)</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `👤 <b>USUARIO AUTORIZADO</b>\n` +
      ` ├ 👤 <b>Operador:</b> ${user.name}\n` +
      ` ├ ⏳ <b>Membresía:</b> ${status.label}\n` +
      ` └ 📁 <b>Tamaño Paquete:</b> <code>${zipSize} MB</code>\n\n` +
      `🚀 <b>GUÍA RÁPIDA DE INSTALACIÓN</b>\n` +
      ` 1️⃣ <b>Descomprime</b> el archivo <code>CODEX_R_Extension.zip</code>.\n` +
      ` 2️⃣ Abre Chrome e ingresa a <code>chrome://extensions</code>.\n` +
      ` 3️⃣ Activa el <b>"Modo desarrollador"</b> arriba a la derecha.\n` +
      ` 4️⃣ Haz clic en <b>"Cargar extensión sin empaquetar"</b> y selecciona la carpeta.\n` +
      ` 5️⃣ Abre la extensión e ingresa tu ID <code>${chatId}</code>.\n\n` +
      `${EMOJI.LOCK} <i>Paquete cifrado exclusivo para miembros VIP.</i>`;

    const res = await sendDocument(chatId, ZIP_PATH, caption);
    if (res.ok) {
      console.log(`[BOT] ZIP enviado exitosamente a chat ${chatId}.`);
    } else {
      console.error('[BOT] Error al enviar ZIP:', res);
      await sendMessage(chatId, `${EMOJI.CROSS} Error de Telegram al enviar el archivo: ${res.description || 'Desconocido'}`);
    }

  } catch (err) {
    console.error('[BOT] Error en /extension:', err);
    await sendMessage(chatId,
      `${EMOJI.CROSS} <b>Error al procesar la extensión:</b>\n<code>${(err.message || String(err)).slice(0, 300)}</code>`
    );
  }
}

async function handleHelp(msg) {
  const chatId = String(msg.chat.id);
  const isOwnerUser = isOwner(chatId);

  let text =
    `${EMOJI.INFO} <b>CODEX(R) — CENTRO DE COMANDOS Y AYUDA</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🔹 <b>COMANDOS DE USUARIO</b>\n` +
    ` ├ /start — Registrar identidad y verificar estado\n` +
    ` ├ /me — Consultar perfil personal y ID de acceso\n` +
    ` ├ /extension — Descargar paquete VIP de la extensión (.zip)\n` +
    ` └ /status — Verificar salud del servidor\n\n`;

  if (isOwnerUser) {
    text +=
      `${EMOJI.CROWN} <b>COMANDOS DE ADMINISTRADOR</b>\n` +
      ` ├ <code>/vip [ID/@username] [días]</code> — Asignar días VIP\n` +
      ` ├ <code>/removevip [ID/@username]</code> — Revocar plan VIP\n` +
      ` └ <code>/users</code> — Listar base de datos completa de usuarios\n\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${EMOJI.CHAT} <i>Dudas o soporte técnico contacta a nuestros Administradores.</i>`;

  await sendMessage(chatId, text);
}

// ─── Inline Keyboard Callback Query Handler ──────────────────────────────────

async function handleCallbackQuery(query) {
  const chatId = String(query.message?.chat?.id);
  const data = query.data;

  // Answer callback query
  await apiCall('answerCallbackQuery', { callback_query_id: query.id }).catch(() => { });

  if (data === 'check_profile') {
    await handleProfile(query.message);
  } else if (data === 'get_extension') {
    await handleExtension(query.message);
  }
}

// ─── Long Polling Loop ────────────────────────────────────────────────────────

let offset = 0;

async function pollUpdates() {
  try {
    const data = await apiCall('getUpdates', {
      offset,
      timeout: 20,
      allowed_updates: ['message', 'callback_query'],
    });

    if (!data.ok) {
      if (data.error_code === 409) {
        console.warn('[BOT] Conflicto 409 detectado. Asegúrate de cerrar otras instancias del bot.');
      } else {
        console.error('[BOT] Error getUpdates:', data);
      }
      await sleep(3000);
      return;
    }

    for (const update of data.result) {
      offset = update.update_id + 1;

      if (update.callback_query) {
        await handleCallbackQuery(update.callback_query);
        continue;
      }

      const msg = update.message;
      if (!msg || !msg.text) continue;

      const text = msg.text.trim();
      const lowerText = text.toLowerCase();
      console.log(`[BOT] Mensaje de [${msg.from?.username || msg.from?.id}]: ${text}`);

      if (lowerText.startsWith('/start')) await handleStart(msg);
      else if (lowerText.startsWith('/me') || lowerText.startsWith('/perfil')) await handleProfile(msg);
      else if (lowerText.startsWith('/vip')) await handleVipCommand(msg);
      else if (lowerText.startsWith('/removevip')) await handleRemoveVipCommand(msg);
      else if (lowerText.startsWith('/users') || lowerText.startsWith('/admin')) await handleListUsersCommand(msg);
      else if (lowerText.startsWith('/status')) await handleStatus(msg);
      else if (lowerText.startsWith('/extension')) await handleExtension(msg);
      else if (lowerText.startsWith('/help')) await handleHelp(msg);
    }
  } catch (err) {
    console.error('[BOT] Error de red polling:', err.message);
    await sleep(3000);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

async function main() {
  const me = await apiCall('getMe');
  if (!me.ok) {
    console.error('[BOT] No se pudo conectar a Telegram. Revisa el token:', me);
    process.exit(1);
  }

  // ─── Health Check HTTP Server for Render / Railway / Heroku ──────────────
  const PORT = process.env.PORT || 10000;
  http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('CODEX(R) Telegram Bot Server Active\n');
  }).listen(PORT, () => {
    console.log(`   Health Check HTTP Server escuchando en puerto: ${PORT}`);
  });

  console.log(`\n🚀 CODEX(R) Bot & VIP Manager iniciado`);
  console.log(`   Bot: @${me.result.username}`);
  console.log(`   Owner IDs: ${OWNER_IDS.join(', ')}`);
  console.log(`   Comandos Admin: /vip  /removevip  /users`);
  console.log(`   Comandos Usuario: /start  /me  /extension  /status\n`);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    await pollUpdates();
  }
}

main().catch(console.error);
