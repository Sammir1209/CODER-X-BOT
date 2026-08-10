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
  result += `${EMOJI.STAR} ${title} ${EMOJI.STAR}\n`;
  if (subtitle) result += `${DECO.BULLET} ${subtitle}\n`;
  result += `${DECO.LINE_THICK}`;
  return result;
};

const section = (emoji, title) =>
  `\n${emoji} ${title} ${DECO.ARROW_FANCY}\n`;

const field = (label, value) =>
  `${DECO.BULLET}  ${label}: ${value}`;

const footer = (text) =>
  `\n${DECO.LINE_THICK}\n${text}`;

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
  return `${DECO.BLOCK_FULL.repeat(filled)}${DECO.BLOCK_GHOST.repeat(empty)} ${percentage}%`;
}

function getSubscriptionBlock(status, user) {
  if (status.isOwner) {
    return (
      `${section(EMOJI.CROWN, 'Owner Info')}` +
      `${field('Rango', `${EMOJI.CROWN} Owner`)}\n` +
      `${field('Estado', `${EMOJI.CHECK} Acceso Ilimitado`)}\n` +
      `${field('Plan', `${EMOJI.DIAMOND} Permanente`)}\n` +
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
      `${field('Estado', `${EMOJI.CHECK} Activo`)}\n` +
      `${field('Expira', `${EMOJI.CALENDAR} ${expDate}`)}\n` +
      `${field('Días restantes', `${statusIcon} ${days} días`)}\n` +
      `${field('Progreso', `${buildProgressBar(percentage)}`)}`
    );
  }
  return (
    `${section(EMOJI.WARNING, 'Sin Plan')}` +
    `${field('Estado', `${EMOJI.CROSS} Inactivo`)}\n` +
    `${field('Plan', `${EMOJI.PROHIBITED} Sin plan VIP activo`)}\n` +
    `${field('Progreso', `${buildProgressBar(0)}`)}`
  );
}

// ─── Plantillas Estilo AkiChik + Custom Emojis Premium ────────────────────

export function renderStartVipMessage(user, chatId, status) {
  return (
    `${header('CODEX® SYSTEM', 'Plataforma de Control')}\n` +
    `\n` +
    `${EMOJI.SPARKLES} ¡Bienvenido, ${user.name}!\n` +
    `${DECO.BULLET} Identidad verificada en el servidor.\n` +
    `${section(EMOJI.CHART, 'User Info')}` +
    `${field('FirstName', user.name)}\n` +
    `${field('ID', chatId)}\n` +
    `${field('Usuario', user.username || 'Sin Username')}\n` +
    `${getSubscriptionBlock(status, user)}\n` +
    `\n${DECO.LINE_DASHED}\n` +
    `\n` +
    `${EMOJI.PIN} Comandos Rápidos ${DECO.ARROW_FANCY}\n` +
    `${DECO.BULLET} ${EMOJI.ARROW} /extension — Descargar extensión .zip\n` +
    `${DECO.BULLET} ${EMOJI.ARROW} /me — Ver perfil de acceso\n` +
    `${DECO.BULLET} ${EMOJI.ARROW} /help — Lista de comandos\n` +
    `\n${footer(`${EMOJI.LOCK} CODEX® System • Premium Security`)}`
  );
}

export function renderStartNoPlanMessage(user, chatId) {
  const noStatus = { hasPlan: false, isOwner: false };
  return (
    `${header('CODEX® SYSTEM', 'Plataforma de Control')}\n` +
    `\n` +
    `${EMOJI.SPARKLES} ¡Hola, ${user.name}!\n` +
    `${DECO.BULLET} Tu ID ha sido registrado correctamente.\n` +
    `${section(EMOJI.CHART, 'User Info')}` +
    `${field('FirstName', user.name)}\n` +
    `${field('ID', chatId)}\n` +
    `${field('Usuario', user.username || 'Sin Username')}\n` +
    `${getSubscriptionBlock(noStatus, user)}\n` +
    `\n${DECO.LINE_DOTTED}\n` +
    `\n` +
    `${EMOJI.LOCK} Acceso Restringido ${DECO.ARROW_FANCY}\n` +
    `${DECO.BULLET} Para acceder a la extensión CODEX®\n` +
    `${DECO.BULLET} y generar códigos OTP, necesitas\n` +
    `${DECO.BULLET} un Plan VIP activo.\n` +
    `\n${footer(`${EMOJI.MONEY} Contacta a nuestros Administradores`)}`
  );
}

export function renderProfileMessage(user, chatId, status, expDateStr, isOwnerUser) {
  return (
    `${EMOJI.SPARKLES} ${user.name} - User Profile - ( ${EMOJI.STAR} )\n` +
    `${DECO.LINE_THICK}\n` +
    `${section(EMOJI.CHART, 'User Info')}` +
    `${field('FirstName', user.name)}\n` +
    `${field('ID', chatId)}\n` +
    `${field('Usuario', user.username || 'Sin @')}\n` +
    `${getSubscriptionBlock(status, user)}\n` +
    `\n${DECO.LINE_THIN}\n` +
    `${section(EMOJI.KEY, 'Access Info')}` +
    `${field('Código Acceso', `${EMOJI.LOCK} ${chatId}`)}\n` +
    `${field('Expiración', `${EMOJI.CALENDAR} ${expDateStr}`)}\n` +
    `${DECO.BULLET} ${EMOJI.SHOPPING} Promoción del Mes [Comprar]\n` +
    `\n${footer(`${EMOJI.LOCK} CODEX® System • Seguridad Garantizada`)}`
  );
}

export function renderVipGrantedOwnerMessage(user, daysNum, expDateStr) {
  return (
    `${EMOJI.PARTY}${EMOJI.PARTY}${EMOJI.PARTY} VIP ACTIVADO ${EMOJI.PARTY}${EMOJI.PARTY}${EMOJI.PARTY}\n` +
    `${DECO.LINE_THICK}\n` +
    `${section(EMOJI.STAR, 'Operador Beneficiado')}` +
    `${field('Nombre', user.name)}\n` +
    `${field('Usuario', user.username || 'Sin @')}\n` +
    `${field('Telegram ID', user.telegramId)}\n` +
    `\n${DECO.LINE_THIN}\n` +
    `${section(EMOJI.STAR, 'Licencia Concedida')}` +
    `${field('Días Agregados', `${EMOJI.PLUS} +${daysNum} Días`)}\n` +
    `${field('Nueva Expiración', `${EMOJI.CALENDAR} ${expDateStr}`)}\n` +
    `${field('Progreso', `${buildProgressBar(100)}`)}\n` +
    `\n${footer(`${EMOJI.CROWN} Otorgado por CODEX® Admin`)}`
  );
}

export function renderVipGrantedUserMessage(daysNum, expDateStr, telegramId) {
  return (
    `${EMOJI.PARTY}${EMOJI.PARTY}${EMOJI.PARTY} ¡FELICIDADES! ${EMOJI.PARTY}${EMOJI.PARTY}${EMOJI.PARTY}\n` +
    `${DECO.LINE_THICK}\n` +
    `\n` +
    `${EMOJI.DIAMOND} Tu Plan VIP ha sido activado\n` +
    `\n` +
    `${EMOJI.SPARKLES} El administrador te ha otorgado:\n` +
    `${DECO.BULLET} ${EMOJI.FIRE} ${daysNum} días de membresía premium\n` +
    `${DECO.BULLET} Progreso: ${buildProgressBar(100)}\n` +
    `${section(EMOJI.CALENDAR, 'Información Importante')}` +
    `${field('Fecha Expiración', `${EMOJI.CALENDAR} ${expDateStr}`)}\n` +
    `${field('Código Acceso', `${EMOJI.LOCK} ${telegramId}`)}\n` +
    `\n${DECO.LINE_DASHED}\n` +
    `\n` +
    `${EMOJI.BULB} ¿Qué sigue ahora? ${DECO.ARROW_FANCY}\n` +
    `${DECO.BULLET} Usa ${EMOJI.ARROW} /extension para descargar tu VIP\n` +
    `\n${footer(`${EMOJI.FIRE} ¡Bienvenido a CODEX® Premium!`)}`
  );
}

export function renderStatusMessage(distExists, zipExists, zipSize, usersCount, serverTimeStr) {
  return (
    `${header('CODEX® ESTADO', 'Sistema Técnico')}\n` +
    `${section(EMOJI.GLOBE, 'Infraestructura')}` +
    `${field('Bot Telegram', `${EMOJI.DESKTOP} @CodexrOutBot`)}\n` +
    `${field('Health Check', `${EMOJI.LIGHTNING} Online (Puerto 10000)`)}\n` +
    `${field('Base Datos', `${EMOJI.LINK} Supabase Connected`)}\n` +
    `${section(EMOJI.GEAR, 'Componentes')}` +
    `${field('Extensión (dist/)', distExists ? `${EMOJI.CHECK} Compilado` : `${EMOJI.CROSS} Pendiente`)}\n` +
    `${field('ZIP VIP', zipExists ? `${EMOJI.CHECK} Listo (${zipSize})` : `${EMOJI.CROSS} Sin crear`)}\n` +
    `${field('Usuarios', `${EMOJI.EYES} ${usersCount}`)}\n` +
    `\n${DECO.LINE_THIN}\n` +
    `${field('Hora Servidor', `${EMOJI.CALENDAR} ${serverTimeStr}`)}\n` +
    `\n${footer(`${EMOJI.GREEN} Todos los sistemas operativos`)}`
  );
}

export function renderExtensionCaption(user, status, zipSize, chatId) {
  return (
    `${header('CODEX® EXTENSIÓN', 'Paquete VIP v1.1')}\n` +
    `${section(EMOJI.STAR, 'Usuario Autorizado')}` +
    `${field('Operador', user.name)}\n` +
    `${field('Membresía', `${EMOJI.DIAMOND} ${status.label}`)}\n` +
    `${field('Tamaño', `${EMOJI.TAG} ${zipSize} MB`)}\n` +
    `${section(EMOJI.FIRE, 'Guía de Instalación')}` +
    `${DECO.BULLET} ${EMOJI.ARROW} 1. Descomprime el archivo .zip\n` +
    `${DECO.BULLET} ${EMOJI.ARROW} 2. Abre chrome://extensions\n` +
    `${DECO.BULLET} ${EMOJI.ARROW} 3. Activa "Modo desarrollador"\n` +
    `${DECO.BULLET} ${EMOJI.ARROW} 4. Click en "Cargar extensión"\n` +
    `${DECO.BULLET} ${EMOJI.ARROW} 5. Ingresa tu ID: ${chatId}\n` +
    `\n${footer(`${EMOJI.LOCK} Paquete cifrado • Exclusivo VIP`)}`
  );
}

export function renderHelpMessage(isOwnerUser) {
  let text =
    `${header('CODEX® AYUDA', 'Centro de Comandos')}\n` +
    `${section(EMOJI.INFO, 'Comandos Generales')}` +
    `${DECO.BULLET} /start — ${DECO.BRACKET_CORNER_LEFT} Registrar identidad ${DECO.BRACKET_CORNER_RIGHT}\n` +
    `${DECO.BULLET} /me — ${DECO.BRACKET_CORNER_LEFT} Perfil y ID de acceso ${DECO.BRACKET_CORNER_RIGHT}\n` +
    `${DECO.BULLET} /extension — ${DECO.BRACKET_CORNER_LEFT} Descargar extensión .zip ${DECO.BRACKET_CORNER_RIGHT}\n` +
    `${DECO.BULLET} /status — ${DECO.BRACKET_CORNER_LEFT} Salud del servidor ${DECO.BRACKET_CORNER_RIGHT}\n`;

  if (isOwnerUser) {
    text +=
      `\n${DECO.LINE_DOUBLE}\n` +
      `${section(EMOJI.CROWN, 'Comandos Admin')}` +
      `${DECO.BULLET} /vip [ID/@user] [días]\n` +
      `${DECO.BULLET} ${EMOJI.STAR} ${DECO.BRACKET_CORNER_LEFT} Asignar días VIP ${DECO.BRACKET_CORNER_RIGHT}\n` +
      `${DECO.BULLET} /removevip [ID/@user]\n` +
      `${DECO.BULLET} ${EMOJI.STAR} ${DECO.BRACKET_CORNER_LEFT} Revocar plan VIP ${DECO.BRACKET_CORNER_RIGHT}\n` +
      `${DECO.BULLET} /users\n` +
      `${DECO.BULLET} ${EMOJI.STAR} ${DECO.BRACKET_CORNER_LEFT} Listar todos los usuarios ${DECO.BRACKET_CORNER_RIGHT}\n`;
  }

  text +=
    `\n${DECO.LINE_THIN}\n` +
    `${EMOJI.CHAT} ¿Dudas o soporte técnico?\n` +
    `${DECO.BULLET} Contacta a nuestros Administradores\n` +
    `\n${footer(`${EMOJI.LOCK} CODEX® System • Premium Security`)}`;

  return text;
}