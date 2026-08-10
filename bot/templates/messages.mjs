import { EMOJI } from './emojis.mjs';

export function renderStartVipMessage(user, chatId, status) {
  return (
    `${EMOJI.LIGHTNING} <b>CODEX(R) SYSTEM — PLATAFORMA DE CONTROL</b> ${EMOJI.LIGHTNING}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `${EMOJI.SPARKLES} <b>¡Hola, ${user.name}!</b>\n` +
    `Tu identidad ha sido verificada en el servidor central.\n\n` +
    `${EMOJI.CHART} <b>DATOS DE TU CUENTA</b>\n` +
    ` ├ ${EMOJI.STAR} <b>Nombre:</b> ${user.name}\n` +
    ` ├ ${EMOJI.TAG} <b>ID Telegram:</b> <code>${chatId}</code>\n` +
    ` └ ${EMOJI.CHAT} <b>Usuario:</b> ${user.username || 'Sin Username'}\n\n` +
    `${EMOJI.DIAMOND} <b>ESTADO DE SUSCRIPCIÓN</b>\n` +
    ` └ ${EMOJI.STAR} <b>Membresía:</b> ${EMOJI.CHECK} <b>${status.label}</b>\n\n` +
    `${EMOJI.PIN} <b>COMANDOS RÁPIDOS:</b>\n` +
    ` ${EMOJI.ARROW} /extension — Descargar paquete de extensión (.zip)\n` +
    ` ${EMOJI.ARROW} /me — Ver tu perfil de acceso\n` +
    ` ${EMOJI.ARROW} /help — Lista de comandos`
  );
}

export function renderStartNoPlanMessage(user, chatId) {
  return (
    `${EMOJI.LIGHTNING} <b>CODEX(R) SYSTEM — PLATAFORMA DE CONTROL</b> ${EMOJI.LIGHTNING}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `${EMOJI.SPARKLES} <b>¡Hola, ${user.name}!</b>\n` +
    `Tu ID de Telegram ha sido registrado correctamente.\n\n` +
    `${EMOJI.CHART} <b>DATOS REGISTRADOS</b>\n` +
    ` ├ ${EMOJI.STAR} <b>Nombre:</b> ${user.name}\n` +
    ` ├ ${EMOJI.TAG} <b>ID Telegram:</b> <code>${chatId}</code>\n` +
    ` └ ${EMOJI.CHAT} <b>Usuario:</b> ${user.username || 'Sin Username'}\n\n` +
    `${EMOJI.WARNING} <b>ESTADO DE SUSCRIPCIÓN</b>\n` +
    ` └ ${EMOJI.CROSS} <b>SIN PLAN VIP ACTIVO</b>\n\n` +
    `${EMOJI.LOCK} <i>Para acceder a la extensión CODEX(R) y generar códigos OTP, adquiere un Plan VIP con nuestros Administradores.</i>`
  );
}

export function renderProfileMessage(user, chatId, status, expDateStr, isOwnerUser) {
  return (
    `${EMOJI.DIAMOND} <b>CODEX(R) — PANEL DE PERFIL DE OPERADOR</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `${EMOJI.STAR} <b>INFORMACIÓN PERSONAL</b>\n` +
    ` ├ ${EMOJI.PIN} <b>Nombre:</b> ${user.name}\n` +
    ` ├ ${EMOJI.TAG} <b>Telegram ID:</b> <code>${chatId}</code>\n` +
    ` └ ${EMOJI.CHAT} <b>Handle:</b> ${user.username || 'Sin @'}\n\n` +
    `${EMOJI.SHIELD} <b>ESTADO Y LICENCIA</b>\n` +
    ` ├ ${EMOJI.STAR} <b>Rango:</b> ${isOwnerUser ? `${EMOJI.CROWN} OWNER (Ilimitado)` : user.role.toUpperCase()}\n` +
    ` ├ ${EMOJI.LOCK} <b>Estado VIP:</b> ${status.hasPlan ? `${EMOJI.CHECK} ACTIVO` : `${EMOJI.CROSS} INACTIVO`}\n` +
    ` └ ${EMOJI.CALENDAR} <b>Expiración:</b> <code>${expDateStr}</code>\n\n` +
    `${EMOJI.LIGHTNING} <b>CÓDIGO DE ACCESO PANEL</b>\n` +
    ` └ ${EMOJI.LOCK} <code>${chatId}</code>\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `<i>Ingresa tu ID <code>${chatId}</code> en el panel de la extensión CODEX(R) para iniciar sesión.</i>`
  );
}

export function renderVipGrantedOwnerMessage(user, daysNum, expDateStr) {
  return (
    `${EMOJI.PARTY} <b>CODEX(R) — MEMBRESÍA VIP ACTIVADA CON ÉXITO</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `${EMOJI.STAR} <b>DATOS DEL OPERADOR</b>\n` +
    ` ├ ${EMOJI.PIN} <b>Nombre:</b> ${user.name}\n` +
    ` ├ ${EMOJI.CHAT} <b>Usuario:</b> ${user.username || 'Sin @'}\n` +
    ` └ ${EMOJI.TAG} <b>Telegram ID:</b> <code>${user.telegramId}</code>\n\n` +
    `${EMOJI.STAR} <b>LICENCIA CONCEDIDA</b>\n` +
    ` ├ ${EMOJI.PLUS} <b>Días Agregados:</b> <code>+${daysNum} Días</code>\n` +
    ` └ ${EMOJI.CALENDAR} <b>Nueva Expiración:</b> <code>${expDateStr}</code>\n\n` +
    `${EMOJI.CROWN} <i>Otorgado por el Administrador de CODEX(R) System.</i>`
  );
}

export function renderVipGrantedUserMessage(daysNum, expDateStr, telegramId) {
  return (
    `${EMOJI.PARTY} <b>¡TU PLAN VIP HA SIDO ACTIVADO!</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `El administrador te ha otorgado <b>${daysNum} días</b> de membresía VIP.\n\n` +
    `${EMOJI.CALENDAR} <b>Fecha Expiración:</b> <code>${expDateStr}</code>\n\n` +
    `${EMOJI.LOCK} Tu código de acceso para la extensión es: <code>${telegramId}</code>`
  );
}

export function renderStatusMessage(distExists, zipExists, zipSize, usersCount, serverTimeStr) {
  return (
    `${EMOJI.CHART} <b>CODEX(R) — ESTADO TÉCNICO DEL SERVIDOR</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `${EMOJI.GLOBE} <b>INFRAESTRUCTURA DE RED</b>\n` +
    ` ├ ${EMOJI.DESKTOP} <b>Bot Telegram:</b> @CodexrOutBot\n` +
    ` ├ ${EMOJI.LIGHTNING} <b>Health Check Server:</b> <code>Online (Puerto 10000)</code>\n` +
    ` └ ${EMOJI.GLOBE} <b>Base de Datos:</b> Supabase Connected\n\n` +
    `${EMOJI.GEAR} <b>SISTEMA Y COMPILACIÓN</b>\n` +
    ` ├ ${EMOJI.TAG} <b>Extensión (dist/):</b> ${distExists ? `${EMOJI.CHECK} Compilado` : `${EMOJI.CROSS} Pendiente`}\n` +
    ` ├ ${EMOJI.TAG} <b>ZIP VIP:</b> ${zipExists ? `${EMOJI.CHECK} Listo (${zipSize})` : `${EMOJI.CROSS} Sin crear`}\n` +
    ` └ ${EMOJI.EYES} <b>Usuarios Registrados:</b> <code>${usersCount}</code>\n\n` +
    `${EMOJI.CALENDAR} <b>HORA SERVIDOR:</b> <code>${serverTimeStr}</code>`
  );
}

export function renderExtensionCaption(user, status, zipSize, chatId) {
  return (
    `${EMOJI.STAR} <b>CODEX(R) — PAQUETE DE EXTENSIÓN VIP (V1.1)</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `${EMOJI.STAR} <b>USUARIO AUTORIZADO</b>\n` +
    ` ├ ${EMOJI.PIN} <b>Operador:</b> ${user.name}\n` +
    ` ├ ${EMOJI.CALENDAR} <b>Membresía:</b> ${status.label}\n` +
    ` └ ${EMOJI.TAG} <b>Tamaño Paquete:</b> <code>${zipSize} MB</code>\n\n` +
    `${EMOJI.FIRE} <b>GUÍA RÁPIDA DE INSTALACIÓN</b>\n` +
    ` ${EMOJI.ARROW} <b>1. Descomprime</b> el archivo <code>CODEX_R_Extension.zip</code>.\n` +
    ` ${EMOJI.ARROW} <b>2. Abre Chrome</b> e ingresa a <code>chrome://extensions</code>.\n` +
    ` ${EMOJI.ARROW} <b>3. Activa</b> el <b>"Modo desarrollador"</b> arriba a la derecha.\n` +
    ` ${EMOJI.ARROW} <b>4. Haz clic</b> en <b>"Cargar extensión sin empaquetar"</b> y selecciona la carpeta.\n` +
    ` ${EMOJI.ARROW} <b>5. Abre la extensión</b> e ingresa tu ID <code>${chatId}</code>.\n\n` +
    `${EMOJI.LOCK} <i>Paquete cifrado exclusivo para miembros VIP.</i>`
  );
}

export function renderHelpMessage(isOwnerUser) {
  let text =
    `${EMOJI.INFO} <b>CODEX(R) — CENTRO DE COMANDOS Y AYUDA</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `${EMOJI.ARROW} <b>COMANDOS DE USUARIO</b>\n` +
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
  return text;
}
