'use strict';

/**
 * Điểm khởi động máy chủ DOP Mart.
 *   node server.js            # mặc định http://localhost:3000
 *   PORT=8080 node server.js
 */

const http = require('node:http');

const { handleRequest } = require('./src/app');
const db = require('./src/db');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

db.load();

const server = http.createServer((req, res) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    if (process.env.NODE_ENV !== 'test') {
      const path = (req.url || '/').split('?')[0];
      const duration = Date.now() - startedAt;
      console.log(`${req.method} ${path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  handleRequest(req, res).catch((error) => {
    console.error('[dopmart] Lỗi không xử lý được:', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    }
    res.end(JSON.stringify({ error: 'Đã xảy ra lỗi phía máy chủ' }));
  });
});

server.listen(PORT, HOST, () => {
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : PORT;
  console.log(`🛒 DOP Mart đang chạy tại http://localhost:${port}`);
});

function shutdown(signal) {
  console.log(`\n[dopmart] Nhận tín hiệu ${signal}, đang dừng máy chủ...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = server;
