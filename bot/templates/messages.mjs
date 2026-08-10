// ─── Sistema de Diseño Premium Optimizado para Telegram ────────────────────
import { EMOJI } from './emojis.mjs';

// Símbolos decorativos - Optimizados para móvil (~26 caracteres)
const DECO = {
  LINE_THICK: '━━━━━━━━━━━━━━━━━━━━━━━━',
  LINE_THIN: '──────────────────────────',
  LINE_DOUBLE: '══════════════════════════',
  LINE_DASHED: '┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄',
  LINE_DOTTED: '┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈',
  LINE_WAVE: '﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏',

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

// ─── Funciones Helper ─────────────────────────────────────────────────────

const header = (title, subtitle = '') => {
  let result = `${DECO.LINE_THICK}\n`;
  result += `${DECO.ARROW_FANCY} ${title} ${DECO.ARROW_FANCY}\n`;
  if (subtitle) result += `${DECO.BULLET_DIAMOND} ${subtitle}\n`;
  result += `${DECO.LINE_THICK}`;
  return result;
};

const section = (title) =>
  `\n${DECO.ARROW_DIAMOND} ${title} ${DECO.ARROW_FANCY}\n`;

const field = (label, value, icon = '') =>
  `${DECO.BULLET_ARROW} ${icon}${label}: ${value}`;

const footer = (text) =>
  `\n${DECO.LINE_WAVE}\n${text}`;

// ─── Lógica de Estado VIP (Cálculos Dinámicos) ─────────────────────────────

function calcDaysRemaining(planExpiry) {
  if (!planExpiry) return 0;
  const now = Date.now();
  const diff = planExpiry - now;
  return Math.max(0, Math.ceil(diff / 86400000));
}

function buildProgressBar(daysRemaining, totalDays) {
  const maxBlocks = 10;
  if (totalDays <= 0) return `${DECO.BLOCK_GHOST.repeat(maxBlocks)} 0%`;
  const ratio = Math.min(daysRemaining / totalDays, 1);
  const filled = Math.round(ratio * maxBlocks);
  const empty = maxBlocks - filled;
  const pct = Math.round(ratio * 100);
  return `${DECO.BLOCK_FULL.repeat(filled)}${DECO.BLOCK_GHOST.repeat(empty)} ${pct}%`;
}

function getVipBadge(status, user) {
  if (status.isOwner) {
    return `${EMOJI.CROWN} 𝑶𝑾𝑵𝑬𝑹 ${DECO.BRACKET_FANCY_LEFT} Acceso Ilimitado ${DECO.BRACKET_FANCY_RIGHT}`;
  }
  if (status.hasPlan) {
    const days = calcDaysRemaining(user.planExpiry);
    if (days > 15) {
      return `${EMOJI.CHECK} 𝑨𝑪𝑻𝑰𝑽𝑶 ${DECO.BRACKET_FANCY_LEFT} ${days} días ${DECO.BRACKET_FANCY_RIGHT}`;
    } else if (days > 3) {
      return `${EMOJI.WARNING} 𝑨𝑪𝑻𝑰𝑽𝑶 ${DECO.BRACKET_FANCY_LEFT} ${days} días ${DECO.BRACKET_FANCY_RIGHT}`;
    } else {
      return `${EMOJI.RED} 𝑷𝑶𝑹 𝑬𝑿𝑷𝑰𝑹𝑨𝑹 ${DECO.BRACKET_FANCY_LEFT} ${days} días ${DECO.BRACKET_FANCY_RIGHT}`;
    }
  }
  return `${EMOJI.CROSS} 𝑰𝑵𝑨𝑪𝑻𝑰𝑽𝑶 ${DECO.BRACKET_FANCY_LEFT} Sin plan ${DECO.BRACKET_FANCY_RIGHT}`;
}

function getSubscriptionBlock(status, user) {
  if (status.isOwner) {
    return (
      `${section('𝑬𝑺𝑻𝑨𝑫𝑶 𝑽𝑰𝑷')}` +
      `${field('𝚁𝚊𝚗𝚐𝚘', '𝑶𝑾𝑵𝑬𝑹', EMOJI.CROWN)}\n` +
      `${field('𝙴𝚜𝚝𝚊𝚍𝚘', '𝑨𝒄𝒄𝒆𝒔𝒐 𝑰𝒍𝒊𝒎𝒊𝒕𝒂𝒅𝒐', EMOJI.CHECK)}\n` +
      `${field('𝙿𝚕𝚊𝚗', 'Permanente', EMOJI.DIAMOND)}\n` +
      `${DECO.BULLET_ARROW} ${DECO.BLOCK_FULL.repeat(10)} 100%`
    );
  }
  if (status.hasPlan) {
    const days = calcDaysRemaining(user.planExpiry);
    const totalDays = user.planExpiry && user.createdAt
      ? Math.ceil((user.planExpiry - (user.createdAt || Date.now())) / 86400000)
      : days;
    const expDate = new Date(user.planExpiry).toLocaleDateString('es-MX', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
    const bar = buildProgressBar(days, Math.max(totalDays, days));
    const urgency = days <= 3 ? EMOJI.RED : days <= 15 ? EMOJI.WARNING : EMOJI.GREEN;

    return (
      `${section('𝑬𝑺𝑻𝑨𝑫𝑶 𝑽𝑰𝑷')}` +
      `${field('𝙴𝚜𝚝𝚊𝚍𝚘', '𝑨𝑪𝑻𝑰𝑽𝑶', EMOJI.CHECK)}\n` +
      `${field('𝙴𝚡𝚙𝚒𝚛𝚊', expDate, EMOJI.CALENDAR)}\n` +
      `${field('𝙳í𝚊𝚜', days.toString(), urgency)}\n` +
      `${DECO.BULLET_ARROW} ${bar}`
    );
  }
  return (
    `${section('𝑬𝑺𝑻𝑨𝑫𝑶 𝑫𝑬 𝑺𝑼𝑺𝑪𝑹𝑰𝑷𝑪𝑰Ó𝑵')}` +
    `${field('𝙴𝚜𝚝𝚊𝚍𝚘', '𝑰𝑵𝑨𝑪𝑻𝑰𝑽𝑶', EMOJI.CROSS)}\n` +
    `${field('𝙿𝚕𝚊𝚗', 'Sin plan VIP activo', EMOJI.RED)}\n` +
    `${DECO.BULLET_ARROW} ${DECO.BLOCK_GHOST.repeat(10)} 0%`
  );
}

// ─── Plantillas Premium ─────────────────────────────────────────────────────

export function renderStartVipMessage(user, chatId, status) {
  return (
    `${header('𝑪𝑶𝑫𝑬𝑿® 𝑺𝒀𝑺𝑻𝑬𝑴', 'ᴘʟᴀᴛᴀғᴏʀᴍᴀ ᴅᴇ ᴄᴏɴᴛʀᴏʟ')}\n` +
    `\n` +
    `${EMOJI.SPARKLES} ¡𝑩𝒊𝒆𝒏𝒗𝒆𝒏𝒊𝒅𝒐, ${user.name}!\n` +
    `${DECO.BULLET_ARROW} Identidad verificada.` +
    `${section('𝑫𝑨𝑻𝑶𝑺 𝑫𝑬 𝑪𝑼𝑬𝑵𝑻𝑨')}` +
    `${field('𝙽𝚘𝚖𝚋𝚛𝚎', user.name, EMOJI.STAR)}\n` +
    `${field('𝙸𝙳 𝚃𝚎𝚕𝚎𝚐𝚛𝚊𝚖', chatId, EMOJI.TAG)}\n` +
    `${field('𝚄𝚜𝚞𝚊𝚛𝚒𝚘', user.username || 'Sin Username', EMOJI.CHAT)}` +
    `${getSubscriptionBlock(status, user)}\n` +
    `\n${DECO.LINE_DASHED}\n` +
    `\n` +
    `${EMOJI.PIN} 𝑪𝑶𝑴𝑨𝑵𝑫𝑶𝑺 𝑹𝑨𝑷𝑰𝑫𝑶𝑺\n` +
    `${DECO.BULLET_ARROW} ${EMOJI.ARROW} /extension — Descargar .zip\n` +
    `${DECO.BULLET_ARROW} ${EMOJI.ARROW} /me — Perfil de acceso\n` +
    `${DECO.BULLET_ARROW} ${EMOJI.ARROW} /help — Lista de comandos` +
    `${footer(`${EMOJI.LOCK} 𝑪𝑶𝑫𝑬𝑿® • 𝑺𝒆𝒈𝒖𝒓𝒊𝒅𝒂𝒅 𝑨𝒗𝒂𝒏𝒛𝒂𝒅𝒂`)}`
  );
}

export function renderStartNoPlanMessage(user, chatId) {
  const noStatus = { hasPlan: false, isOwner: false };
  return (
    `${header('𝑪𝑶𝑫𝑬𝑿® 𝑺𝒀𝑺𝑻𝑬𝑴', 'ᴘʟᴀᴛᴀғᴏʀᴍᴀ ᴅᴇ ᴄᴏɴᴛʀᴏʟ')}\n` +
    `\n` +
    `${EMOJI.SPARKLES} ¡𝑯𝒐𝒍𝒂, ${user.name}!\n` +
    `${DECO.BULLET_ARROW} Registro completado.` +
    `${section('𝑫𝑨𝑻𝑶𝑺 𝑹𝑬𝑮𝑰𝑺𝑻𝑹𝑨𝑫𝑶𝑺')}` +
    `${field('𝙽𝚘𝚖𝚋𝚛𝚎', user.name, EMOJI.STAR)}\n` +
    `${field('𝙸𝙳 𝚃𝚎𝚕𝚎𝚐𝚛𝚊𝚖', chatId, EMOJI.TAG)}\n` +
    `${field('𝚄𝚜𝚞𝚊𝚛𝚒𝚘', user.username || 'Sin Username', EMOJI.CHAT)}` +
    `${getSubscriptionBlock(noStatus, user)}\n` +
    `\n${DECO.LINE_DOTTED}\n` +
    `\n` +
    `${EMOJI.LOCK} 𝑨𝑪𝑪𝑬𝑺𝑶 𝑹𝑬𝑺𝑻𝑹𝑰𝑵𝑮𝑰𝑫𝑶\n` +
    `${DECO.BULLET_ARROW} Adquiere un Plan VIP para acceder\n` +
    `${DECO.BULLET_ARROW} a la extensión y generar OTP.\n` +
    `${DECO.BULLET_ARROW} Contacta a nuestros Admin.` +
    `${footer(`${EMOJI.MONEY} 𝑪𝒐𝒏𝒕𝒂𝒄𝒕𝒂 𝑨𝒅𝒎𝒊𝒏𝒊𝒔𝒕𝒓𝒂𝒅𝒐𝒓𝒆𝒔`)}`
  );
}

export function renderProfileMessage(user, chatId, status, expDateStr, isOwnerUser) {
  const rankIcon = isOwnerUser ? EMOJI.CROWN : EMOJI.SHIELD;
  const rankText = isOwnerUser ? '𝑶𝑾𝑵𝑬𝑹 (𝑰𝒍𝒊𝒎𝒊𝒕𝒂𝒅𝒐)' : user.role.toUpperCase();
  const vipBadge = getVipBadge(status, user);

  return (
    `${header('𝑪𝑶𝑫𝑬𝑿® 𝑷𝑨𝑵𝑬𝑳', 'ᴘᴇʀғɪʟ ᴅᴇ ᴏᴘᴇʀᴀᴅᴏʀ')}\n` +
    `\n` +
    `${EMOJI.SPARKLES} ${user.name}\n` +
    `${DECO.BULLET_ARROW} ${DECO.BRACKET_FANCY_LEFT} 𝙿𝚎𝚛𝚏𝚒𝚕 𝙳𝚎𝚝𝚊𝚕𝚕𝚊𝚍𝚘 ${DECO.BRACKET_FANCY_RIGHT}` +
    `${section('𝑰𝑵𝑭𝑶𝑹𝑴𝑨𝑪𝑰Ó𝑵 𝑷𝑬𝑹𝑺𝑶𝑵𝑨𝑳')}` +
    `${field('𝙽𝚘𝚖𝚋𝚛𝚎', user.name, EMOJI.PIN)}\n` +
    `${field('𝚃𝚎𝚕𝚎𝚐𝚛𝚊𝚖 𝙸𝙳', chatId, EMOJI.TAG)}\n` +
    `${field('𝙷𝚊𝚗𝚍𝚕𝚎', user.username || 'Sin @', EMOJI.CHAT)}` +
    `${getSubscriptionBlock(status, user)}\n` +
    `\n${DECO.LINE_THIN}\n` +
    `${section('𝑳𝑰𝑪𝑬𝑵𝑪𝑰𝑨')}` +
    `${field('𝚁𝚊𝚗𝚐𝚘', rankText, rankIcon)}\n` +
    `${DECO.BULLET_ARROW} 𝚅𝙸𝙿: ${vipBadge}\n` +
    `${field('𝙴𝚡𝚙𝚒𝚛𝚊𝚌𝚒ó𝚗', expDateStr, EMOJI.CALENDAR)}\n` +
    `\n${DECO.LINE_DOUBLE}\n` +
    `\n` +
    `${EMOJI.LIGHTNING} 𝑪Ó𝑫𝑰𝑮𝑶 𝑫𝑬 𝑨𝑪𝑪𝑬𝑺𝑶\n` +
    `${DECO.BULLET_ARROW} ID de acceso: ${EMOJI.LOCK} ${chatId}\n` +
    `\n${DECO.LINE_THIN}\n` +
    `${EMOJI.INFO} Usa este ID en la extensión CODEX®.` +
    `${footer(`${EMOJI.LOCK} 𝑪𝑶𝑫𝑬𝑿® • 𝑺𝒆𝒈𝒖𝒓𝒊𝒅𝒂𝒅 𝑮𝒂𝒓𝒂𝒏𝒕𝒊𝒛𝒂𝒅𝒂`)}`
  );
}

export function renderVipGrantedOwnerMessage(user, daysNum, expDateStr) {
  return (
    `${EMOJI.PARTY}${EMOJI.PARTY}${EMOJI.PARTY} 𝑽𝑰𝑷 𝑨𝑪𝑻𝑰𝑽𝑨𝑫𝑶 ${EMOJI.PARTY}${EMOJI.PARTY}${EMOJI.PARTY}\n` +
    `${DECO.LINE_THICK}\n` +
    `${section('𝑫𝑨𝑻𝑶𝑺 𝑫𝑬𝑳 𝑶𝑷𝑬𝑹𝑨𝑫𝑶𝑹')}` +
    `${field('𝙽𝚘𝚖𝚋𝚛𝚎', user.name, EMOJI.PIN)}\n` +
    `${field('𝚄𝚜𝚞𝚊𝚛𝚒𝚘', user.username || 'Sin @', EMOJI.CHAT)}\n` +
    `${field('𝚃𝚎𝚕𝚎𝚐𝚛𝚊𝚖 𝙸𝙳', user.telegramId, EMOJI.TAG)}\n` +
    `${section('𝑳𝑰𝑪𝑬𝑵𝑪𝑰𝑨 𝑪𝑶𝑵𝑪𝑬𝑫𝑰𝑫𝑨')}` +
    `${field('𝙳í𝚊𝚜', `+${daysNum} Días`, EMOJI.PLUS)}\n` +
    `${field('𝙴𝚡𝚙𝚒𝚛𝚊𝚌𝚒ó𝚗', expDateStr, EMOJI.CALENDAR)}\n` +
    `${DECO.BULLET_ARROW} ${EMOJI.GREEN} ${DECO.BLOCK_FULL.repeat(10)} 100%` +
    `${footer(`${EMOJI.CROWN} 𝑶𝒕𝒐𝒓𝒈𝒂𝒅𝒐 𝒑𝒐𝒓 𝑨𝒅𝒎𝒊𝒏 𝑪𝑶𝑫𝑬𝑿®`)}`
  );
}

export function renderVipGrantedUserMessage(daysNum, expDateStr, telegramId) {
  return (
    `${EMOJI.PARTY}${EMOJI.PARTY}${EMOJI.PARTY} ¡𝑭𝑬𝑳𝑰𝑪𝑰𝑫𝑨𝑫𝑬𝑺! ${EMOJI.PARTY}${EMOJI.PARTY}${EMOJI.PARTY}\n` +
    `${DECO.LINE_THICK}\n` +
    `\n` +
    `${EMOJI.DIAMOND} 𝚃𝚞 𝙿𝚕𝚊𝚗 𝚅𝙸𝙿 𝚑𝚊 𝚜𝚒𝚍𝚘 𝚊𝚌𝚝𝚒𝚟𝚊𝚍𝚘\n` +
    `\n` +
    `${EMOJI.SPARKLES} El administrador te ha otorgado:\n` +
    `${DECO.BULLET_ARROW} ${EMOJI.FIRE} ${daysNum} días premium\n` +
    `${DECO.BULLET_ARROW} ${EMOJI.GREEN} ${DECO.BLOCK_FULL.repeat(10)} 100%\n` +
    `${section('𝑰𝑵𝑭𝑶𝑹𝑴𝑨𝑪𝑰Ó𝑵 𝑰𝑴𝑷𝑶𝑹𝑻𝑨𝑵𝑻𝑬')}` +
    `${field('𝙴𝚡𝚙𝚒𝚛𝚊𝚌𝚒ó𝚗', expDateStr, EMOJI.CALENDAR)}\n` +
    `${field('𝙲ó𝚍𝚒𝚐𝚘', telegramId, EMOJI.LOCK)}\n` +
    `\n${DECO.LINE_DASHED}\n` +
    `\n` +
    `${EMOJI.BULB} ¿𝑸𝒖é 𝒔𝒊𝒈𝒖𝒆 𝒂𝒉𝒐𝒓𝒂?\n` +
    `${DECO.BULLET_ARROW} Usa /extension para descargar` +
    `${footer(`${EMOJI.FIRE} ¡𝑩𝒊𝒆𝒏𝒗𝒆𝒏𝒊𝒅𝒐 𝒂 𝑪𝑶𝑫𝑬𝑿® 𝑷𝒓𝒆𝒎𝒊𝒖𝒎!`)}`
  );
}

export function renderStatusMessage(distExists, zipExists, zipSize, usersCount, serverTimeStr) {
  return (
    `${header('𝑪𝑶𝑫𝑬𝑿® 𝑬𝑺𝑻𝑨𝑫𝑶', 'sɪsᴛᴇᴍᴀ ᴛéᴄɴɪᴄᴏ')}\n` +
    `${section('𝑰𝑵𝑭𝑹𝑨𝑬𝑺𝑻𝑹𝑼𝑪𝑻𝑼𝑹𝑨')}` +
    `${field('𝙱𝚘𝚝', '@CodexrOutBot', EMOJI.DESKTOP)}\n` +
    `${field('𝙷𝚎𝚊𝚕𝚝𝚑', 'Online :10000', EMOJI.LIGHTNING)}\n` +
    `${field('𝙳𝚊𝚝𝚘𝚜', 'Supabase OK', EMOJI.GLOBE)}\n` +
    `${section('𝑪𝑶𝑴𝑷𝑶𝑵𝑬𝑵𝑻𝑬𝑺')}` +
    `${field('dist/', distExists ? `${EMOJI.CHECK} OK` : `${EMOJI.CROSS} Pend.`, EMOJI.TAG)}\n` +
    `${field('ZIP', zipExists ? `${EMOJI.CHECK} ${zipSize}` : `${EMOJI.CROSS} No`, EMOJI.TAG)}\n` +
    `${field('𝚄𝚜𝚎𝚛𝚜', usersCount, EMOJI.EYES)}\n` +
    `\n${DECO.LINE_THIN}\n` +
    `${field('𝙷𝚘𝚛𝚊', serverTimeStr, EMOJI.CALENDAR)}` +
    `${footer(`${EMOJI.GREEN} 𝑻𝒐𝒅𝒐𝒔 𝒍𝒐𝒔 𝒔𝒊𝒔𝒕𝒆𝒎𝒂𝒔 𝒐𝒌`)}`
  );
}

export function renderExtensionCaption(user, status, zipSize, chatId) {
  return (
    `${header('𝑪𝑶𝑫𝑬𝑿® 𝑬𝑿𝑻𝑬𝑵𝑺𝑰Ó𝑵', 'ᴘᴀǫᴜᴇᴛᴇ ᴠɪᴘ ᴠ𝟷.𝟷')}\n` +
    `${section('𝑼𝑺𝑼𝑨𝑹𝑰𝑶 𝑨𝑼𝑻𝑶𝑹𝑰𝒁𝑨𝑫𝑶')}` +
    `${field('𝙾𝚙𝚎𝚛𝚊𝚍𝚘𝚛', user.name, EMOJI.PIN)}\n` +
    `${field('𝙼𝚎𝚖𝚋𝚛𝚎𝚜í𝚊', status.label, EMOJI.CALENDAR)}\n` +
    `${field('𝚃𝚊𝚖𝚊ñ𝚘', `${zipSize} MB`, EMOJI.TAG)}\n` +
    `${section('𝑮𝑼Í𝑨 𝑫𝑬 𝑰𝑵𝑺𝑻𝑨𝑳𝑨𝑪𝑰Ó𝑵')}` +
    `${DECO.BULLET_ARROW} ${EMOJI.ARROW} 1. Descomprime .zip\n` +
    `${DECO.BULLET_ARROW} ${EMOJI.ARROW} 2. chrome://extensions\n` +
    `${DECO.BULLET_ARROW} ${EMOJI.ARROW} 3. Modo desarrollador\n` +
    `${DECO.BULLET_ARROW} ${EMOJI.ARROW} 4. Cargar extensión\n` +
    `${DECO.BULLET_ARROW} ${EMOJI.ARROW} 5. ID: ${chatId}` +
    `${footer(`${EMOJI.LOCK} 𝑪𝒊𝒇𝒓𝒂𝒅𝒐 • 𝑬𝒙𝒄𝒍𝒖𝒔𝒊𝒗𝒐 𝑽𝑰𝑷`)}`
  );
}

export function renderHelpMessage(isOwnerUser) {
  let text =
    `${header('𝑪𝑶𝑫𝑬𝑿® 𝑨𝒀𝑼𝑫𝑨', 'ᴄᴇɴᴛʀᴏ ᴅᴇ ᴄᴏᴍᴀɴᴅᴏs')}\n` +
    `${section('𝑪𝑶𝑴𝑨𝑵𝑫𝑶𝑺 𝑮𝑬𝑵𝑬𝑹𝑨𝑳𝑬𝑺')}` +
    `${DECO.BULLET_ARROW} /start — ${DECO.BRACKET_FANCY_LEFT} Registro ${DECO.BRACKET_FANCY_RIGHT}\n` +
    `${DECO.BULLET_ARROW} /me — ${DECO.BRACKET_FANCY_LEFT} Perfil ${DECO.BRACKET_FANCY_RIGHT}\n` +
    `${DECO.BULLET_ARROW} /extension — ${DECO.BRACKET_FANCY_LEFT} Descargar .zip ${DECO.BRACKET_FANCY_RIGHT}\n` +
    `${DECO.BULLET_ARROW} /status — ${DECO.BRACKET_FANCY_LEFT} Servidor ${DECO.BRACKET_FANCY_RIGHT}\n`;

  if (isOwnerUser) {
    text +=
      `\n${DECO.LINE_DOUBLE}\n` +
      `${section('𝑪𝑶𝑴𝑨𝑵𝑫𝑶𝑺 𝑨𝑫𝑴𝑰𝑵')}` +
      `${DECO.BULLET_ARROW} /vip [ID] [días]\n` +
      `${DECO.BULLET_STAR} ${DECO.BRACKET_FANCY_LEFT} Asignar VIP ${DECO.BRACKET_FANCY_RIGHT}\n` +
      `${DECO.BULLET_ARROW} /removevip [ID]\n` +
      `${DECO.BULLET_STAR} ${DECO.BRACKET_FANCY_LEFT} Revocar VIP ${DECO.BRACKET_FANCY_RIGHT}\n` +
      `${DECO.BULLET_ARROW} /users\n` +
      `${DECO.BULLET_STAR} ${DECO.BRACKET_FANCY_LEFT} Listar users ${DECO.BRACKET_FANCY_RIGHT}\n`;
  }

  text +=
    `\n${DECO.LINE_WAVE}\n` +
    `${EMOJI.CHAT} ¿Dudas? Contacta a nuestros Admin.` +
    `${footer(`${EMOJI.LOCK} 𝑪𝑶𝑫𝑬𝑿® • 𝑷𝒓𝒆𝒎𝒊𝒖𝒎 𝑺𝒆𝒄𝒖𝒓𝒊𝒕𝒚`)}`;

  return text;
}