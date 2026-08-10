// ─── Sistema de Componentes Visuales (SOLO Custom Emojis Premium) ──────────
import { EMOJI } from './emojis.mjs';

// Cabecera principal con borde decorativo
const header = (title) =>
  `${EMOJI.DIAMOND}${EMOJI.DIAMOND}${EMOJI.DIAMOND}${EMOJI.DIAMOND}${EMOJI.DIAMOND}${EMOJI.DIAMOND}${EMOJI.DIAMOND}${EMOJI.DIAMOND}${EMOJI.DIAMOND}${EMOJI.DIAMOND}\n` +
  `${EMOJI.SPARKLES}  <b>${title}</b>  ${EMOJI.SPARKLES}\n` +
  `${EMOJI.DIAMOND}${EMOJI.DIAMOND}${EMOJI.DIAMOND}${EMOJI.DIAMOND}${EMOJI.DIAMOND}${EMOJI.DIAMOND}${EMOJI.DIAMOND}${EMOJI.DIAMOND}${EMOJI.DIAMOND}${EMOJI.DIAMOND}`;

// Separador elegante
const divider = () =>
  `${EMOJI.STAR} ${EMOJI.STAR} ${EMOJI.STAR} ${EMOJI.STAR} ${EMOJI.STAR} ${EMOJI.STAR} ${EMOJI.STAR} ${EMOJI.STAR} ${EMOJI.STAR} ${EMOJI.STAR}`;

// Sección con título
const section = (title, content) =>
  `${EMOJI.SPARKLES} <b>${EMOJI.ARROW} ${title}</b>\n${content}`;

// Campo de información con valor
const field = (icon, label, value) =>
  `  ${icon} <b>${label}:</b> <code>${value}</code>`;

// Campo simple con texto libre
const simpleField = (icon, text) =>
  `  ${icon} ${text}`;

// Badge de estado (activo/inactivo)
const statusBadge = (active, activeText, inactiveText) =>
  active ? `${EMOJI.CHECK} <b>${activeText}</b>` : `${EMOJI.CROSS} <b>${inactiveText}</b>`;

// ─── Mensajes Mejorados (100% Custom Emojis Premium) ────────────────────────

export function renderStartVipMessage(user, chatId, status) {
  return (
    `${header('CODEX® SYSTEM')}\n\n` +
    `${EMOJI.SPARKLES} <b>¡Bienvenido de vuelta, ${user.name}!</b>\n` +
    `${EMOJI.GLOBE} Tu identidad ha sido verificada exitosamente.\n\n` +
    `${section('PERFIL DE OPERADOR', '')}` +
    `${field(EMOJI.STAR, 'Nombre', user.name)}\n` +
    `${field(EMOJI.TAG, 'ID Telegram', chatId)}\n` +
    `${field(EMOJI.CHAT, 'Usuario', user.username || 'No establecido')}\n\n` +
    `${section('ESTADO DE SUSCRIPCIÓN', '')}` +
    `${simpleField(EMOJI.DIAMOND, `Membresía: ${statusBadge(true, status.label, '')}`)}\n\n` +
    `${divider()}\n\n` +
    `${EMOJI.BULB} <b>ACCESOS RÁPIDOS</b>\n` +
    `${simpleField(EMOJI.ARROW, '<b>/extension</b> — Descargar extensión CODEX®')}\n` +
    `${simpleField(EMOJI.ARROW, '<b>/me</b> — Panel de perfil')}\n` +
    `${simpleField(EMOJI.ARROW, '<b>/help</b> — Centro de ayuda')}\n\n` +
    `${divider()}\n` +
    `${EMOJI.LOCK} <i>Sistema protegido por CODEX® Security Layer</i>`
  );
}

export function renderStartNoPlanMessage(user, chatId) {
  return (
    `${header('CODEX® SYSTEM')}\n\n` +
    `${EMOJI.SPARKLES} <b>¡Hola, ${user.name}!</b>\n` +
    `${EMOJI.GLOBE} Tu registro ha sido completado correctamente.\n\n` +
    `${section('DATOS REGISTRADOS', '')}` +
    `${field(EMOJI.STAR, 'Nombre', user.name)}\n` +
    `${field(EMOJI.TAG, 'ID Telegram', chatId)}\n` +
    `${field(EMOJI.CHAT, 'Usuario', user.username || 'No establecido')}\n\n` +
    `${EMOJI.WARNING} ${EMOJI.WARNING} ${EMOJI.WARNING} ${EMOJI.WARNING} ${EMOJI.WARNING}\n` +
    `${section('ESTADO DE SUSCRIPCIÓN', '')}` +
    `${simpleField(EMOJI.CROSS, 'No tienes un plan VIP activo')}\n\n` +
    `${EMOJI.LOCK} <b>ACCESO RESTRINGIDO</b>\n` +
    `${EMOJI.INFO} Para obtener la extensión CODEX® y generar\n` +
    `códigos OTP, necesitas un Plan VIP activo.\n\n` +
    `${EMOJI.MONEY} <b>Contacta a nuestros administradores</b>\n` +
    `${EMOJI.CHAT} para adquirir tu membresía premium.`
  );
}

export function renderProfileMessage(user, chatId, status, expDateStr, isOwnerUser) {
  const rankIcon = isOwnerUser ? EMOJI.CROWN : EMOJI.SHIELD;
  const rankText = isOwnerUser ? 'OWNER (Acceso Ilimitado)' : user.role.toUpperCase();

  return (
    `${header('PANEL DE OPERADOR')}\n\n` +
    `${section('INFORMACIÓN PERSONAL', '')}` +
    `${field(EMOJI.PIN, 'Nombre', user.name)}\n` +
    `${field(EMOJI.TAG, 'ID Telegram', chatId)}\n` +
    `${field(EMOJI.CHAT, 'Handle', user.username || 'No establecido')}\n\n` +
    `${section('LICENCIA Y ESTADO', '')}` +
    `${simpleField(rankIcon, `Rango: <b>${rankText}</b>`)}\n` +
    `${simpleField(EMOJI.DIAMOND, `VIP: ${statusBadge(status.hasPlan, 'ACTIVO', 'INACTIVO')}`)}\n` +
    `${field(EMOJI.CALENDAR, 'Expiración', expDateStr)}\n\n` +
    `${divider()}\n\n` +
    `${EMOJI.LOCK} <b>CÓDIGO DE ACCESO</b>\n` +
    `${EMOJI.LOCK} Tu ID de acceso es: <code>${chatId}</code>\n\n` +
    `${EMOJI.INFO} <i>Usa este código en la extensión CODEX®\n` +
    `para iniciar sesión en el panel de control.</i>`
  );
}

export function renderVipGrantedOwnerMessage(user, daysNum, expDateStr) {
  return (
    `${EMOJI.PARTY}${EMOJI.PARTY}${EMOJI.PARTY}${EMOJI.PARTY}${EMOJI.PARTY}${EMOJI.PARTY}${EMOJI.PARTY}${EMOJI.PARTY}\n` +
    `${EMOJI.CROWN} <b>MEMBRESÍA VIP CONCEDIDA</b> ${EMOJI.CROWN}\n` +
    `${EMOJI.PARTY}${EMOJI.PARTY}${EMOJI.PARTY}${EMOJI.PARTY}${EMOJI.PARTY}${EMOJI.PARTY}${EMOJI.PARTY}${EMOJI.PARTY}\n\n` +
    `${section('OPERADOR BENEFICIADO', '')}` +
    `${field(EMOJI.PIN, 'Nombre', user.name)}\n` +
    `${field(EMOJI.CHAT, 'Usuario', user.username || 'Sin @')}\n` +
    `${field(EMOJI.TAG, 'ID Telegram', user.telegramId)}\n\n` +
    `${section('DETALLES DE LA LICENCIA', '')}` +
    `${simpleField(EMOJI.PLUS, `Días agregados: <code>+${daysNum} días</code>`)}\n` +
    `${field(EMOJI.CALENDAR, 'Nueva expiración', expDateStr)}\n\n` +
    `${divider()}\n` +
    `${EMOJI.CHECK} <i>Licencia otorgada por el Administrador del Sistema</i>\n` +
    `${EMOJI.LOCK} <i>CODEX® System - Panel de Control</i>`
  );
}

export function renderVipGrantedUserMessage(daysNum, expDateStr, telegramId) {
  return (
    `${EMOJI.PARTY}${EMOJI.PARTY}${EMOJI.PARTY} <b>¡FELICIDADES!</b> ${EMOJI.PARTY}${EMOJI.PARTY}${EMOJI.PARTY}\n\n` +
    `${EMOJI.DIAMOND} <b>Tu Plan VIP ha sido activado exitosamente</b>\n\n` +
    `${EMOJI.SPARKLES} El administrador te ha otorgado:\n` +
    `${EMOJI.SPARKLES} <b>${daysNum} días</b> de membresía premium\n\n` +
    `${section('INFORMACIÓN IMPORTANTE', '')}` +
    `${field(EMOJI.CALENDAR, 'Fecha de expiración', expDateStr)}\n` +
    `${field(EMOJI.LOCK, 'Código de acceso', telegramId)}\n\n` +
    `${EMOJI.BULB} <b>¿Qué sigue ahora?</b>\n` +
    `${EMOJI.ARROW} Usa el comando /extension para descargar\n` +
    `tu paquete VIP y comienza a usar CODEX®.\n\n` +
    `${EMOJI.FIRE} <i>¡Bienvenido a la experiencia premium!</i>`
  );
}

export function renderStatusMessage(distExists, zipExists, zipSize, usersCount, serverTimeStr) {
  return (
    `${header('ESTADO DEL SISTEMA')}\n\n` +
    `${section('INFRAESTRUCTURA', '')}` +
    `${simpleField(EMOJI.DESKTOP, 'Bot: <b>@CodexrOutBot</b>')}\n` +
    `${simpleField(EMOJI.GLOBE, 'Health Check: <code>Online (Puerto 10000)</code>')}\n` +
    `${simpleField(EMOJI.LINK, 'Base de Datos: <b>Supabase Connected</b>')}\n\n` +
    `${section('COMPONENTES', '')}` +
    `${simpleField(EMOJI.GEAR, `Extensión (dist/): ${statusBadge(distExists, 'Compilado', 'Pendiente')}`)}\n` +
    `${simpleField(EMOJI.GEAR, `ZIP VIP: ${statusBadge(zipExists, `Listo (${zipSize})`, 'Sin crear')}`)}\n` +
    `${simpleField(EMOJI.EYES, `Usuarios registrados: <code>${usersCount}</code>`)}\n\n` +
    `${divider()}\n` +
    `${field(EMOJI.CALENDAR, 'Hora del servidor', serverTimeStr)}\n\n` +
    `${EMOJI.GREEN} <b>Todos los sistemas operativos</b>`
  );
}

export function renderExtensionCaption(user, status, zipSize, chatId) {
  return (
    `${header('PAQUETE DE EXTENSIÓN')}\n\n` +
    `${EMOJI.STAR} <b>CODEX® Extension v1.1</b>\n` +
    `${EMOJI.STAR} Premium VIP Package\n\n` +
    `${section('USUARIO AUTORIZADO', '')}` +
    `${field(EMOJI.PIN, 'Operador', user.name)}\n` +
    `${field(EMOJI.DIAMOND, 'Membresía', status.label)}\n` +
    `${field(EMOJI.TAG, 'Tamaño', `${zipSize} MB`)}\n\n` +
    `${section('GUÍA DE INSTALACIÓN', '')}` +
    `${simpleField(EMOJI.ARROW, '<b>1. Descomprime</b> el archivo .zip')}\n` +
    `${simpleField(EMOJI.ARROW, '<b>2. Abre</b> chrome://extensions en Chrome')}\n` +
    `${simpleField(EMOJI.ARROW, '<b>3. Activa</b> el "Modo desarrollador"')}\n` +
    `${simpleField(EMOJI.ARROW, '<b>4. Click</b> en "Cargar extensión sin empaquetar"')}\n` +
    `${simpleField(EMOJI.ARROW, '<b>5. Ingresa</b> tu ID: <code>${chatId}</code>')}\n\n` +
    `${divider()}\n` +
    `${EMOJI.LOCK} <i>Paquete cifrado • Exclusivo miembros VIP</i>\n` +
    `${EMOJI.WARNING} <i>No compartir • CODEX® Security</i>`
  );
}

export function renderHelpMessage(isOwnerUser) {
  let text =
    `${header('CENTRO DE COMANDOS')}\n\n` +
    `${EMOJI.INFO} <b>GUÍA DE REFERENCIA RÁPIDA</b>\n\n` +
    `${section('COMANDOS GENERALES', '')}` +
    `${simpleField(EMOJI.ARROW, '<b>/start</b> — Registrar identidad')}\n` +
    `${simpleField(EMOJI.ARROW, '<b>/me</b> — Perfil y código de acceso')}\n` +
    `${simpleField(EMOJI.ARROW, '<b>/extension</b> — Descargar extensión VIP')}\n` +
    `${simpleField(EMOJI.ARROW, '<b>/status</b> — Estado del servidor')}\n\n`;

  if (isOwnerUser) {
    text +=
      `${divider()}\n\n` +
      `${section('COMANDOS ADMINISTRADOR', '')}` +
      `${simpleField(EMOJI.CROWN, '<code>/vip [ID/@user] [días]</code>')}\n` +
      `${simpleField(EMOJI.STAR, '→ Otorgar membresía VIP')}\n\n` +
      `${simpleField(EMOJI.CROWN, '<code>/removevip [ID/@user]</code>')}\n` +
      `${simpleField(EMOJI.STAR, '→ Revocar membresía VIP')}\n\n` +
      `${simpleField(EMOJI.CROWN, '<code>/users</code>')}\n` +
      `${simpleField(EMOJI.STAR, '→ Listar todos los usuarios')}\n\n`;
  }

  text +=
    `${divider()}\n` +
    `${EMOJI.CHAT} <b>¿Necesitas ayuda?</b>\n` +
    `${EMOJI.INFO} Contacta a nuestros administradores\n` +
    `${EMOJI.GLOBE} para soporte técnico personalizado.\n\n` +
    `${EMOJI.LOCK} <i>CODEX® System • Seguridad Avanzada</i>`;

  return text;
}