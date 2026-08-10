import http from 'http';
import { PORT } from '../config/constants.mjs';

export function startHealthServer() {
  const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/health' || req.url === '/ping') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'online',
        service: 'CODEX(R) Bot & VIP Server',
        timestamp: new Date().toISOString(),
      }));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  server.listen(PORT, () => {
    console.log(`   Health Check HTTP Server escuchando en puerto: ${PORT}`);
  });

  return server;
}
