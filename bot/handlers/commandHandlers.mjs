import { existsSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { DIST_DIR, ROOT_DIR, ZIP_PATH } from '../config/constants.mjs';
import { EMOJI } from '../templates/emojis.mjs';
import { getActivePlanKeyboard, getNoPlanKeyboard } from '../templates/keymaps.mjs';
import {
  renderExtensionCaption,
  renderHelpMessage,
  renderProfileMessage,
  renderStartNoPlanMessage,
  renderStartVipMessage,
  renderStatusMessage,
  renderVipGrantedOwnerMessage,
  renderVipGrantedUserMessage
} from '../templates/messages.mjs';
import {
  getOrRegisterUser,
  getVipStatus,
  isOwner,
  loadUsersDb,
  saveUsersDb,
  syncUserToSupabase
} from '../database/userStore.mjs';
import { sendDocument, sendMessage } from '../services/telegramApi.mjs';

export async function handleStart(msg) {
  const chatId = String(msg.chat.id);
  const from = msg.from || {};
  const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || 'Operador';
  const username = from.username ? `@${from.username}` : '';

  const user = getOrRegisterUser(chatId, { name, username });
  const status = getVipStatus(user);

  if (status.hasPlan) {
    await sendMessage(chatId, renderStartVipMessage(user, chatId, status), getActivePlanKeyboard());
  } else {
    await sendMessage(chatId, renderStartNoPlanMessage(user, chatId), getNoPlanKeyboard());
  }
}

export async function handleProfile(msg) {
  const chatId = String(msg.chat.id);
  const from = msg.from || {};
  const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || 'Operador';
  const username = from.username ? `@${from.username}` : '';

  const user = getOrRegisterUser(chatId, { name, username });
  const status = getVipStatus(user);
  const isOwnerUser = isOwner(user.telegramId) || user.role === 'owner';

  const expDateStr = isOwnerUser
    ? 'VIP OWNER (Ilimitado)'
    : user.planExpiry
      ? new Date(user.planExpiry).toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' })
      : 'Sin plan activo';

  const text = renderProfileMessage(user, chatId, status, expDateStr, isOwnerUser);
  const keyboard = status.hasPlan ? getActivePlanKeyboard() : getNoPlanKeyboard();
  await sendMessage(chatId, text, keyboard);
}

export async function handleVipCommand(msg) {
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
  await sendMessage(chatId, renderVipGrantedOwnerMessage(user, daysNum, expDateStr));

  // 2. Notify Target User if valid Telegram ID
  if (/^\d+$/.test(user.telegramId)) {
    try {
      await sendMessage(
        user.telegramId,
        renderVipGrantedUserMessage(daysNum, expDateStr, user.telegramId),
        getActivePlanKeyboard()
      );
    } catch { }
  }
}

export async function handleRemoveVipCommand(msg) {
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
    `${EMOJI.STAR} <b>Operador:</b> ${user.name}\n` +
    `${EMOJI.TAG} <b>ID:</b> <code>${user.telegramId}</code>\n` +
    `${EMOJI.WARNING} <b>Estado:</b> ${EMOJI.CROSS} Membresía VIP cancelada.`
  );
}

export async function handleListUsersCommand(msg) {
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
    const badge = isOwner(u.telegramId) || u.role === 'owner' ? EMOJI.CROWN : EMOJI.STAR;
    text += `<b>${idx + 1}.</b> ${badge} <b>${u.name}</b> (${u.username || 'Sin @'})\n`;
    text += `   └ ${EMOJI.TAG} <code>${u.telegramId}</code> | ${EMOJI.STAR} <b>${status.label}</b>\n\n`;
  });

  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${EMOJI.CHART} Total Registrados: <code>${users.length}</code>`;
  await sendMessage(chatId, text);
}

export async function handleStatus(msg) {
  const distExists = existsSync(DIST_DIR);
  const zipExists = existsSync(ZIP_PATH);
  const zipSize = zipExists ? `${(statSync(ZIP_PATH).size / 1024 / 1024).toFixed(1)} MB` : 'N/A';
  const usersCount = loadUsersDb().length;
  const timeStr = new Date().toLocaleString('es-MX');

  await sendMessage(msg.chat.id, renderStatusMessage(distExists, zipExists, zipSize, usersCount, timeStr));
}

export async function handleExtension(msg) {
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
      execSync('npm run build', { cwd: ROOT_DIR, stdio: 'ignore' });
      execSync(
        `powershell -Command "Compress-Archive -Path '${DIST_DIR}\\*' -DestinationPath '${ZIP_PATH}' -Force"`,
        { cwd: ROOT_DIR, stdio: 'ignore' }
      );
      console.log('[BOT] ZIP empaquetado.');
    }

    const zipSize = existsSync(ZIP_PATH) ? (statSync(ZIP_PATH).size / 1024 / 1024).toFixed(1) : '1.5';
    const caption = renderExtensionCaption(user, status, zipSize, chatId);

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

export async function handleHelp(msg) {
  const chatId = String(msg.chat.id);
  const isOwnerUser = isOwner(chatId);
  await sendMessage(chatId, renderHelpMessage(isOwnerUser));
}
