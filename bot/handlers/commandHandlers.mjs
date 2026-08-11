import { existsSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { DIST_DIR, ROOT_DIR, ZIP_PATH } from '../config/constants.mjs';
import { EMOJI } from '../templates/emojis.mjs';
import { getActivePlanKeyboard, getNoPlanKeyboard } from '../templates/keymaps.mjs';
import {
  renderBroadcastMessage,
  renderCardGeneratorMessage,
  renderCheckerMessage,
  renderExtensionCaption,
  renderHelpMessage,
  renderProfileMessage,
  renderRegisterMessage,
  renderStartNoPlanMessage,
  renderStartVipMessage,
  renderStatusMessage,
  renderVipGrantedOwnerMessage,
  renderVipGrantedUserMessage
} from '../templates/messages.mjs';
import { generateCards } from '../services/cardService.mjs';
import {
  getOrRegisterUser,
  getVipStatus,
  isOwner,
  loadUsersDb,
  saveUsersDb,
  syncUserToSupabase
} from '../database/userStore.mjs';
import { sendDocument, sendMessage } from '../services/telegramApi.mjs';

export async function handleRegister(msg) {
  const chatId = String(msg.chat.id);
  const from = msg.from || {};
  const userId = String(from.id || msg.chat.id);
  const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || 'Operador';
  const username = from.username ? `@${from.username}` : '';

  const usersBefore = loadUsersDb();
  const alreadyRegistered = Boolean(usersBefore.find(u => u.telegramId === userId || (username && u.username && u.username.toLowerCase() === username.toLowerCase())));

  const user = getOrRegisterUser(userId, { name, username });
  const status = getVipStatus(user);

  const isNew = !alreadyRegistered;
  const keyboard = status.hasPlan ? getActivePlanKeyboard() : getNoPlanKeyboard();

  await sendMessage(chatId, renderRegisterMessage(user, userId, isNew), keyboard);
}

export async function handleStart(msg) {
  const chatId = String(msg.chat.id);
  const from = msg.from || {};
  const userId = String(from.id || msg.chat.id);
  const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || 'Operador';
  const username = from.username ? `@${from.username}` : '';

  const user = getOrRegisterUser(userId, { name, username });
  const status = getVipStatus(user);

  if (status.hasPlan) {
    await sendMessage(chatId, renderStartVipMessage(user, userId, status), getActivePlanKeyboard());
  } else {
    await sendMessage(chatId, renderStartNoPlanMessage(user, userId), getNoPlanKeyboard());
  }
}

export async function handleProfile(msg) {
  const chatId = String(msg.chat.id);
  const from = msg.from || {};
  const userId = String(from.id || msg.chat.id);
  const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || 'Operador';
  const username = from.username ? `@${from.username}` : '';

  const user = getOrRegisterUser(userId, { name, username });
  const status = getVipStatus(user);
  const isOwnerUser = isOwner(user.telegramId) || user.role === 'owner';

  const expDateStr = isOwnerUser
    ? 'VIP OWNER (Ilimitado)'
    : user.planExpiry
      ? new Date(user.planExpiry).toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' })
      : 'Sin plan activo';

  const text = renderProfileMessage(user, userId, status, expDateStr, isOwnerUser);
  const keyboard = status.hasPlan ? getActivePlanKeyboard() : getNoPlanKeyboard();
  await sendMessage(chatId, text, keyboard);
}

export async function handleVipCommand(msg) {
  const chatId = String(msg.chat.id);
  const from = msg.from || {};
  const userId = String(from.id || msg.chat.id);
  if (!isOwner(userId)) {
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
  const from = msg.from || {};
  const userId = String(from.id || msg.chat.id);
  if (!isOwner(userId)) {
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
  const from = msg.from || {};
  const userId = String(from.id || msg.chat.id);
  if (!isOwner(userId)) {
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
  const chatId = String(msg.chat.id);
  const distExists = existsSync(DIST_DIR);
  const zipExists = existsSync(ZIP_PATH);
  const zipSize = zipExists ? `${(statSync(ZIP_PATH).size / 1024 / 1024).toFixed(1)} MB` : 'N/A';
  const usersCount = loadUsersDb().length;
  const timeStr = new Date().toLocaleString('es-MX');

  await sendMessage(chatId, renderStatusMessage(distExists, zipExists, zipSize, usersCount, timeStr));
}

export async function handleExtension(msg) {
  const chatId = String(msg.chat.id);
  const from = msg.from || {};
  const userId = String(from.id || msg.chat.id);
  const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || 'Operador';
  const username = from.username ? `@${from.username}` : '';

  const user = getOrRegisterUser(userId, { name, username });
  const status = getVipStatus(user);

  if (!status.hasPlan) {
    await sendMessage(chatId,
      `${EMOJI.LOCK} <b>CODEX(R) — ACCESO DENEGADO (SIN PLAN VIP)</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Hola <b>${user.name}</b>, tu ID de Telegram (<code>${userId}</code>) no cuenta con una membresía VIP activa.\n\n` +
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
    console.log(`[BOT] Preparando envío de extensión a usuario VIP ${userId} (chat: ${chatId})...`);

    if (!existsSync(ZIP_PATH)) {
      if (!existsSync(DIST_DIR)) {
        console.log('[BOT] Compilando extensión...');
        try {
          execSync('npm run build', { cwd: ROOT_DIR, stdio: 'ignore', timeout: 120000 });
        } catch (buildErr) {
          console.error('[BOT] Build falló, verificando si dist/ ya existe...');
          if (!existsSync(DIST_DIR)) {
            throw new Error('No se pudo compilar la extensión y dist/ no existe.');
          }
        }
      }
      console.log('[BOT] Empaquetando ZIP...');
      try {
        execSync(`cd "${DIST_DIR}" && zip -r "${ZIP_PATH}" .`, { stdio: 'ignore', timeout: 60000 });
      } catch {
        try {
          execSync(`tar -czvf "${ZIP_PATH}" -C "${DIST_DIR}" .`, { stdio: 'ignore', timeout: 60000 });
        } catch {
          throw new Error('No se pudo empaquetar el ZIP. Ni zip ni tar están disponibles.');
        }
      }
      console.log('[BOT] ZIP empaquetado.');
    }

    const zipSize = existsSync(ZIP_PATH) ? (statSync(ZIP_PATH).size / 1024 / 1024).toFixed(1) : '1.5';
    const caption = renderExtensionCaption(user, status, zipSize, userId);

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
  const from = msg.from || {};
  const userId = String(from.id || msg.chat.id);
  const isOwnerUser = isOwner(userId);
  await sendMessage(chatId, renderHelpMessage(isOwnerUser));
}

export async function handleGenCommand(msg) {
  const chatId = String(msg.chat.id);
  const text = msg.text.trim();
  const parts = text.split(/\s+/);

  if (parts.length < 2) {
    await sendMessage(chatId,
      `${EMOJI.INFO} <b>CODEX® GENERATOR — SINTAXIS DE USO</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Sintaxis: <code>/gen [BIN] [cantidad]</code>\n\n` +
      `Ejemplos:\n` +
      `• <code>/gen 453590</code> (Genera 10 por defecto)\n` +
      `• <code>/gen 520081 15</code> (Genera 15 tarjetas)`
    );
    return;
  }

  const binInput = parts[1].replace(/\D/g, '');
  const countInput = parts[2] ? parseInt(parts[2], 10) : 10;

  if (!binInput || binInput.length < 4) {
    await sendMessage(chatId, `${EMOJI.CROSS} <b>Error:</b> El BIN debe contener al menos 4 números dígitos.`);
    return;
  }

  const count = isNaN(countInput) ? 10 : Math.min(Math.max(1, countInput), 30);
  const cards = generateCards(binInput, count);

  if (!cards || cards.length === 0) {
    await sendMessage(chatId, `${EMOJI.CROSS} <b>Error:</b> No se pudieron generar tarjetas con el BIN proporcionado.`);
    return;
  }

  await sendMessage(chatId, renderCardGeneratorMessage(cards, binInput, count));
}

export async function handleChkCommand(msg) {
  const chatId = String(msg.chat.id);
  const text = msg.text.trim();

  // Extract URL from command text (handles /chk https://... or /chk@bot https://... or /chk domain.com)
  const urlMatch = text.match(/(https?:\/\/[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*)/i);
  const matchedPart = urlMatch ? urlMatch[0] : '';
  // Ensure we didn't just match '/chk'
  const isCmdOnly = matchedPart.toLowerCase().startsWith('/chk') || matchedPart.toLowerCase().startsWith('/check') || matchedPart.toLowerCase().startsWith('/scan');

  if (!urlMatch || isCmdOnly) {
    await sendMessage(chatId,
      `${EMOJI.INFO} <b>CODEX® CHECKER — SINTAXIS DE USO</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Sintaxis: <code>/chk [URL]</code>\n\n` +
      `Ejemplo:\n` +
      `• <code>/chk https://ejemplo.com/checkout</code>`
    );
    return;
  }

  let targetUrl = matchedPart.replace(/[>\]\)\'\"]+$/, '');
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = `https://${targetUrl}`;
  }

  await sendMessage(chatId, `${EMOJI.SCANNER} <b>Escaneando pasarelas en URL...</b>\n<code>${targetUrl}</code>`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const resp = await fetch(targetUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      }
    });
    clearTimeout(timeoutId);

    const html = (await resp.text()).toLowerCase();

    let provider = 'generic';
    if (html.includes('stripe.com') || html.includes('stripe-elements') || html.includes('__stripe') || html.includes('js.stripe.com')) provider = 'stripe';
    else if (html.includes('braintree') || html.includes('braintreegateway')) provider = 'braintree';
    else if (html.includes('adyen')) provider = 'adyen';
    else if (html.includes('paypal') || html.includes('paypalobjects')) provider = 'paypal';
    else if (html.includes('shopify')) provider = 'shopify (stripe)';
    else if (html.includes('square') || html.includes('squareup')) provider = 'square';
    else if (html.includes('recurly')) provider = 'recurly';
    else if (html.includes('authorizenet') || html.includes('authorize.net')) provider = 'authorize.net';

    const hasCheckout = /checkout|payment|billing|card-number|pay-button|subscribe|order|buy/i.test(html) || provider !== 'generic';
    const has3DS = html.includes('3ds') || html.includes('cardinal') || html.includes('three-d-secure') || html.includes('stripe-3ds');
    const hasCaptcha = html.includes('hcaptcha') || html.includes('recaptcha') || html.includes('cf-turnstile') || html.includes('g-recaptcha');
    const fieldsCount = (html.match(/<input/g) || []).length;

    await sendMessage(chatId, renderCheckerMessage(targetUrl, { provider, hasCheckout, has3DS, hasCaptcha, fieldsCount }));
  } catch (err) {
    const errorDetails = err.cause?.message || err.message || String(err);
    await sendMessage(chatId,
      `${EMOJI.CROSS} <b>Error al inspeccionar la URL:</b>\n` +
      `<code>${errorDetails.slice(0, 200)}</code>`
    );
  }
}

export async function handleBroadcastCommand(msg) {
  const chatId = String(msg.chat.id);
  const from = msg.from || {};
  const userId = String(from.id || msg.chat.id);

  if (!isOwner(userId)) {
    await sendMessage(chatId, `${EMOJI.CROSS} <b>Acceso denegado.</b> Este comando es exclusivo del Administrador.`);
    return;
  }

  const broadcastText = msg.text.replace(/^\/broadcast\s*/i, '').trim();
  if (!broadcastText) {
    await sendMessage(chatId, `${EMOJI.INFO} Uso: <code>/broadcast [Mensaje con formato HTML]</code>`);
    return;
  }

  const senderName = [from.first_name, from.last_name].filter(Boolean).join(' ') || 'Admin';
  const users = loadUsersDb();

  await sendMessage(chatId, `${EMOJI.BROADCAST} <b>Iniciando envío masivo a ${users.length} usuarios...</b>`);

  let successCount = 0;
  let failCount = 0;

  for (const u of users) {
    if (u.telegramId && !u.telegramId.startsWith('-')) {
      try {
        const res = await sendMessage(u.telegramId, renderBroadcastMessage(broadcastText, senderName));
        if (res && res.ok) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }
  }

  await sendMessage(chatId,
    `${EMOJI.CHECK} <b>PROCESO DE TRANSMISIÓN FINALIZADO</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `• Enviados con éxito: <code>${successCount}</code>\n` +
    `• Fallidos/Bloqueados: <code>${failCount}</code>\n` +
    `• Total destinatarios: <code>${users.length}</code>`
  );
}
