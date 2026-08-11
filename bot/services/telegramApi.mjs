import { API_BASE } from '../config/constants.mjs';
import { readFileSync, createReadStream } from 'fs';
import FormData from 'form-data';

// ─── Core API Call with Retry Logic ──────────────────────────────────────────
export async function apiCall(method, params = {}, retries = 2) {
  const url = `${API_BASE}/${method}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();

      // Rate limiting — wait and retry
      if (data.error_code === 429 && attempt < retries) {
        const waitSec = data.parameters?.retry_after || 3;
        console.warn(`[API] Rate limited on ${method}. Waiting ${waitSec}s (attempt ${attempt + 1}/${retries})...`);
        await new Promise(r => setTimeout(r, waitSec * 1000));
        continue;
      }

      return data;
    } catch (err) {
      if (attempt < retries) {
        console.warn(`[API] ${method} failed (attempt ${attempt + 1}/${retries}): ${err.message}. Retrying...`);
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      console.error(`[API] ${method} failed after ${retries + 1} attempts: ${err.message}`);
      return { ok: false, error_code: 0, description: err.message };
    }
  }

  return { ok: false, error_code: 0, description: 'Unknown error' };
}

// ─── Send Message with Error Logging ─────────────────────────────────────────
export async function sendMessage(chatId, text, extra = {}) {
  if (!chatId || !text) {
    console.warn('[API] sendMessage called with missing chatId or text');
    return { ok: false, description: 'Missing chatId or text' };
  }

  // Telegram has a 4096 character limit for messages
  const truncatedText = text.length > 4000 ? text.slice(0, 3997) + '...' : text;

  const result = await apiCall('sendMessage', {
    chat_id: chatId,
    text: truncatedText,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...extra,
  });

  if (!result.ok && result.error_code) {
    console.warn(`[API] sendMessage to ${chatId} failed: [${result.error_code}] ${result.description}`);

    // If HTML parsing fails, retry without parse_mode as plaintext fallback
    if (result.error_code === 400 && result.description?.includes("can't parse entities")) {
      console.warn('[API] HTML parse error — retrying as plain text...');
      const plainResult = await apiCall('sendMessage', {
        chat_id: chatId,
        text: truncatedText.replace(/<[^>]*>/g, ''),
        disable_web_page_preview: true,
        ...extra,
      });
      return plainResult;
    }
  }

  return result;
}

// ─── Send Document (ZIP file) ────────────────────────────────────────────────
export async function sendDocument(chatId, filePath, caption = '', extra = {}) {
  // Truncate caption to 1024 chars (Telegram limit for document captions)
  const truncatedCaption = caption.length > 1000 ? caption.slice(0, 997) + '...' : caption;

  // Try native FormData first (Node 18+)
  try {
    const fileBuffer = readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: 'application/zip' });
    const formData = new globalThis.FormData();
    formData.append('chat_id', String(chatId));
    formData.append('caption', truncatedCaption);
    formData.append('parse_mode', 'HTML');
    formData.append('document', blob, 'CODEX_R_Extension.zip');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const res = await fetch(`${API_BASE}/sendDocument`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json();
    if (data.ok) return data;

    console.warn('[API] Native sendDocument failed:', data.description);
  } catch (e) {
    console.warn('[API] Native FormData upload failed:', e.message);
  }

  // Fallback to npm form-data stream
  try {
    const form = new FormData();
    form.append('chat_id', String(chatId));
    form.append('caption', truncatedCaption);
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
  } catch (e) {
    console.error('[API] Stream sendDocument also failed:', e.message);
    return { ok: false, description: e.message };
  }
}
