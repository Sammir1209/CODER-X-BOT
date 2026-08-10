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
import FormData from 'form-data';

// ─── Config ──────────────────────────────────────────────────────────────────

const BOT_TOKEN  = '8953633941:AAE8E0o00iIlVBnP57_y3Q8UIk5I_-ZwRCw';
const API_BASE   = `https://api.telegram.org/bot${BOT_TOKEN}`;
const __dirname  = dirname(fileURLToPath(import.meta.url));
const ROOT       = resolve(__dirname, '..');
const DIST_DIR   = resolve(ROOT, 'dist');
const ZIP_PATH   = resolve(ROOT, 'CODEX_R_Extension.zip');
const DB_FILE    = resolve(__dirname, 'usersDb.json');

// Admin / Owner Telegram ID
const OWNER_ID   = '7794982496';
const OWNER_LINK = 'https://t.me/SammirContreras';

// ─── User Database Manager ───────────────────────────────────────────────────

export function loadUsersDb() {
  if (!existsSync(DB_FILE)) {
    const initial = [
      {
        telegramId: OWNER_ID,
        username: '@SammirContreras',
        name: 'Owner (Sammir)',
        role: 'owner',
        planExpiry: 4102444800000, // Year 2100
        createdAt: Date.now(),
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
  let user = users.find((u) => u.telegramId === idStr);

  const name = userInfo.name || user?.name || `User ${idStr}`;
  const username = userInfo.username
    ? (userInfo.username.startsWith('@') ? userInfo.username : `@${userInfo.username}`)
    : (user?.username || '');

  if (!user) {
    user = {
      telegramId: idStr,
      username,
      name,
      role: idStr === OWNER_ID ? 'owner' : 'user',
      planExpiry: idStr === OWNER_ID ? 4102444800000 : null,
      createdAt: Date.now(),
    };
    users.push(user);
    saveUsersDb(users);
  } else {
    let updated = false;
    if (name && user.name !== name) { user.name = name; updated = true; }
    if (username && user.username !== username) { user.username = username; updated = true; }
    if (idStr === OWNER_ID && user.role !== 'owner') {
      user.role = 'owner';
      user.planExpiry = 4102444800000;
      updated = true;
    }
    if (updated) saveUsersDb(users);
  }

  return user;
}

export function getVipStatus(user) {
  if (!user) return { hasPlan: false, daysLeft: 0, label: 'Sin Registro' };
  if (user.telegramId === OWNER_ID || user.role === 'owner') {
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
    filename   : 'CODEX_R_Extension.zip',
    contentType: 'application/zip',
  });

  const res = await fetch(`${API_BASE}/sendDocument`, {
    method : 'POST',
    headers: form.getHeaders(),
    body   : form,
  });
  return res.json();
}

// ─── Standard Buttons ─────────────────────────────────────────────────────────

function getNoPlanKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '💬 Contactar Administrador / Adquirir Plan', url: OWNER_LINK },
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
          { text: '📦 Descargar Extensión (.ZIP)', callback_data: 'get_extension' },
        ],
        [
          { text: '👤 Ver Mi Perfil', callback_data: 'check_profile' },
          { text: '💬 Soporte Admin', url: OWNER_LINK },
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
      `👋 <b>¡Hola, ${user.name}!</b>\n\n` +
      `Bienvenido a <b>CODEX(R) SYSTEM</b>.\n\n` +
      `📌 <b>Tu ID de Telegram:</b> <code>${chatId}</code>\n` +
      `👤 <b>Usuario:</b> <code>${user.username || 'Sin @'}</code>\n` +
      `🌟 <b>Plan VIP:</b> ✅ <b>${status.label}</b>\n\n` +
      `<b>Comandos disponibles:</b>\n` +
      `🔹 /extension — Descargar paquete de la extensión (.zip)\n` +
      `🔹 /me — Ver tu perfil de acceso\n` +
      `🔹 /help — Lista de comandos`,
      getActivePlanKeyboard()
    );
  } else {
    await sendMessage(chatId,
      `👋 <b>¡Hola, ${user.name}!</b>\n\n` +
      `📌 <b>Tu ID de Telegram:</b> <code>${chatId}</code> fue verificado.\n` +
      `👤 <b>Usuario:</b> <code>${user.username || 'Sin @'}</code>\n` +
      `⚠️ <b>Estado:</b> ❌ <b>SIN PLAN VIP ACTIVO</b>\n\n` +
      `Para ingresar a la extensión y obtener tus códigos de acceso OTP, necesitas un <b>Plan VIP</b>.\n\n` +
      `Haz clic en el botón de abajo para contactar al administrador y activar tu membresía.`,
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

  const expDateStr = user.planExpiry
    ? new Date(user.planExpiry).toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' })
    : 'Ninguna';

  const text =
    `👤 <b>CODEX(R) — Perfil de Usuario</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🆔 <b>Telegram ID:</b> <code>${chatId}</code>\n` +
    `👤 <b>Nombre:</b> ${user.name}\n` +
    `💬 <b>Username:</b> ${user.username || 'N/A'}\n` +
    `🌟 <b>Estado VIP:</b> ${status.hasPlan ? '✅ ' + status.label : '❌ SIN PLAN'}\n` +
    `📅 <b>Expiración:</b> ${expDateStr}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `<i>Ingresa tu ID de Telegram en el panel de la extensión CODEX(R) para iniciar sesión.</i>`;

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
      `Ejemplos:\n` +
      `• <code>/vip 7794982496 30</code>\n` +
      `• <code>/vip @sammir 7</code>`
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

  // 1. Notify Owner
  await sendMessage(chatId,
    `🎉 <b>¡PLAN VIP OTORGADO CON ÉXITO!</b>\n\n` +
    `👤 <b>Usuario:</b> ${user.name} (${user.username || 'Sin @'})\n` +
    `🆔 <b>ID:</b> <code>${user.telegramId}</code>\n` +
    `⏳ <b>Días Agregados:</b> ${daysNum} días\n` +
    `📅 <b>Nueva Fecha Expiración:</b> ${expDateStr}`
  );

  // 2. Notify Target User if valid Telegram ID
  if (/^\d+$/.test(user.telegramId)) {
    try {
      await sendMessage(user.telegramId,
        `🎉 <b>¡TU PLAN VIP HA SIDO ACTIVADO!</b>\n\n` +
        `El administrador te ha otorgado <b>${daysNum} días</b> de acceso VIP.\n\n` +
        `📅 <b>Fecha Expiración:</b> ${expDateStr}\n\n` +
        `Ya puedes ingresar tu ID <code>${user.telegramId}</code> en la extensión CODEX(R) para recibir tus códigos OTP.`,
        getActivePlanKeyboard()
      );
    } catch {}
  }
}

async function handleRemoveVipCommand(msg) {
  const chatId = String(msg.chat.id);
  if (chatId !== OWNER_ID) {
    await sendMessage(chatId, '❌ Acceso denegado.');
    return;
  }

  const parts = msg.text.trim().split(/\s+/);
  if (parts.length < 2) {
    await sendMessage(chatId, '💡 Uso: <code>/removevip [telegramId o @username]</code>');
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
    await sendMessage(chatId, '❌ Usuario no encontrado en la base de datos.');
    return;
  }

  user.planExpiry = null;
  user.role = 'user';
  saveUsersDb(users);

  await sendMessage(chatId, `🚫 Plan VIP removido de <b>${user.name}</b> (ID: <code>${user.telegramId}</code>).`);
}

async function handleListUsersCommand(msg) {
  const chatId = String(msg.chat.id);
  if (chatId !== OWNER_ID) {
    await sendMessage(chatId, '❌ Acceso denegado.');
    return;
  }

  const users = loadUsersDb();
  if (users.length === 0) {
    await sendMessage(chatId, '📋 No hay usuarios registrados.');
    return;
  }

  let text = `📋 <b>CODEX(R) — Usuarios Registrados (${users.length})</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  users.forEach((u, idx) => {
    const status = getVipStatus(u);
    text += `${idx + 1}. <b>${u.name}</b> (${u.username || 'no-user'})\n`;
    text += `   🆔 ID: <code>${u.telegramId}</code> | Status: ${status.label}\n\n`;
  });

  await sendMessage(chatId, text);
}

async function handleStatus(msg) {
  const distExists = existsSync(DIST_DIR);
  const zipExists  = existsSync(ZIP_PATH);
  const zipSize    = zipExists ? `${(statSync(ZIP_PATH).size / 1024 / 1024).toFixed(1)} MB` : 'N/A';
  const usersCount = loadUsersDb().length;

  await sendMessage(msg.chat.id,
    `🖥 <b>CODEX(R) — Estado del Servidor</b>\n\n` +
    `📁 Compilación <code>dist/</code>: ${distExists ? '✅ Lista' : '❌ Pendiente'}\n` +
    `📦 Paquete ZIP: ${zipExists ? `✅ ${zipSize}` : '❌ No creado'}\n` +
    `👥 Usuarios Registrados: ${usersCount}\n` +
    `🕐 Hora Servidor: ${new Date().toLocaleString('es-MX')}\n` +
    `🤖 Bot: @CodexrOutBot`
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
      `❌ <b>ACCESO DENEGADO — SIN PLAN VIP</b>\n\n` +
      `Hola <b>${user.name}</b>, tu ID de Telegram (<code>${chatId}</code>) no tiene una membresía VIP activa.\n\n` +
      `Para descargar el paquete de la extensión (.zip) y usar la plataforma CODEX(R), ponte en contacto con el administrador para activar tu suscripción.`,
      getNoPlanKeyboard()
    );
    return;
  }

  await sendMessage(chatId,
    `⚙️ <b>Preparando paquete de extensión CODEX(R)...</b>\n` +
    `Generando y verificando archivo ZIP actualizado... por favor espera.`
  );

  try {
    console.log(`[BOT] Preparando envío de extensión a usuario VIP ${chatId}...`);
    
    // Check if zip exists; build if missing or outdated
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
      `📦 <b>CODEX(R) Extension (V1.1 VIP)</b>\n\n` +
      `👤 Usuario VIP: <b>${user.name}</b>\n` +
      `⏳ Días Restantes: <b>${status.daysLeft} días</b>\n` +
      `📁 Tamaño: <b>${zipSize} MB</b>\n\n` +
      `<b>Instrucciones de instalación:</b>\n` +
      `1️⃣ Descomprime el ZIP\n` +
      `2️⃣ Abre Chrome e ingresa a <code>chrome://extensions</code>\n` +
      `3️⃣ Activa el <b>"Modo desarrollador"</b>\n` +
      `4️⃣ Clic en <b>"Cargar extensión sin empaquetar"</b> y selecciona la carpeta descomprimida.`;

    const res = await sendDocument(chatId, ZIP_PATH, caption);
    if (res.ok) {
      console.log(`[BOT] ZIP enviado exitosamente a chat ${chatId}.`);
    } else {
      console.error('[BOT] Error al enviar ZIP:', res);
      await sendMessage(chatId, `❌ Error de Telegram al enviar el archivo: ${res.description || 'Desconocido'}`);
    }

  } catch (err) {
    console.error('[BOT] Error en /extension:', err);
    await sendMessage(chatId,
      `❌ <b>Error al procesar la extensión:</b>\n<code>${(err.message || String(err)).slice(0, 300)}</code>`
    );
  }
}

async function handleHelp(msg) {
  const chatId = String(msg.chat.id);
  const isOwner = chatId === OWNER_ID;

  let text =
    `ℹ️ <b>CODEX(R) — Comandos de Bot</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🔹 /start — Registrarse y consultar estado de suscripción\n` +
    `🔹 /me — Ver tu perfil de usuario y días VIP restantes\n` +
    `🔹 /extension — Descargar la extensión compilada (.zip)\n` +
    `🔹 /status — Estado del servidor\n\n`;

  if (isOwner) {
    text +=
      `👑 <b>COMANDOS DE ADMINISTRADOR:</b>\n` +
      `🔸 <code>/vip [ID/@username] [días]</code> — Dar VIP a un usuario\n` +
      `🔸 <code>/removevip [ID/@username]</code> — Quitar VIP a un usuario\n` +
      `🔸 <code>/users</code> — Ver lista completa de usuarios\n\n`;
  }

  await sendMessage(chatId, text);
}

// ─── Inline Keyboard Callback Query Handler ──────────────────────────────────

async function handleCallbackQuery(query) {
  const chatId = String(query.message?.chat?.id);
  const data = query.data;

  // Answer callback query
  await apiCall('answerCallbackQuery', { callback_query_id: query.id }).catch(() => {});

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
      timeout   : 20,
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

      if (lowerText.startsWith('/start'))               await handleStart(msg);
      else if (lowerText.startsWith('/me') || lowerText.startsWith('/perfil')) await handleProfile(msg);
      else if (lowerText.startsWith('/vip'))            await handleVipCommand(msg);
      else if (lowerText.startsWith('/removevip'))      await handleRemoveVipCommand(msg);
      else if (lowerText.startsWith('/users') || lowerText.startsWith('/admin')) await handleListUsersCommand(msg);
      else if (lowerText.startsWith('/status'))         await handleStatus(msg);
      else if (lowerText.startsWith('/extension'))      await handleExtension(msg);
      else if (lowerText.startsWith('/help'))           await handleHelp(msg);
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

  console.log(`\n🚀 CODEX(R) Bot & VIP Manager iniciado`);
  console.log(`   Bot: @${me.result.username}`);
  console.log(`   Owner ID: ${OWNER_ID}`);
  console.log(`   Comandos Admin: /vip  /removevip  /users`);
  console.log(`   Comandos Usuario: /start  /me  /extension  /status\n`);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    await pollUpdates();
  }
}

main().catch(console.error);
