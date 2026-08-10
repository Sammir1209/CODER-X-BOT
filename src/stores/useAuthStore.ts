/**
 * CODEX(R) System — Auth Store & VIP Membership Checker
 *
 * Manages user authentication, Telegram Bot OTP verification,
 * and VIP membership plan validation.
 */

import { create } from 'zustand';
import { storageGet, storageSet, storageRemove, storageSetMultiple } from '../utils/storageAdapter';
import { STORAGE_KEYS, TIMING, TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_USERNAME } from '../utils/constants';

export const DEFAULT_TELEGRAM_BOT_TOKEN = TELEGRAM_BOT_TOKEN;
export const OWNER_TELEGRAM_ID = '7794982496';
export const OWNER_CONTACT_LINK = 'https://t.me/SammirContreras';

export interface CODEXUser {
  telegramId: string;
  email: string;
  name: string;
  username?: string;
  role?: string;
  planExpiry?: number | null;
  vipDaysLeft?: number;
}

interface StoredUser extends CODEXUser {
  pass?: string;
}

interface PendingOtp {
  code: string;
  telegramId: string;
  createdAt: number;
  attempts: number;
}

interface CheckPlanResult {
  hasPlan: boolean;
  daysLeft: number;
  label: string;
  user: CODEXUser;
}

interface AuthState {
  user: CODEXUser | null;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  botToken: string;
  botUsername: string;
  botApiUrl: string;
  officialWebUrl: string;
  activeOtp: string;
  telegramUserInfo: { name: string; username: string } | null;

  // Actions
  initializeAuth: () => Promise<void>;
  fetchTelegramUserInfo: (telegramId: string) => Promise<{ name: string; username: string } | null>;
  verifyTelegramIdAndPlan: (telegramId: string) => Promise<CheckPlanResult>;
  generateTelegramOtp: (telegramId: string, daysLeft: number) => Promise<string>;
  verifyTelegramOtp: (telegramId: string, code: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  saveBotSettings: (token: string, username: string, apiUrl: string) => Promise<void>;
  saveOfficialWebUrl: (url: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isInitializing: true,
  error: null,
  botToken: TELEGRAM_BOT_TOKEN,
  botUsername: TELEGRAM_BOT_USERNAME,
  botApiUrl: '',
  officialWebUrl: 'https://CODEX-platform.com',
  activeOtp: '',
  telegramUserInfo: null,

  initializeAuth: async () => {
    set({ isInitializing: true });
    try {
      // Check active session
      const session = await storageGet<CODEXUser>(STORAGE_KEYS.SESSION);
      if (session) {
        set({ user: session, isInitializing: false });

        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          chrome.storage.local.set({ [STORAGE_KEYS.TELEGRAM_CHAT_ID]: session.telegramId });
        }
      } else {
        set({ user: null, isInitializing: false });
      }
    } catch {
      set({ isInitializing: false });
    }
  },

  fetchTelegramUserInfo: async (telegramId: string) => {
    const cleanId = telegramId.trim();
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChat?chat_id=${cleanId}`,
        { signal: AbortSignal.timeout(5000) }
      );
      const data = await res.json();
      if (data.ok && data.result) {
        const r = data.result;
        const displayName = [r.first_name, r.last_name].filter(Boolean).join(' ') || r.username || `User ${cleanId}`;
        const username = r.username ? `@${r.username}` : cleanId;
        const info = { name: displayName, username };
        set({ telegramUserInfo: info });
        return info;
      }
    } catch {}
    set({ telegramUserInfo: null });
    return null;
  },

  verifyTelegramIdAndPlan: async (telegramId: string): Promise<CheckPlanResult> => {
    set({ isLoading: true, error: null });
    const cleanId = telegramId.trim();

    // 1. Fetch info from Telegram API
    const info = await get().fetchTelegramUserInfo(cleanId);
    const displayName = info?.name || `User ${cleanId}`;
    const username = info?.username || `@${cleanId}`;

    // 2. Fetch stored users or check Owner
    const users = (await storageGet<StoredUser[]>(STORAGE_KEYS.USERS)) || [];
    let found = users.find((u) => u.telegramId === cleanId);

    if (!found) {
      found = {
        telegramId: cleanId,
        email: `${cleanId}@CODEX.test`,
        name: displayName,
        username,
        role: cleanId === OWNER_TELEGRAM_ID ? 'owner' : 'user',
        planExpiry: cleanId === OWNER_TELEGRAM_ID ? 4102444800000 : null,
      };
      users.push(found);
      await storageSet(STORAGE_KEYS.USERS, users);
    } else {
      // Update name/username
      found.name = displayName;
      found.username = username;
      if (cleanId === OWNER_TELEGRAM_ID) {
        found.role = 'owner';
        found.planExpiry = 4102444800000;
      }
      await storageSet(STORAGE_KEYS.USERS, users);
    }

    // 3. Evaluate VIP Plan
    const now = Date.now();
    let hasPlan = false;
    let daysLeft = 0;
    let label = 'Sin Plan Activo';

    if (cleanId === OWNER_TELEGRAM_ID || found.role === 'owner') {
      hasPlan = true;
      daysLeft = 9999;
      label = 'VIP OWNER (Ilimitado)';
    } else if (found.planExpiry && found.planExpiry > now) {
      hasPlan = true;
      daysLeft = Math.ceil((found.planExpiry - now) / (1000 * 60 * 60 * 24));
      label = `VIP ACTIVO (${daysLeft}d restantes)`;
    }

    const userData: CODEXUser = {
      telegramId: cleanId,
      email: found.email || `${cleanId}@CODEX.test`,
      name: found.name,
      username: found.username,
      role: found.role,
      planExpiry: found.planExpiry,
      vipDaysLeft: daysLeft,
    };

    set({ isLoading: false });

    // 4. Send Telegram Bot notification according to VIP status
    if (hasPlan) {
      await get().generateTelegramOtp(cleanId, daysLeft);
    } else {
      // Send Telegram notification explaining NO active VIP plan
      try {
        const noPlanMsg =
          `📌 <b>CODEX(R) — VERIFICACIÓN DE ID</b>\n\n` +
          `Hola <b>${displayName}</b> (${username}), tu ID de Telegram <code>${cleanId}</code> fue verificado.\n\n` +
          `⚠️ <b>Estado:</b> ❌ <b>SIN PLAN VIP ACTIVO</b>\n\n` +
          `Para ingresar al panel de la extensión y recibir tus códigos OTP de acceso, necesitas adquirir una suscripción VIP.\n\n` +
          `Contacta al administrador para activar tu membresía.`;

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: cleanId,
            text: noPlanMsg,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '💬 Contactar Administrador / Adquirir Plan', url: OWNER_CONTACT_LINK }],
              ],
            },
          }),
          signal: AbortSignal.timeout(5000),
        });
      } catch {}
    }

    return { hasPlan, daysLeft, label, user: userData };
  },

  generateTelegramOtp: async (telegramId: string, daysLeft: number) => {
    set({ isLoading: true });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    set({ activeOtp: code });

    const cleanId = telegramId.trim();
    const info = get().telegramUserInfo;
    const name = info?.name || `User ${cleanId}`;

    const otpData: PendingOtp = {
      code,
      telegramId: cleanId,
      createdAt: Date.now(),
      attempts: 0,
    };
    await storageSet(STORAGE_KEYS.PENDING_OTPS, otpData);

    const daysText = daysLeft > 9000 ? 'Ilimitado (OWNER)' : `${daysLeft} días restantes`;

    try {
      const msg =
        `✅ <b>CODEX(R) SYSTEM — ¡ID VERIFICADO!</b>\n\n` +
        `👤 <b>Usuario:</b> ${name}\n` +
        `🌟 <b>Plan VIP:</b> ✅ <b>ACTIVO</b> (${daysText})\n\n` +
        `🔑 <b>Tu código de acceso OTP a la extensión es:</b>\n` +
        `<code>${code}</code>\n\n` +
        `<i>Ingresa este código en el panel de la extensión. Expira en 5 minutos.</i>`;

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cleanId,
          text: msg,
          parse_mode: 'HTML',
        }),
        signal: AbortSignal.timeout(5000),
      });
    } catch (e) {
      console.warn('[CODEX Auth] Error sending OTP:', e);
    }

    set({ isLoading: false });
    return code;
  },

  verifyTelegramOtp: async (telegramId: string, code: string) => {
    set({ isLoading: true, error: null });
    const cleanId = telegramId.trim();
    try {
      const pendingOtp = await storageGet<PendingOtp>(STORAGE_KEYS.PENDING_OTPS);
      const { activeOtp } = get();

      if (pendingOtp && pendingOtp.createdAt) {
        const elapsed = Date.now() - pendingOtp.createdAt;
        if (elapsed > TIMING.OTP_EXPIRY_MS) {
          set({ error: 'El código OTP ha expirado. Solicita uno nuevo.', isLoading: false, activeOtp: '' });
          await storageRemove(STORAGE_KEYS.PENDING_OTPS);
          return false;
        }

        if (pendingOtp.attempts >= TIMING.MAX_OTP_ATTEMPTS) {
          set({ error: 'Demasiados intentos. Solicita un nuevo código OTP.', isLoading: false, activeOtp: '' });
          await storageRemove(STORAGE_KEYS.PENDING_OTPS);
          return false;
        }

        pendingOtp.attempts++;
        await storageSet(STORAGE_KEYS.PENDING_OTPS, pendingOtp);
      }

      if (code.trim() === activeOtp.trim() && activeOtp !== '') {
        const users = (await storageGet<StoredUser[]>(STORAGE_KEYS.USERS)) || [];
        const found = users.find((u) => u.telegramId === cleanId);

        const info = get().telegramUserInfo;
        const displayName = info?.name || found?.name || `User ${cleanId}`;

        const loggedUser: CODEXUser = {
          telegramId: cleanId,
          email: found?.email || `${cleanId}@CODEX.test`,
          name: displayName,
          username: info?.username || found?.username,
          role: found?.role || 'user',
          planExpiry: found?.planExpiry || null,
        };

        await storageSet(STORAGE_KEYS.SESSION, loggedUser);

        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          chrome.storage.local.set({
            [STORAGE_KEYS.TELEGRAM_CHAT_ID]: cleanId,
            [STORAGE_KEYS.TELEGRAM_NOTIFY]: true,
            [STORAGE_KEYS.TELEGRAM_BOT_TOKEN]: TELEGRAM_BOT_TOKEN,
          });
        }

        await storageRemove(STORAGE_KEYS.PENDING_OTPS);
        set({ user: loggedUser, activeOtp: '', isLoading: false });
        return true;
      } else {
        set({ error: 'Código OTP incorrecto. Revisa el mensaje en tu Telegram.', isLoading: false });
        return false;
      }
    } catch {
      set({ error: 'Error al procesar la verificación.', isLoading: false });
      return false;
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    await storageRemove(STORAGE_KEYS.SESSION);
    set({ user: null, isLoading: false });
  },

  saveBotSettings: async (token: string, username: string, apiUrl: string) => {
    try {
      await storageSetMultiple({
        [STORAGE_KEYS.BOT_TOKEN]: token,
        [STORAGE_KEYS.BOT_USERNAME]: username,
        [STORAGE_KEYS.BOT_API_URL]: apiUrl,
      });
      set({ botToken: token, botUsername: username, botApiUrl: apiUrl });
    } catch (e) {
      console.error('[CODEX Auth] Error saving bot settings:', e);
    }
  },

  saveOfficialWebUrl: async (url: string) => {
    try {
      await storageSet(STORAGE_KEYS.OFFICIAL_WEB, url);
      set({ officialWebUrl: url });
    } catch (e) {
      console.error('[CODEX Auth] Error saving official web URL:', e);
    }
  },
}));
