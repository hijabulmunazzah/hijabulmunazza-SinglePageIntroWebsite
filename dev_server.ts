/**
 * Hijab ul Munnazah — Unified Local Full-Stack Development Server
 * Runs both the Frontend Website / Admin Portal AND the Backend Growth Engine API.
 * 
 * Ports:
 *  - Port 3000: Frontend Website (http://localhost:3000/) & Admin Portal (http://localhost:3000/admin/)
 *  - Port 8787: Backend Cloudflare Worker API (http://127.0.0.1:8787/)
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import worker from './engine/src/index.ts';

const PORT_WEB = process.env.PORT || 3000;
const PORT_API = process.env.API_PORT || 8787;
const PUBLIC_DIR = path.resolve(__dirname);

// Load .dev.vars if present
const envVars: any = {
  ENVIRONMENT: 'development',
  ALERT_SENDER_EMAIL: 'alerts@hijabulmunazzah.com',
  OWNER_ALERT_EMAIL: 'owner@hijabulmunazzah.com',
};

try {
  const envPath = path.join(PUBLIC_DIR, '.dev.vars');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [k, ...v] = trimmed.split('=');
        envVars[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  }
} catch (e) {
  console.warn('Notice: Could not load .dev.vars, running with default dev env.');
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

/**
 * Bridges Node.js IncomingMessage to standard Web Request, calls worker.fetch, and writes Web Response back
 */
async function dispatchToWorker(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  baseUrl: string
) {
  try {
    const url = new URL(req.url || '/', baseUrl);
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = ['GET', 'HEAD'].includes(req.method || '') ? undefined : Buffer.concat(chunks);

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        if (Array.isArray(value)) {
          value.forEach(v => headers.append(key, v));
        } else {
          headers.set(key, value);
        }
      }
    }

    const webReq = new Request(url.toString(), {
      method: req.method,
      headers,
      body,
    });

    const webRes = await worker.fetch(webReq, envVars);

    res.statusCode = webRes.status;
    webRes.headers.forEach((val, key) => {
      res.setHeader(key, val);
    });

    if (webRes.body) {
      const reader = webRes.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (err: any) {
    console.error('Worker bridge error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal Server Error', message: err.message }));
  }
}

// ============================================================================
// 1. BACKEND API SERVER (Port 8787)
// ============================================================================
const apiServer = http.createServer((req, res) => {
  dispatchToWorker(req, res, `http://127.0.0.1:${PORT_API}`);
});

apiServer.listen(PORT_API, () => {
  console.log(`\n================================================================`);
  console.log(`⚡ BACKEND GROWTH ENGINE API RUNNING:`);
  console.log(`   URL: http://127.0.0.1:${PORT_API}/`);
  console.log(`   Health: http://127.0.0.1:${PORT_API}/health`);
  console.log(`================================================================`);
});

// ============================================================================
// 2. FRONTEND WEBSITE & ADMIN SERVER (Port 3000)
// ============================================================================
const webServer = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url?.split('?')[0] || '/');

  // Route API and Webhook requests directly to backend engine
  if (reqPath.startsWith('/api/') || reqPath.startsWith('/webhooks/')) {
    dispatchToWorker(req, res, `http://127.0.0.1:${PORT_WEB}`);
    return;
  }

  // Handle directory root routing
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  } else if (reqPath === '/admin' || reqPath === '/admin/') {
    reqPath = '/admin/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, reqPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found - Hijab ul Munnazah');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
    });

    const stream = fs.createReadStream(filePath);
    stream.on('error', () => {
      if (!res.headersSent) res.writeHead(500);
      res.end('Server error');
    });
    stream.pipe(res);
  });
});

webServer.listen(PORT_WEB, () => {
  console.log(`\n🌸 FRONTEND WEBSITE & ADMIN RUNNING:`);
  console.log(`   Website Home:  http://localhost:${PORT_WEB}/`);
  console.log(`   Collection:    http://localhost:${PORT_WEB}/collection.html`);
  console.log(`   Admin Portal:  http://localhost:${PORT_WEB}/admin/`);
  console.log(`================================================================\n`);
  console.log(`Press Ctrl+C to stop both servers.\n`);
});
