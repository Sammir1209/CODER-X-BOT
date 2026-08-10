/**
 * CODER Telegram Bot Server
 * Bot: @CodexrOutBot
 * Token: 8953633941:AAE8E0o00iIlVBnP57_y3Q8UIk5I_-ZwRCw
 *
 * 100% Custom Emojis (<tg-emoji>) & DataWard Premium Aesthetics
 */

const BOT_TOKEN = '8953633941:AAE8E0o00iIlVBnP57_y3Q8UIk5I_-ZwRCw';
const BOT_USERNAME = 'CodexrOutBot';
let lastUpdateId = 0;

async function sendBotMessage(chatId, text, inlineKeyboard = null) {
  try {
    const payload = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    };

    if (inlineKeyboard) {
      payload.reply_markup = { inline_keyboard: inlineKeyboard };
    } else {
      payload.reply_markup = {
        inline_keyboard: [
          [
            { text: "👤 Perfil ↗", url: `https://t.me/${BOT_USERNAME}` },
            { text: "🔑 Verificar ↗", url: `https://t.me/${BOT_USERNAME}` }
          ]
        ]
      };
    }

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data.ok;
  } catch (err) {
    console.error('[CODER BOT SERVER] Error sending message:', err);
    return false;
  }
}

/**
 * Handles /emoji_custom [link_or_name] command
 */
async function handleEmojiCustomCommand(chatId, inputParam) {
  let setName = (inputParam || '').trim();
  if (!setName) {
    const usageMsg = 
`<b><tg-emoji emoji-id="5357199488115030155">⚠️</tg-emoji> USO DEL COMANDO /emoji_custom</b>
━━━━━━━━━━━━━━━━━━━━━━━

Ingresa la URL o el nombre del paquete de emojis:

Ejemplo:
<code>/emoji_custom https://t.me/addemoji/MovieIcons</code>
o simplemente:
<code>/emoji_custom MovieIcons</code>`;
    await sendBotMessage(chatId, usageMsg);
    return;
  }

  // Extract set name from link if link is provided
  if (setName.includes('/addemoji/')) {
    setName = setName.split('/addemoji/')[1].split('/')[0].split('?')[0].trim();
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getStickerSet?name=${encodeURIComponent(setName)}`);
    const data = await res.json();

    if (!data.ok || !data.result || !Array.isArray(data.result.stickers)) {
      const errorMsg = 
`<b><tg-emoji emoji-id="5357199488115030155">⚠️</tg-emoji> PAQUETE NO ENCONTRADO</b>
━━━━━━━━━━━━━━━━━━━━━━━

No se pudo obtener la información del paquete <code>${setName}</code>.

Asegúrate de enviar un enlace válido:
<code>https://t.me/addemoji/MovieIcons</code>`;
      await sendBotMessage(chatId, errorMsg);
      return;
    }

    const packTitle = data.result.title || setName;
    const stickers = data.result.stickers;

    let itemsText = '';
    let count = 0;

    for (let i = 0; i < stickers.length; i++) {
      const sticker = stickers[i];
      const customEmojiId = sticker.custom_emoji_id || sticker.file_id;
      const emojiChar = sticker.emoji || '✨';

      count++;
      itemsText += `<tg-emoji emoji-id="${customEmojiId}">${emojiChar}</tg-emoji> <b>ID:</b> <code>${customEmojiId}</code>\n\n`;

      if (itemsText.length > 2500 || i === stickers.length - 1) {
        const header = `<b><tg-emoji emoji-id="5364265456641258077">✨</tg-emoji> CUSTOM EMOJI PACK: ${packTitle} (${count}/${stickers.length})</b>\n━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        const footer = `━━━━━━━━━━━━━━━━━━━━━━━\n<i>Toca cualquier ID para copiarlo instantáneamente.</i>`;
        await sendBotMessage(chatId, header + itemsText + footer);
        itemsText = '';
      }
    }

  } catch (err) {
    console.error('[CODER BOT] Error fetching emoji set:', err);
    await sendBotMessage(chatId, `<b><tg-emoji emoji-id="5357199488115030155">⚠️</tg-emoji> Error consultando paquete Telegram:</b> <code>${err.message}</code>`);
  }
}

async function processUpdate(update) {
  if (!update.message) return;

  const chatId = update.message.chat.id;
  const telegramId = String(update.message.from.id);
  const username = update.message.from.username ? `@${update.message.from.username}` : '@Usuario';
  const firstName = update.message.from.first_name || 'Coder Member';
  const text = (update.message.text || '').trim();

  // === /emoji_custom command ===
  if (text.startsWith('/emoji_custom')) {
    const param = text.replace('/emoji_custom', '').trim();
    await handleEmojiCustomCommand(chatId, param);
    return;
  }

  // === CUSTOM EMOJI DETECTOR / EXTRACTOR FOR SENT STICKERS ===
  if (Array.isArray(update.message.entities)) {
    const customEmojiEntities = update.message.entities.filter((e) => e.type === 'custom_emoji');
    if (customEmojiEntities.length > 0) {
      const extractedList = customEmojiEntities
        .map((e) => {
          const char = text.substring(e.offset, e.offset + e.length) || '✨';
          return `<tg-emoji emoji-id="${e.custom_emoji_id}">${char}</tg-emoji> ID: <code>${e.custom_emoji_id}</code>`;
        })
        .join('\n\n');

      const replyExtractor = 
`<b><tg-emoji emoji-id="5364265456641258077">✨</tg-emoji> CUSTOM EMOJI ID(S) DETECTADOS!</b>
━━━━━━━━━━━━━━━━━━━━━━━

${extractedList}

━━━━━━━━━━━━━━━━━━━━━━━
<i>Copia estos IDs para configurarlos en tus plantillas oficiales.</i>`;

      await sendBotMessage(chatId, replyExtractor);
      return;
    }
  }

  if (text.startsWith('/start') || text.startsWith('/register')) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const reply = 
`<b><tg-emoji emoji-id="5364265456641258077">⭐️</tg-emoji> 𝑪𝑶𝑫𝑬𝑹ギ — CENTRO DE VERIFICACIÓN</b>
━━━━━━━━━━━━━━━━━━━━━━━

<tg-emoji emoji-id="5411580731929411768">👤</tg-emoji> <b>Usuario:</b> <code>${firstName}</code>
<tg-emoji emoji-id="5361610161829985952">🆔</tg-emoji> <b>Telegram ID:</b> <code>${telegramId}</code>
<tg-emoji emoji-id="5359397703916730925">🦸‍♂️</tg-emoji> <b>Username:</b> ${username}
<tg-emoji emoji-id="5363857743985784309">🔑</tg-emoji> <b>CÓDIGO OTP:</b> <code>${otp}</code>

━━━━━━━━━━━━━━━━━━━━━━━

[↯] Introduce el código OTP en la extensión <b>CODER</b> para vincular tu sesión.

<tg-emoji emoji-id="5357199488115030155">💀</tg-emoji> <i>Este código de verificación es temporal y confidencial.</i>

━━━━━━━━━━━━━━━━━━━━━━━
        『 𝑪𝑶𝑫𝑬做 𝑨𝑼𝑻𝑯 』`;

    await sendBotMessage(chatId, reply);

  } else if (text.startsWith('/me') || text.startsWith('/perfil')) {
    const reply = 
`<b><tg-emoji emoji-id="5359536263856667601">🦇</tg-emoji> 𝑪𝑶𝑫𝑬𝑹ギ — PERFIL DE USUARIO</b>
━━━━━━━━━━━━━━━━━━━━━━━

<tg-emoji emoji-id="5411580731929411768">👤</tg-emoji> <b>Nombre:</b> <code>${firstName}</code>
<tg-emoji emoji-id="5361610161829985952">🆔</tg-emoji> <b>Telegram ID:</b> <code>${telegramId}</code>
<tg-emoji emoji-id="5359397703916730925">🦸‍♂️</tg-emoji> <b>Username:</b> ${username}
<tg-emoji emoji-id="5411457217259911292">🦸‍♀️</tg-emoji> <b>Membresía:</b> <code>〔 VIP USER 〕</code>
<tg-emoji emoji-id="5364114797778451311">🔗</tg-emoji> <b>Link Perfil:</b> <a href="https://t.me/${BOT_USERNAME}">Presiona aquí</a>

━━━━━━━━━━━━━━━━━━━━━━━
<tg-emoji emoji-id="5364265456641258077">⭐️</tg-emoji> <b>Estado:</b> <code>● ACTIVO</code>
<tg-emoji emoji-id="5359394246468057650">🤖</tg-emoji> <b>Expiración:</b> <code>VIP ILIMITADO</code>
<tg-emoji emoji-id="5363857743985784309">💳</tg-emoji> <b>Créditos:</b> <code>9999 pts</code>
<tg-emoji emoji-id="5357199488115030155">💀</tg-emoji> <b>Sanciones:</b> <code>Sin Ban</code>

━━━━━━━━━━━━━━━━━━━━━━━
        『 𝑪𝑶𝑫𝑬𝑹 𝑺𝒀𝑺𝑻𝑬𝑴 』`;

    await sendBotMessage(chatId, reply);

  } else if (text.startsWith('/help') || text.startsWith('/ayuda')) {
    const reply = 
`<b><tg-emoji emoji-id="5359394246468057650">🤖</tg-emoji> 𝑪𝑶𝑫𝑬𝑹ギ — COMANDOS DEL SISTEMA</b>
━━━━━━━━━━━━━━━━━━━━━━━

<tg-emoji emoji-id="5411580731929411768">👤</tg-emoji> <b>/me</b>
    └─ Ver estado de perfil y suscripción VIP

<tg-emoji emoji-id="5363857743985784309">🔑</tg-emoji> <b>/register</b>
    └─ Generar código OTP de vincular extensión

<tg-emoji emoji-id="5364265456641258077">⭐️</tg-emoji> <b>/emoji_custom [link]</b>
    └─ Extraer IDs de cualquier paquete de emojis

<tg-emoji emoji-id="5359394246468057650">🤖</tg-emoji> <b>/ayuda</b>
    └─ Ver lista completa de comandos del bot

━━━━━━━━━━━━━━━━━━━━━━━
<tg-emoji emoji-id="5364265456641258077">⭐️</tg-emoji> <b>Estado:</b> <code>ONLINE</code>
<tg-emoji emoji-id="5359536263856667601">⚡</tg-emoji> <b>Versión:</b> <code>v1.0.1</code>
<tg-emoji emoji-id="5359394246468057650">🤖</tg-emoji> <b>Motor:</b> <code>Stripe Interceptor</code>

━━━━━━━━━━━━━━━━━━━━━━━
      『 𝑻𝑬𝑨𝑴 𝑵𝑬𝑿𝑼𝑺 』`;

    await sendBotMessage(chatId, reply);
  }
}

async function startPolling() {
  console.log(`🤖 Servidor de Telegram Bot CODER 100% Custom Emojis activo (@${BOT_USERNAME})...`);

  while (true) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=10`);
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          lastUpdateId = update.update_id;
          await processUpdate(update);
        }
      }
    } catch (e) {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

startPolling();
