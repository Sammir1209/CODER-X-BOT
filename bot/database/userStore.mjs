import { existsSync, readFileSync, writeFileSync } from 'fs';
import { OWNER_IDS, USERS_DB_PATH } from '../config/constants.mjs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ypqthyglthytkwcikczz.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwcXRoeWdsdGh5dGt3Y2lrY3p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzMTQwMzksImV4cCI6MjEwMTg5MDAzOX0.6V5xYGmzwJ_YJYAxFiYORewn5t3cggtS-dzSyFBlwuw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function isOwner(telegramId) {
  return OWNER_IDS.includes(String(telegramId));
}

export function loadUsersDb() {
  if (!existsSync(USERS_DB_PATH)) {
    return [
      {
        telegramId: '7794982496',
        name: 'Sammir Contreras',
        username: '@S_14xx',
        role: 'owner',
        planExpiry: null,
        createdAt: Date.now(),
      },
      {
        telegramId: '7317734631',
        name: 'Mr Codex',
        username: '@mrcodexofc',
        role: 'owner',
        planExpiry: null,
        createdAt: Date.now(),
      },
    ];
  }
  try {
    return JSON.parse(readFileSync(USERS_DB_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

export function saveUsersDb(users) {
  try {
    writeFileSync(USERS_DB_PATH, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('[BOT] Error saving local users database:', err.message);
  }
}

export async function syncUserToSupabase(user) {
  try {
    const { error } = await supabase
      .from('codex_users')
      .upsert({
        telegram_id: user.telegramId,
        name: user.name,
        username: user.username || null,
        role: user.role,
        plan_expiry: user.planExpiry ? Number(user.planExpiry) : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'telegram_id' });

    if (error) {
      console.warn('[BOT] Supabase sync notice:', error.message);
    } else {
      console.log(`[BOT] Supabase sync ok for user ${user.telegramId}`);
    }
  } catch (err) {
    console.error('[BOT] Error syncing to Supabase:', err.message);
  }
}

export function getOrRegisterUser(telegramId, { name, username }) {
  const users = loadUsersDb();
  let user = users.find(u => u.telegramId === telegramId);
  const now = Date.now();

  const formattedUsername = username ? (username.startsWith('@') ? username : `@${username}`) : '';

  if (!user && formattedUsername) {
    const cleanHandle = formattedUsername.toLowerCase();
    user = users.find(u => u.username && u.username.toLowerCase() === cleanHandle);
    if (user) {
      console.log(`[BOT] Binding numerical Telegram ID ${telegramId} to existing username record ${user.username}`);
      user.telegramId = telegramId;
      if (name) user.name = name;
    }
  }

  if (!user) {
    const role = isOwner(telegramId) ? 'owner' : 'user';
    user = {
      telegramId,
      name: name || 'Operador',
      username: formattedUsername,
      role,
      planExpiry: null,
      createdAt: now,
    };
    users.push(user);
    saveUsersDb(users);
    syncUserToSupabase(user).catch(() => {});
  } else {
    let updated = false;
    if (name && user.name !== name) {
      user.name = name;
      updated = true;
    }
    if (formattedUsername && user.username !== formattedUsername) {
      user.username = formattedUsername;
      updated = true;
    }
    if (isOwner(telegramId) && user.role !== 'owner') {
      user.role = 'owner';
      updated = true;
    }
    if (updated) {
      saveUsersDb(users);
      syncUserToSupabase(user).catch(() => {});
    }
  }
  return user;
}

export function getVipStatus(user) {
  if (isOwner(user.telegramId) || user.role === 'owner') {
    return { hasPlan: true, isOwner: true, label: 'VIP OWNER (Ilimitado)' };
  }
  if (!user.planExpiry) {
    return { hasPlan: false, isOwner: false, label: 'Sin Plan Activo' };
  }
  const now = Date.now();
  if (user.planExpiry > now) {
    const expDate = new Date(user.planExpiry).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return { hasPlan: true, isOwner: false, label: `VIP (Expira: ${expDate})` };
  }
  return { hasPlan: false, isOwner: false, label: 'Plan Expirado' };
}
