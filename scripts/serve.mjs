import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { extname, resolve, sep } from 'node:path';

const root = process.cwd();
const port = Number(process.env.PORT || 8000);
const mime = {
  '.jpg': 'image/jpeg',
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};

createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if(request.method==='POST' && pathname.startsWith('/editor/')) return editCourse(request,response,port);
  if (request.method === 'POST' && pathname === '/featured-photo') {
    const host = request.headers.host;
    if (!['127.0.0.1:' + port, 'localhost:' + port].includes(host) ||
        request.headers.origin !== 'http://' + host || request.headers['content-type'] !== 'image/jpeg') {
      response.writeHead(403).end();
      return;
    }
    try {
      const chunks = [];
      let size = 0;
      for await (const chunk of request) {
        size += chunk.length;
        if (size > 8 * 1024 * 1024) { response.writeHead(413).end(); return; }
        chunks.push(chunk);
      }
      const photo = Buffer.concat(chunks);
      if (photo.readUInt16BE(0) !== 0xffd8 || photo.readUInt16BE(size - 2) !== 0xffd9) {
        response.writeHead(400).end(); return;
      }
      const id = randomUUID();
      const src = 'assets/images/featured/' + id + '.jpg';
      const fields = new URL(request.url, 'http://localhost').searchParams;
      const record = {src, uploadedAt: new Date().toISOString()};
      for (const key of ['caption','camera','lens']) record[key] = (fields.get(key) || '').trim().slice(0,160);
      await mkdir(resolve(root,'assets/images/featured'), {recursive:true});
      await writeFile(resolve(root,src), photo);
      const tmp = resolve(root,'content',id + '.tmp');
      await writeFile(tmp, JSON.stringify(record,null,2)+'\n');
      await rename(tmp, resolve(root,'content/featured-photo.json'));
      response.writeHead(201,{'Content-Type':'application/json'}).end(JSON.stringify(record));
    } catch { response.writeHead(400).end('無法保存照片'); }
    return;
  }
  const relativePath = pathname === '/' ? 'index.html' : decodeURIComponent(pathname.slice(1));
  const filePath = resolve(root, relativePath);

  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try {
    const data = await readFile(filePath);
    response.writeHead(200, { 'Content-Type': mime[extname(filePath)] || 'application/octet-stream' });
    response.end(data);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Light & Frame: http://127.0.0.1:${port}/`);
});

import { editCourse } from './course-editor.mjs';
