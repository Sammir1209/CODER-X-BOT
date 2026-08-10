/**
 * CODEX(R) — Vercel Serverless Webhook Endpoint for Telegram Bot
 *
 * Hosted on Vercel: https://<your-vercel-app>.vercel.app/api/webhook
 * Receives instant POST requests from Telegram whenever users send commands.
 */

import { processUpdate } from '../bot/index.mjs';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'online',
      message: 'CODEX(R) Webhook endpoint is active.',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const update = req.body;
    if (update) {
      await processUpdate(update);
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[WEBHOOK ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
}
