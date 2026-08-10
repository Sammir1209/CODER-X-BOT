import { handleExtension, handleProfile } from './commandHandlers.mjs';
import { apiCall } from '../services/telegramApi.mjs';

export async function handleCallbackQuery(cq) {
  const chatId = String(cq.message.chat.id);
  const data = cq.data;

  await apiCall('answerCallbackQuery', { callback_query_id: cq.id });

  if (data === 'check_profile') {
    await handleProfile({ chat: { id: chatId }, from: cq.from });
  } else if (data === 'get_extension') {
    await handleExtension({ chat: { id: chatId }, from: cq.from });
  }
}
