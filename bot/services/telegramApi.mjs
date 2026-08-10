import { API_BASE } from '../config/constants.mjs';
import { readFileSync, createReadStream } from 'fs';
import FormData from 'form-data';

export async function apiCall(method, params = {}) {
  const url = `${API_BASE}/${method}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
}

export async function sendMessage(chatId, text, extra = {}) {
  return apiCall('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    ...extra,
  });
}

export async function sendDocument(chatId, filePath, caption = '', extra = {}) {
  try {
    const fileBuffer = readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: 'application/zip' });
    const formData = new globalThis.FormData();
    formData.append('chat_id', String(chatId));
    formData.append('caption', caption);
    formData.append('parse_mode', 'HTML');
    formData.append('document', blob, 'CODEX_R_Extension.zip');

    const res = await fetch(`${API_BASE}/sendDocument`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (data.ok) return data;
  } catch (e) {
    console.warn('[BOT] Native FormData upload failed, retrying stream upload:', e.message);
  }

  // Fallback to npm form-data stream
  const form = new FormData();
  form.append('chat_id', String(chatId));
  form.append('caption', caption);
  form.append('parse_mode', 'HTML');
  form.append('document', createReadStream(filePath), {
    filename: 'CODEX_R_Extension.zip',
    contentType: 'application/zip',
  });

  const res = await fetch(`${API_BASE}/sendDocument`, {
    method: 'POST',
    headers: form.getHeaders(),
    body: form,
  });
  return res.json();
}
