'use strict';
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const root = __dirname;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png' };
const json = (res, code, data) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data)); };
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/bookings' && req.method === 'POST') {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body) > 16384) return json(res, 413, { error: 'Слишком большой запрос' });
      }
      let data;
      try { data = JSON.parse(body); } catch { return json(res, 400, { error: 'Некорректный JSON' }); }
      if (!data || typeof data.name !== 'string' || !data.name.trim() || data.name.length > 80 ||
          typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || data.email.length > 120 ||
          !Number.isInteger(data.guests) || data.guests < 1 || data.guests > 6 ||
          !['Бразилия', 'Эфиопия', 'Оба сорта'].includes(data.coffee) || data.consent !== true ||
          typeof data.comment !== 'string' || data.comment.length > 1000) return json(res, 400, { error: 'Проверьте поля заявки' });
      const id = randomUUID();
      // Учебный приём заявки: данные не записываются на диск.
      console.log(`Принята заявка ${id}`);
      return json(res, 201, { id });
    }
    if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { error: 'Метод не поддерживается' });
    const target = path.resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    const relative = path.relative(root, target);
    if (relative.startsWith('..') || path.isAbsolute(relative) || !types[path.extname(target)] || relative === 'server.js') return json(res, 404, { error: 'Страница не найдена' });
    const content = await fs.readFile(target);
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch (error) {
    json(res, error.code === 'ENOENT' ? 404 : 500, { error: 'Не удалось обработать запрос' });
  }
}).listen(Number(process.env.PORT) || 3000, '127.0.0.1', () => console.log('Coffee Compass: http://127.0.0.1:3000'));
