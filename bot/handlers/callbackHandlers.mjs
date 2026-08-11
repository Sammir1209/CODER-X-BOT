import { handleExtension, handleProfile } from './commandHandlers.mjs';
import { apiCall } from '../services/telegramApi.mjs';

export async function handleCallbackQuery(cq) {
  if (!cq || !cq.message) return;

  const chatId = String(cq.message.chat.id);

  // Always acknowledge the callback to remove the loading spinner
  try {
    await apiCall('answerCallbackQuery', { callback_query_id: cq.id });
  } catch (err) {
    console.warn('[BOT] Failed to answer callback query:', err.message);
  }

  // Build a proper msg-like object that handlers expect
  const syntheticMsg = {
    chat: cq.message.chat,
    from: cq.from,
    text: '',
  };

  try {
    if (cq.data === 'check_profile') {
      await handleProfile(syntheticMsg);
    } else if (cq.data === 'get_extension') {
      await handleExtension(syntheticMsg);
    }
  } catch (err) {
    console.error(`[BOT] Callback handler error for "${cq.data}":`, err.message);
  }
}
