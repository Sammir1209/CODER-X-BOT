// ─── Sistema de Diseño Premium ─────────────────────────────────────────────
import { EMOJI } from './emojis.mjs';

// Símbolos decorativos Unicode
const DECO = {
  LINE_THICK: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  LINE_THIN: '────────────────────────────────────────',
  LINE_DOUBLE: '════════════════════════════════════════',
  LINE_DASHED: '┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄',
  LINE_DOTTED: '┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈',
  LINE_WAVE: '﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏',

  ARROW_RIGHT: '▸',
  ARROW_DOUBLE: '»',
  ARROW_FANCY: '↯',
  ARROW_DIAMOND: '◆',
  ARROW_TRIANGLE: '▶',
  ARROW_STAR: '⟡',

  BULLET: '•',
  BULLET_DIAMOND: '◆',
  BULLET_STAR: '★',
  BULLET_ARROW: '↳',

  BRACKET_LEFT: '【',
  BRACKET_RIGHT: '】',
  BRACKET_FANCY_LEFT: '〔',
  BRACKET_FANCY_RIGHT: '〕',
  BRACKET_CORNER_LEFT: '「',
  BRACKET_CORNER_RIGHT: '」',

  BLOCK_FULL: '█',
  BLOCK_HALF: '▓',
  BLOCK_LIGHT: '▒',
  BLOCK_GHOST: '░',
};

// Fuentes fancy para textos especiales
const FONT = {
  title: (text) => text, // Usaremos las fuentes directamente en los mensajes
  subtitle: (text) => text,
  value: (text) => text,
};

// ─── Funciones Helper ───────────────────────────────────────────────────────

const header = (title, subtitle = '') => {
  let result = `${DECO.LINE_THICK}\n`;
  result += `${DECO.ARROW_FANCY} ${title} ${DECO.ARROW_FANCY}\n`;
  if (subtitle) result += `${DECO.BULLET_DIAMOND} ${subtitle}\n`;
  result += `${DECO.LINE_THICK}`;
  return result;
};

const section = (icon, title) =>
  `${icon} ${title} ${DECO.ARROW_FANCY}`;

const field = (icon, label, value) =>
  `${DECO.BULLET_ARROW} ${label}: ${value}`;

const statusField = (icon, label, value, badge) =>
  `${DECO.BULLET_ARROW} ${label}: ${badge} // ${value}`;

const footer = (text) =>
  `${DECO.LINE_WAVE}\n${text}`;

// ─── Plantillas Premium ─────────────────────────────────────────────────────

export function renderStartVipMessage(user, chatId, status) {
  return (
    `${header('𝑪𝑶𝑫𝑬𝑿® 𝑺𝒀𝑺𝑻𝑬𝑴', 'ᴘʟᴀᴛᴀғᴏʀᴍᴀ ᴅᴇ ᴄᴏɴᴛʀᴏʟ')}\n\n` +
    `${EMOJI.SPARKLES} ${DECO.ARROW_TRIANGLE} ¡𝑩𝒊𝒆𝒏𝒗𝒆𝒏𝒊𝒅𝒐, ${user.name}!\n` +
    `${DECO.BULLET_ARROW} Tu identidad ha sido verificada en el servidor.\n\n` +
    `${section(EMOJI.CHART, '𝑫𝑨𝑻𝑶𝑺 𝑫𝑬 𝑪𝑼𝑬𝑵𝑻𝑨')}\n` +
    `${field(EMOJI.STAR, '𝙽𝚘𝚖𝚋𝚛𝚎', user.name)}\n` +
    `${field(EMOJI.TAG, '𝙸𝙳 𝚃𝚎𝚕𝚎𝚐𝚛𝚊𝚖', chatId)}\n` +
    `${field(EMOJI.CHAT, '𝚄𝚜𝚞𝚊𝚛𝚒𝚘', user.username || 'Sin Username')}\n\n` +
    `${section(EMOJI.DIAMOND, '𝑬𝑺𝑻𝑨𝑫𝑶 𝑽𝑰𝑷')}\n` +
    `${field(EMOJI.STAR, '𝙼𝚎𝚖𝚋𝚛𝚎𝚜í𝚊', `${EMOJI.CHECK} ${status.label}`)}\n\n` +
    `${DECO.LINE_DASHED}\n\n` +
    `${EMOJI.PIN} ${DECO.ARROW_DIAMOND} 𝑪𝑶𝑴𝑨𝑵𝑫𝑶𝑺 𝑹𝑨𝑷𝑰𝑫𝑶𝑺\n` +
    `${DECO.BULLET_ARROW} ${EMOJI.ARROW} /extension — Descargar paquete .zip\n` +
    `${DECO.BULLET_ARROW} ${EMOJI.ARROW} /me — Ver perfil de acceso\n` +
    `${DECO.BULLET_ARROW} ${EMOJI.ARROW} /help — Lista de comandos\n\n` +
    `${footer(`${EMOJI.LOCK} 𝑺𝒊𝒔𝒕𝒆𝒎𝒂 𝑪𝑶𝑫𝑬𝑿® • 𝑺𝒆𝒈𝒖𝒓𝒊𝒅𝒂𝒅 𝑨𝒗𝒂𝒏𝒛𝒂𝒅𝒂`)}`
  );
}

export function renderStartNoPlanMessage(user, chatId) {
  return (
    `${header('𝑪𝑶𝑫𝑬𝑿® 𝑺𝒀𝑺𝑻𝑬𝑴', 'ᴘʟᴀᴛᴀғᴏʀᴍᴀ ᴅᴇ ᴄᴏɴᴛʀᴏʟ')}\n\n` +
    `${EMOJI.SPARKLES} ${DECO.ARROW_TRIANGLE} ¡𝑯𝒐𝒍𝒂, ${user.name}!\n` +
    `${DECO.BULLET_ARROW} Tu ID de Telegram ha sido registrado.\n\n` +
    `${section(EMOJI.CHART, '𝑫𝑨𝑻𝑶𝑺 𝑹𝑬𝑮𝑰𝑺𝑻𝑹𝑨𝑫𝑶𝑺')}\n` +
    `${field(EMOJI.STAR, '𝙽𝚘𝚖𝚋𝚛𝚎', user.name)}\n` +
    `${field(EMOJI.TAG, '𝙸𝙳 𝚃𝚎𝚕𝚎𝚐𝚛𝚊𝚖', chatId)}\n` +
    `${field(EMOJI.CHAT, '𝚄𝚜𝚞𝚊𝚛𝚒𝚘', user.username || 'Sin Username')}\n\n` +
    `${DECO.LINE_DOUBLE}\n\n` +
    `${section(EMOJI.WARNING, '𝑬𝑺𝑻𝑨𝑫𝑶 𝑫𝑬 𝑺𝑼𝑺𝑪𝑹𝑰𝑷𝑪𝑰Ó𝑵')}\n` +
    `${DECO.BULLET_ARROW} ${EMOJI.CROSS} 𝚂𝙸𝙽 𝙿𝙻𝙰𝙽 𝚅𝙸𝙿 𝙰𝙲𝚃𝙸𝚅𝙾\n\n` +
    `${DECO.LINE_DOTTED}\n\n` +
    `${EMOJI.LOCK} ${DECO.ARROW_DIAMOND} 𝑨𝑪𝑪𝑬𝑺𝑶 𝑹𝑬𝑺𝑻𝑹𝑰𝑵𝑮𝑰𝑫𝑶\n` +
    `${DECO.BULLET_ARROW} Para acceder a la extensión CODEX® y generar\n` +
    `${DECO.BULLET_ARROW} códigos OTP, adquiere un Plan VIP con\n` +
    `${DECO.BULLET_ARROW} nuestros Administradores.\n\n` +
    `${footer(`${EMOJI.MONEY} 𝑪𝒐𝒏𝒕𝒂𝒄𝒕𝒂 𝒂 𝑨𝒅𝒎𝒊𝒏𝒊𝒔𝒕𝒓𝒂𝒅𝒐𝒓𝒆𝒔`)}`
  );
}

export function renderProfileMessage(user, chatId, status, expDateStr, isOwnerUser) {
  const rankIcon = isOwnerUser ? EMOJI.CROWN : EMOJI.SHIELD;
  const rankText = isOwnerUser ? '𝑶𝑾𝑵𝑬𝑹 (𝑰𝒍𝒊𝒎𝒊𝒕𝒂𝒅𝒐)' : user.role.toUpperCase();

  return (
    `${header('𝑪𝑶𝑫𝑬𝑿® 𝑷𝑨𝑵𝑬𝑳', 'ᴘᴇʀғɪʟ ᴅᴇ ᴏᴘᴇʀᴀᴅᴏʀ')}\n\n` +
    `${EMOJI.SPARKLES} ${user.name} — ${DECO.BRACKET_FANCY_LEFT} 𝙿𝚎𝚛𝚏𝚒𝚕 𝙳𝚎𝚝𝚊𝚕𝚕𝚊𝚍𝚘 ${DECO.BRACKET_FANCY_RIGHT}\n` +
    `${DECO.LINE_THIN}\n\n` +
    `${section(EMOJI.STAR, '𝑰𝑵𝑭𝑶𝑹𝑴𝑨𝑪𝑰Ó𝑵 𝑷𝑬𝑹𝑺𝑶𝑵𝑨𝑳')}\n` +
    `${field(EMOJI.PIN, '𝙽𝚘𝚖𝚋𝚛𝚎', user.name)}\n` +
    `${field(EMOJI.TAG, '𝚃𝚎𝚕𝚎𝚐𝚛𝚊𝚖 𝙸𝙳', chatId)}\n` +
    `${field(EMOJI.CHAT, '𝙷𝚊𝚗𝚍𝚕𝚎', user.username || 'Sin @')}\n\n` +
    `${section(EMOJI.SHIELD, '𝑬𝑺𝑻𝑨𝑫𝑶 𝒀 𝑳𝑰𝑪𝑬𝑵𝑪𝑰𝑨')}\n` +
    `${field(rankIcon, '𝚁𝚊𝚗𝚐𝚘', rankText)}\n` +
    `${field(EMOJI.LOCK, '𝙴𝚜𝚝𝚊𝚍𝚘 𝚅𝙸𝙿', status.hasPlan ? `${EMOJI.CHECK} ACTIVO` : `${EMOJI.CROSS} INACTIVO`)}\n` +
    `${field(EMOJI.CALENDAR, '𝙴𝚡𝚙𝚒𝚛𝚊𝚌𝚒ó𝚗', expDateStr)}\n\n` +
    `${DECO.LINE_DOUBLE}\n\n` +
    `${EMOJI.LIGHTNING} ${DECO.ARROW_DIAMOND} 𝑪Ó𝑫𝑰𝑮𝑶 𝑫𝑬 𝑨𝑪𝑪𝑬𝑺𝑶\n` +
    `${DECO.BULLET_ARROW} Tu ID de acceso es: ${EMOJI.LOCK} ${chatId}\n\n` +
    `${DECO.LINE_THIN}\n` +
    `${EMOJI.INFO} Ingresa tu ID en el panel de la extensión CODEX® para iniciar sesión.\n\n` +
    `${footer(`${EMOJI.LOCK} 𝑪𝑶𝑫𝑬𝑿® • 𝑺𝒆𝒈𝒖𝒓𝒊𝒅𝒂𝒅 𝑮𝒂𝒓𝒂𝒏𝒕𝒊𝒛𝒂𝒅𝒂`)}`
  );
}

export function renderVipGrantedOwnerMessage(user, daysNum, expDateStr) {
  return (
    `${EMOJI.PARTY}${EMOJI.PARTY}${EMOJI.PARTY} ${DECO.BLOCK_GHOST}${DECO.BLOCK_GHOST}${DECO.BLOCK_GHOST} 𝑽𝑰𝑷 𝑨𝑪𝑻𝑰𝑽𝑨𝑫𝑶 ${DECO.BLOCK_GHOST}${DECO.BLOCK_GHOST}${DECO.BLOCK_GHOST} ${EMOJI.PARTY}${EMOJI.PARTY}${EMOJI.PARTY}\n` +
    `${DECO.LINE_THICK}\n\n` +
    `${section(EMOJI.STAR, '𝑫𝑨𝑻𝑶𝑺 𝑫𝑬𝑳 𝑶𝑷𝑬𝑹𝑨𝑫𝑶𝑹')}\n` +
    `${field(EMOJI.PIN, '𝙽𝚘𝚖𝚋𝚛𝚎', user.name)}\n` +
    `${field(EMOJI.CHAT, '𝚄𝚜𝚞𝚊𝚛𝚒𝚘', user.username || 'Sin @')}\n` +
    `${field(EMOJI.TAG, '𝚃𝚎𝚕𝚎𝚐𝚛𝚊𝚖 𝙸𝙳', user.telegramId)}\n\n` +
    `${section(EMOJI.STAR, '𝑳𝑰𝑪𝑬𝑵𝑪𝑰𝑨 𝑪𝑶𝑵𝑪𝑬𝑫𝑰𝑫𝑨')}\n` +
    `${field(EMOJI.PLUS, '𝙳í𝚊𝚜 𝙰𝚐𝚛𝚎𝚐𝚊𝚍𝚘𝚜', `+${daysNum} Días`)}\n` +
    `${field(EMOJI.CALENDAR, '𝙽𝚞𝚎𝚟𝚊 𝙴𝚡𝚙𝚒𝚛𝚊𝚌𝚒ó𝚗', expDateStr)}\n\n` +
    `${footer(`${EMOJI.CROWN} 𝑶𝒕𝒐𝒓𝒈𝒂𝒅𝒐 𝒑𝒐𝒓 𝑪𝑶𝑫𝑬𝑿® 𝑨𝒅𝒎𝒊𝒏𝒊𝒔𝒕𝒓𝒂𝒅𝒐𝒓`)}`
  );
}

export function renderVipGrantedUserMessage(daysNum, expDateStr, telegramId) {
  return (
    `${EMOJI.PARTY}${EMOJI.PARTY}${EMOJI.PARTY} ¡𝑭𝑬𝑳𝑰𝑪𝑰𝑫𝑨𝑫𝑬𝑺! ${EMOJI.PARTY}${EMOJI.PARTY}${EMOJI.PARTY}\n` +
    `${DECO.LINE_THICK}\n\n` +
    `${EMOJI.DIAMOND} ${DECO.ARROW_TRIANGLE} 𝚃𝚞 𝙿𝚕𝚊𝚗 𝚅𝙸𝙿 𝚑𝚊 𝚜𝚒𝚍𝚘 𝚊𝚌𝚝𝚒𝚟𝚊𝚍𝚘\n\n` +
    `${EMOJI.SPARKLES} El administrador te ha otorgado:\n` +
    `${DECO.BULLET_ARROW} ${EMOJI.FIRE} ${daysNum} días de membresía premium\n\n` +
    `${section(EMOJI.CALENDAR, '𝑰𝑵𝑭𝑶𝑹𝑴𝑨𝑪𝑰Ó𝑵 𝑰𝑴𝑷𝑶𝑹𝑻𝑨𝑵𝑻𝑬')}\n` +
    `${field(EMOJI.CALENDAR, '𝙵𝚎𝚌𝚑𝚊 𝙴𝚡𝚙𝚒𝚛𝚊𝚌𝚒ó𝚗', expDateStr)}\n` +
    `${field(EMOJI.LOCK, '𝙲ó𝚍𝚒𝚐𝚘 𝙰𝚌𝚌𝚎𝚜𝚘', telegramId)}\n\n` +
    `${DECO.LINE_DASHED}\n\n` +
    `${EMOJI.BULB} ${DECO.ARROW_DIAMOND} ¿𝑸𝒖é 𝒔𝒊𝒈𝒖𝒆 𝒂𝒉𝒐𝒓𝒂?\n` +
    `${DECO.BULLET_ARROW} Usa /extension para descargar tu paquete VIP\n\n` +
    `${footer(`${EMOJI.FIRE} ¡𝑩𝒊𝒆𝒏𝒗𝒆𝒏𝒊𝒅𝒐 𝒂 𝑪𝑶𝑫𝑬𝑿® 𝑷𝒓𝒆𝒎𝒊𝒖𝒎!`)}`
  );
}

export function renderStatusMessage(distExists, zipExists, zipSize, usersCount, serverTimeStr) {
  return (
    `${header('𝑪𝑶𝑫𝑬𝑿® 𝑬𝑺𝑻𝑨𝑫𝑶', 'sɪsᴛᴇᴍᴀ ᴛéᴄɴɪᴄᴏ')}\n\n` +
    `${section(EMOJI.GLOBE, '𝑰𝑵𝑭𝑹𝑨𝑬𝑺𝑻𝑹𝑼𝑪𝑻𝑼𝑹𝑨')}\n` +
    `${field(EMOJI.DESKTOP, '𝙱𝚘𝚝 𝚃𝚎𝚕𝚎𝚐𝚛𝚊𝚖', '@CodexrOutBot')}\n` +
    `${field(EMOJI.LIGHTNING, '𝙷𝚎𝚊𝚕𝚝𝚑 𝙲𝚑𝚎𝚌𝚔', 'Online (Puerto 10000)')}\n` +
    `${field(EMOJI.GLOBE, '𝙱𝚊𝚜𝚎 𝙳𝚊𝚝𝚘𝚜', 'Supabase Connected')}\n\n` +
    `${section(EMOJI.GEAR, '𝑪𝑶𝑴𝑷𝑶𝑵𝑬𝑵𝑻𝑬𝑺')}\n` +
    `${field(EMOJI.TAG, '𝙴𝚡𝚝𝚎𝚗𝚜𝚒ó𝚗 (dist/)', distExists ? `${EMOJI.CHECK} Compilado` : `${EMOJI.CROSS} Pendiente`)}\n` +
    `${field(EMOJI.TAG, '𝚉𝙸𝙿 𝚅𝙸𝙿', zipExists ? `${EMOJI.CHECK} Listo (${zipSize})` : `${EMOJI.CROSS} Sin crear`)}\n` +
    `${field(EMOJI.EYES, '𝚄𝚜𝚞𝚊𝚛𝚒𝚘𝚜', usersCount)}\n\n` +
    `${DECO.LINE_THIN}\n` +
    `${field(EMOJI.CALENDAR, '𝙷𝚘𝚛𝚊 𝚂𝚎𝚛𝚟𝚒𝚍𝚘𝚛', serverTimeStr)}\n\n` +
    `${footer(`${EMOJI.GREEN} 𝑻𝒐𝒅𝒐𝒔 𝒍𝒐𝒔 𝒔𝒊𝒔𝒕𝒆𝒎𝒂𝒔 𝒐𝒑𝒆𝒓𝒂𝒕𝒊𝒗𝒐𝒔`)}`
  );
}

export function renderExtensionCaption(user, status, zipSize, chatId) {
  return (
    `${header('𝑪𝑶𝑫𝑬𝑿® 𝑬𝑿𝑻𝑬𝑵𝑺𝑰Ó𝑵', 'ᴘᴀǫᴜᴇᴛᴇ ᴠɪᴘ ᴠ𝟷.𝟷')}\n\n` +
    `${section(EMOJI.STAR, '𝑼𝑺𝑼𝑨𝑹𝑰𝑶 𝑨𝑼𝑻𝑶𝑹𝑰𝒁𝑨𝑫𝑶')}\n` +
    `${field(EMOJI.PIN, '𝙾𝚙𝚎𝚛𝚊𝚍𝚘𝚛', user.name)}\n` +
    `${field(EMOJI.CALENDAR, '𝙼𝚎𝚖𝚋𝚛𝚎𝚜í𝚊', status.label)}\n` +
    `${field(EMOJI.TAG, '𝚃𝚊𝚖𝚊ñ𝚘', `${zipSize} MB`)}\n\n` +
    `${section(EMOJI.FIRE, '𝑮𝑼Í𝑨 𝑫𝑬 𝑰𝑵𝑺𝑻𝑨𝑳𝑨𝑪𝑰Ó𝑵')}\n` +
    `${DECO.BULLET_ARROW} ${EMOJI.ARROW} 1. Descomprime el archivo .zip\n` +
    `${DECO.BULLET_ARROW} ${EMOJI.ARROW} 2. Abre chrome://extensions\n` +
    `${DECO.BULLET_ARROW} ${EMOJI.ARROW} 3. Activa "Modo desarrollador"\n` +
    `${DECO.BULLET_ARROW} ${EMOJI.ARROW} 4. Click en "Cargar extensión"\n` +
    `${DECO.BULLET_ARROW} ${EMOJI.ARROW} 5. Ingresa tu ID: ${chatId}\n\n` +
    `${footer(`${EMOJI.LOCK} 𝑷𝒂𝒒𝒖𝒆𝒕𝒆 𝒄𝒊𝒇𝒓𝒂𝒅𝒐 • 𝑬𝒙𝒄𝒍𝒖𝒔𝒊𝒗𝒐 𝑽𝑰𝑷`)}`
  );
}

export function renderHelpMessage(isOwnerUser) {
  let text =
    `${header('𝑪𝑶𝑫𝑬𝑿® 𝑨𝒀𝑼𝑫𝑨', 'ᴄᴇɴᴛʀᴏ ᴅᴇ ᴄᴏᴍᴀɴᴅᴏs')}\n\n` +
    `${section(EMOJI.ARROW, '𝑪𝑶𝑴𝑨𝑵𝑫𝑶𝑺 𝑮𝑬𝑵𝑬𝑹𝑨𝑳𝑬𝑺')}\n` +
    `${DECO.BULLET_ARROW} /start — ${DECO.BRACKET_FANCY_LEFT} Registrar identidad ${DECO.BRACKET_FANCY_RIGHT}\n` +
    `${DECO.BULLET_ARROW} /me — ${DECO.BRACKET_FANCY_LEFT} Perfil y ID de acceso ${DECO.BRACKET_FANCY_RIGHT}\n` +
    `${DECO.BULLET_ARROW} /extension — ${DECO.BRACKET_FANCY_LEFT} Descargar extensión .zip ${DECO.BRACKET_FANCY_RIGHT}\n` +
    `${DECO.BULLET_ARROW} /status — ${DECO.BRACKET_FANCY_LEFT} Salud del servidor ${DECO.BRACKET_FANCY_RIGHT}\n\n`;

  if (isOwnerUser) {
    text +=
      `${DECO.LINE_DOUBLE}\n\n` +
      `${section(EMOJI.CROWN, '𝑪𝑶𝑴𝑨𝑵𝑫𝑶𝑺 𝑨𝑫𝑴𝑰𝑵')}\n` +
      `${DECO.BULLET_ARROW} /vip [ID/@user] [días]\n` +
      `${DECO.BULLET_STAR} ${DECO.BRACKET_FANCY_LEFT} Asignar días VIP ${DECO.BRACKET_FANCY_RIGHT}\n\n` +
      `${DECO.BULLET_ARROW} /removevip [ID/@user]\n` +
      `${DECO.BULLET_STAR} ${DECO.BRACKET_FANCY_LEFT} Revocar plan VIP ${DECO.BRACKET_FANCY_RIGHT}\n\n` +
      `${DECO.BULLET_ARROW} /users\n` +
      `${DECO.BULLET_STAR} ${DECO.BRACKET_FANCY_LEFT} Listar todos los usuarios ${DECO.BRACKET_FANCY_RIGHT}\n\n`;
  }

  text +=
    `${DECO.LINE_WAVE}\n` +
    `${EMOJI.CHAT} ¿Dudas o soporte? Contacta a nuestros Administradores.\n\n` +
    `${footer(`${EMOJI.LOCK} 𝑪𝑶𝑫𝑬𝑿® 𝑺𝒚𝒔𝒕𝒆𝒎 • 𝑷𝒓𝒆𝒎𝒊𝒖𝒎 𝑺𝒆𝒄𝒖𝒓𝒊𝒕𝒚`)}`;

  return text;
}