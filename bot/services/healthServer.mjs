import http from 'http';
import { PORT } from '../config/constants.mjs';
import { loadUsersDb } from '../database/userStore.mjs';

let server = null;

export function startHealthServer() {
  if (server) return server;

  server = http.createServer((req, res) => {
    try {
      if (req.url === '/' || req.url === '/health' || req.url === '/ping') {
        const usersCount = loadUsersDb().length;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'online',
          service: 'CODEX® Bot & VIP Server',
          uptime: Math.floor(process.uptime()),
          users: usersCount,
          memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
          timestamp: new Date().toISOString(),
        }));
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    } catch (err) {
      console.error('[HEALTH] Error handling request:', err.message);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  });

  server.on('error', (err) => {
    console.error('[HEALTH] Server error:', err.message);
  });

  server.listen(PORT, () => {
    console.log(`   Health Check HTTP Server escuchando en puerto: ${PORT}`);
  });

  return server;
}

export function stopHealthServer() {
  if (server) {
    server.close();
    server = null;
  }
}
