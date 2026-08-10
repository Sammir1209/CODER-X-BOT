// ─── Sistema de Diseño Estilo AkiChik + Custom Emojis Premium ─────────────
import { EMOJI } from './emojis.mjs';

// Símbolos decorativos Unicode - Estilo minimalista
const DECO = {
  LINE_THICK: '━━━━━━━━━━━━━━━━━━━━',
  LINE_THIN: '──────────────────────',
  LINE_DOUBLE: '══════════════════════',
  LINE_DASHED: '┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄',
  LINE_DOTTED: '┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈',

  ARROW_FANCY: '↯',

  BULLET: '•',

  BRACKET_CORNER_LEFT: '「',
  BRACKET_CORNER_RIGHT: '」',

  BLOCK_FULL: '█',
  BLOCK_GHOST: '░',
};

// ─── Funciones Helper ─────────────────────────────────────────────────────

const header = (title, subtitle = '') => {
  let result = `${DECO.LINE_THICK}\n`;
  result += `${EMOJI.STAR} <b>${title}</b> ${EMOJI.STAR}\n`;
  if (subtitle) result += `${DECO.BULLET} <i>${subtitle}</i>\n`;
  result += `${DECO.LINE_THICK}`;
  return result;
};

const section = (emoji, title) =>
  `\n${emoji} <b>${title}</b> ${DECO.ARROW_FANCY}\n`;

const field = (label, value) =>
  `${DECO.BULLET}  <b>${label}:</b> ${value}`;

const footer = (text) =>
  `\n${DECO.LINE_THICK}\n<i>${text}</i>`;

// ─── Lógica de Estado VIP ─────────────────────────────────────────────────

function calcDaysRemaining(planExpiry) {
  if (!planExpiry) return 0;
  const now = Date.now();
  const diff = planExpiry - now;
  return Math.max(0, Math.ceil(diff / 86400000));
}

function buildProgressBar(percentage) {
  const maxBlocks = 10;
  const filled = Math.round((percentage / 100) * maxBlocks);
  const empty = maxBlocks - filled;
  return `${DECO.BLOCK_FULL.repeat(filled)}${DECO.BLOCK_GHOST.repeat(empty)} <code>${percentage}%</code>`;
}

function getSubscriptionBlock(status, user) {
  if (status.isOwner) {
    return (
      `${section(EMOJI.CROWN, 'Owner Info')}` +
      `${field('Rango', `${EMOJI.CROWN} <b>Owner</b>`)}\n` +
      `${field('Estado', `${EMOJI.CHECK} <b>Acceso Ilimitado</b>`)}\n` +
      `${field('Plan', `${EMOJI.DIAMOND} <i>Permanente</i>`)}\n` +
      `${field('Progreso', `${buildProgressBar(100)}`)}`
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
    const percentage = Math.min(Math.round((days / Math.max(totalDays, days)) * 100), 100);
    const statusIcon = days <= 3 ? EMOJI.RED : days <= 15 ? EMOJI.WARNING : EMOJI.GREEN;

    return (
      `${section(EMOJI.DIAMOND, 'VIP Info')}` +
      `${field('Estado', `${EMOJI.CHECK} <b>Activo</b>`)}\n` +
      `${field('Expira', `${EMOJI.CALENDAR} <code>${expDate}</code>`)}\n` +
      `${field('Días restantes', `${statusIcon} <code>${days} días</code>`)}\n` +
      `${field('Progreso', `${buildProgressBar(percentage)}`)}`
    );
  }
  return (
    `${section(EMOJI.WARNING, 'Sin Plan')}` +
    `${field('Estado', `${EMOJI.CROSS} <b>Inactivo</b>`)}\n` +
    `${field('Plan', `${EMOJI.PROHIBITED} <i>Sin plan VIP activo</i>`)}\n` +
    `${field('Progreso', `${buildProgressBar(0)}`)}`
  );
}

// ─── Plantillas Estilo AkiChik + Custom Emojis Premium ────────────────────

export function renderStartVipMessage(user, chatId, status) {
  return (
    `${header('CODEX® SYSTEM', 'Plataforma de Control')}\n` +
    `\n` +
    `${EMOJI.SPARKLES} <b>¡Bienvenido, ${user.name}!</b>\n` +
    `${DECO.BULLET} <i>Identidad verificada en el servidor.</i>\n` +
    `${section(EMOJI.CHART, 'User Info')}` +
    `${field('FirstName', `<b>${user.name}</b>`)}\n` +
    `${field('ID', `<code>${chatId}</code>`)}\n` +
    `${field('Usuario', `<code>${user.username || 'Sin Username'}</code>`)}\n` +
    `${getSubscriptionBlock(status, user)}\n` +
    `\n${DECO.LINE_DASHED}\n` +
    `\n` +
    `${EMOJI.PIN} <b>Comandos Rápidos</b> ${DECO.ARROW_FANCY}\n` +
    `${DECO.BULLET} ${EMOJI.ARROW} <b>/extension</b> — <i>Descargar extensión .zip</i>\n` +
    `${DECO.BULLET} ${EMOJI.ARROW} <b>/me</b> — <i>Ver perfil de acceso</i>\n` +
    `${DECO.BULLET} ${EMOJI.ARROW} <b>/help</b> — <i>Lista de comandos</i>\n` +
    `\n${footer(`${EMOJI.LOCK} CODEX® System • Premium Security`)}`
  );
}

export function renderStartNoPlanMessage(user, chatId) {
  const noStatus = { hasPlan: false, isOwner: false };
  return (
    `${header('CODEX® SYSTEM', 'Plataforma de Control')}\n` +
    `\n` +
    `${EMOJI.SPARKLES} <b>¡Hola, ${user.name}!</b>\n` +
    `${DECO.BULLET} <i>Tu ID ha sido registrado correctamente.</i>\n` +
    `${section(EMOJI.CHART, 'User Info')}` +
    `${field('FirstName', `<b>${user.name}</b>`)}\n` +
    `${field('ID', `<code>${chatId}</code>`)}\n` +
    `${field('Usuario', `<code>${user.username || 'Sin Username'}</code>`)}\n` +
    `${getSubscriptionBlock(noStatus, user)}\n` +
    `\n${DECO.LINE_DOTTED}\n` +
    `\n` +
    `${EMOJI.LOCK} <b>Acceso Restringido</b> ${DECO.ARROW_FANCY}\n` +
    `${DECO.BULLET} <i>Para acceder a la extensión CODEX®</i>\n` +
    `${DECO.BULLET} <i>y generar códigos OTP, necesitas</i>\n` +
    `${DECO.BULLET} <i>un Plan VIP activo.</i>\n` +
    `\n${footer(`${EMOJI.MONEY} Contacta a nuestros Administradores`)}`
  );
}

export function renderProfileMessage(user, chatId, status, expDateStr, isOwnerUser) {
  return (
    `${EMOJI.SPARKLES} <b>${user.name}</b> - <i>User Profile</i> - ( ${EMOJI.STAR} )\n` +
    `${DECO.LINE_THICK}\n` +
    `${section(EMOJI.CHART, 'User Info')}` +
    `${field('FirstName', `<b>${user.name}</b>`)}\n` +
    `${field('ID', `<code>${chatId}</code>`)}\n` +
    `${field('Usuario', `<code>${user.username || 'Sin @'}</code>`)}\n` +
    `${getSubscriptionBlock(status, user)}\n` +
    `\n${DECO.LINE_THIN}\n` +
    `${section(EMOJI.KEY, 'Access Info')}` +
    `${field('Código Acceso', `${EMOJI.LOCK} <code>${chatId}</code>`)}\n` +
    `${field('Expiración', `${EMOJI.CALENDAR} <code>${expDateStr}</code>`)}\n` +
    `${DECO.BULLET} ${EMOJI.SHOPPING} <b>Promoción del Mes</b> <i>[Comprar]</i>\n` +
    `\n${footer(`${EMOJI.LOCK} CODEX® System • Seguridad Garantizada`)}`
  );
}

export function renderVipGrantedOwnerMessage(user, daysNum, expDateStr) {
  return (
    `${EMOJI.PARTY}${EMOJI.PARTY}${EMOJI.PARTY} <b>VIP ACTIVADO</b> ${EMOJI.PARTY}${EMOJI.PARTY}${EMOJI.PARTY}\n` +
    `${DECO.LINE_THICK}\n` +
    `${section(EMOJI.STAR, 'Operador Beneficiado')}` +
    `${field('Nombre', `<b>${user.name}</b>`)}\n` +
    `${field('Usuario', `<code>${user.username || 'Sin @'}</code>`)}\n` +
    `${field('Telegram ID', `<code>${user.telegramId}</code>`)}\n` +
    `\n${DECO.LINE_THIN}\n` +
    `${section(EMOJI.STAR, 'Licencia Concedida')}` +
    `${field('Días Agregados', `${EMOJI.PLUS} <code>+${daysNum} Días</code>`)}\n` +
    `${field('Nueva Expiración', `${EMOJI.CALENDAR} <code>${expDateStr}</code>`)}\n` +
    `${field('Progreso', `${buildProgressBar(100)}`)}\n` +
    `\n${footer(`${EMOJI.CROWN} Otorgado por CODEX® Admin`)}`
  );
}

export function renderVipGrantedUserMessage(daysNum, expDateStr, telegramId) {
  return (
    `${EMOJI.PARTY}${EMOJI.PARTY}${EMOJI.PARTY} <b>¡FELICIDADES!</b> ${EMOJI.PARTY}${EMOJI.PARTY}${EMOJI.PARTY}\n` +
    `${DECO.LINE_THICK}\n` +
    `\n` +
    `${EMOJI.DIAMOND} <b>Tu Plan VIP ha sido activado</b>\n` +
    `\n` +
    `${EMOJI.SPARKLES} <i>El administrador te ha otorgado:</i>\n` +
    `${DECO.BULLET} ${EMOJI.FIRE} <code>${daysNum} días</code> de membresía premium\n` +
    `${DECO.BULLET} <b>Progreso:</b> ${buildProgressBar(100)}\n` +
    `${section(EMOJI.CALENDAR, 'Información Importante')}` +
    `${field('Fecha Expiración', `${EMOJI.CALENDAR} <code>${expDateStr}</code>`)}\n` +
    `${field('Código Acceso', `${EMOJI.LOCK} <code>${telegramId}</code>`)}\n` +
    `\n${DECO.LINE_DASHED}\n` +
    `\n` +
    `${EMOJI.BULB} <b>¿Qué sigue ahora?</b> ${DECO.ARROW_FANCY}\n` +
    `${DECO.BULLET} Usa ${EMOJI.ARROW} <b>/extension</b> para descargar tu VIP\n` +
    `\n${footer(`${EMOJI.FIRE} ¡Bienvenido a CODEX® Premium!`)}`
  );
}

export function renderStatusMessage(distExists, zipExists, zipSize, usersCount, serverTimeStr) {
  return (
    `${header('CODEX® ESTADO', 'Sistema Técnico')}\n` +
    `${section(EMOJI.GLOBE, 'Infraestructura')}` +
    `${field('Bot Telegram', `${EMOJI.DESKTOP} <code>@CodexrOutBot</code>`)}\n` +
    `${field('Health Check', `${EMOJI.LIGHTNING} <code>Online (Puerto 10000)</code>`)}\n` +
    `${field('Base Datos', `${EMOJI.LINK} <code>Supabase Connected</code>`)}\n` +
    `${section(EMOJI.GEAR, 'Componentes')}` +
    `${field('Extensión (dist/)', distExists ? `${EMOJI.CHECK} <b>Compilado</b>` : `${EMOJI.CROSS} <i>Pendiente</i>`)}\n` +
    `${field('ZIP VIP', zipExists ? `${EMOJI.CHECK} <b>Listo</b> (<code>${zipSize}</code>)` : `${EMOJI.CROSS} <i>Sin crear</i>`)}\n` +
    `${field('Usuarios', `${EMOJI.EYES} <code>${usersCount}</code>`)}\n` +
    `\n${DECO.LINE_THIN}\n` +
    `${field('Hora Servidor', `${EMOJI.CALENDAR} <code>${serverTimeStr}</code>`)}\n` +
    `\n${footer(`${EMOJI.GREEN} Todos los sistemas operativos`)}`
  );
}

export function renderExtensionCaption(user, status, zipSize, chatId) {
  return (
    `${header('CODEX® EXTENSIÓN', 'Paquete VIP v1.1')}\n` +
    `${section(EMOJI.STAR, 'Usuario Autorizado')}` +
    `${field('Operador', `<b>${user.name}</b>`)}\n` +
    `${field('Membresía', `${EMOJI.DIAMOND} <b>${status.label}</b>`)}\n` +
    `${field('Tamaño', `${EMOJI.TAG} <code>${zipSize} MB</code>`)}\n` +
    `${section(EMOJI.FIRE, 'Guía de Instalación')}` +
    `${DECO.BULLET} ${EMOJI.ARROW} <b>1.</b> Descomprime el archivo <code>.zip</code>\n` +
    `${DECO.BULLET} ${EMOJI.ARROW} <b>2.</b> Abre <code>chrome://extensions</code>\n` +
    `${DECO.BULLET} ${EMOJI.ARROW} <b>3.</b> Activa <b>"Modo desarrollador"</b>\n` +
    `${DECO.BULLET} ${EMOJI.ARROW} <b>4.</b> Click en <b>"Cargar extensión"</b>\n` +
    `${DECO.BULLET} ${EMOJI.ARROW} <b>5.</b> Ingresa tu ID: <code>${chatId}</code>\n` +
    `\n${footer(`${EMOJI.LOCK} Paquete cifrado • Exclusivo VIP`)}`
  );
}

export function renderHelpMessage(isOwnerUser) {
  let text =
    `${header('CODEX® AYUDA', 'Centro de Comandos')}\n` +
    `${section(EMOJI.INFO, 'Comandos Generales')}` +
    `${DECO.BULLET} <b>/start</b> — ${DECO.BRACKET_CORNER_LEFT} <i>Registrar identidad</i> ${DECO.BRACKET_CORNER_RIGHT}\n` +
    `${DECO.BULLET} <b>/me</b> — ${DECO.BRACKET_CORNER_LEFT} <i>Perfil y ID de acceso</i> ${DECO.BRACKET_CORNER_RIGHT}\n` +
    `${DECO.BULLET} <b>/extension</b> — ${DECO.BRACKET_CORNER_LEFT} <i>Descargar extensión .zip</i> ${DECO.BRACKET_CORNER_RIGHT}\n` +
    `${DECO.BULLET} <b>/status</b> — ${DECO.BRACKET_CORNER_LEFT} <i>Salud del servidor</i> ${DECO.BRACKET_CORNER_RIGHT}\n`;

  if (isOwnerUser) {
    text +=
      `\n${DECO.LINE_DOUBLE}\n` +
      `${section(EMOJI.CROWN, 'Comandos Admin')}` +
      `${DECO.BULLET} <code>/vip [ID/@user] [días]</code>\n` +
      `${DECO.BULLET} ${EMOJI.STAR} ${DECO.BRACKET_CORNER_LEFT} <i>Asignar días VIP</i> ${DECO.BRACKET_CORNER_RIGHT}\n` +
      `${DECO.BULLET} <code>/removevip [ID/@user]</code>\n` +
      `${DECO.BULLET} ${EMOJI.STAR} ${DECO.BRACKET_CORNER_LEFT} <i>Revocar plan VIP</i> ${DECO.BRACKET_CORNER_RIGHT}\n` +
      `${DECO.BULLET} <code>/users</code>\n` +
      `${DECO.BULLET} ${EMOJI.STAR} ${DECO.BRACKET_CORNER_LEFT} <i>Listar todos los usuarios</i> ${DECO.BRACKET_CORNER_RIGHT}\n`;
  }

  text +=
    `\n${DECO.LINE_THIN}\n` +
    `${EMOJI.CHAT} <b>¿Dudas o soporte técnico?</b>\n` +
    `${DECO.BULLET} <i>Contacta a nuestros Administradores</i>\n` +
    `\n${footer(`${EMOJI.LOCK} CODEX® System • Premium Security`)}`;

  return text;
}