// speedtest-map-api — stores shared Speedtest CSV exports in R2.
//
//   POST   /api/share        body: CSV text (≤ 500 KB), header X-File-Name (optional, URI-encoded)
//                            -> { id, deleteToken, expires }
//   GET    /api/share/:id    -> the CSV, with X-Share-Name / -Created / -Rows / -Expires; 410 once expired
//   DELETE /api/share/:id    header X-Delete-Token -> 204
//   GET    /api/health       -> { ok: true }
//
// Shares live for 24 hours. Expired objects are deleted when someone opens them, by an hourly cron
// (scheduled() below) and, as a backstop, by an R2 lifecycle rule (see the deploy workflow).
// Before storing a new share the bucket is kept under R2_LIMIT_BYTES (the free tier, with margin):
// the oldest shares are deleted until the new one fits.

const MAX_BYTES = 500 * 1024;
const DEFAULT_TTL_S = 24 * 60 * 60;
const PREFIX = 'shares/';
const DEFAULT_LIMIT = 9.5 * 1024 ** 3;     // R2 free tier is 10 GB-month; keep a margin
const ID_ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ID_RE = /^[A-Za-z0-9]{6,32}$/;
// Columns that identify the uploader's network; never stored, even if the client forgot to drop them.
const PRIVATE_COLUMNS = ['external ip', 'internal ip'];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-File-Name, X-Delete-Token',
  'Access-Control-Expose-Headers': 'X-Share-Name, X-Share-Created, X-Share-Rows, X-Share-Expires',
  'Access-Control-Max-Age': '86400',
};

const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS, ...extra },
  });

const key = (id) => `${PREFIX}${id}.csv`;
const createdAt = (obj) => Date.parse(obj.customMetadata?.created || '') || obj.uploaded.getTime();
const ttlMs = (env) => (Number(env.SHARE_TTL_SECONDS) || DEFAULT_TTL_S) * 1000;
const expired = (env, obj, now = Date.now()) => now - createdAt(obj) > ttlMs(env);

async function listShares(env) {
  const out = [];
  let cursor;
  do {
    const page = await env.BUCKET.list({ prefix: PREFIX, cursor, limit: 1000, include: ['customMetadata'] });
    out.push(...page.objects);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return out;
}
async function deleteKeys(env, keys) {
  for (let i = 0; i < keys.length; i += 1000) await env.BUCKET.delete(keys.slice(i, i + 1000));
}

/* Drop expired shares; then, if the bucket plus the incoming upload would pass the limit, drop the
   oldest shares until it fits. Returns how many objects were deleted. */
async function housekeep(env, incoming = 0) {
  const limit = Number(env.R2_LIMIT_BYTES) || DEFAULT_LIMIT;
  const now = Date.now();
  const all = await listShares(env);
  const stale = all.filter((o) => expired(env, o, now));
  const live = all.filter((o) => !expired(env, o, now)).sort((a, b) => createdAt(a) - createdAt(b));
  let total = live.reduce((n, o) => n + o.size, 0);
  const evict = [];
  while (live.length && total + incoming > limit) { const o = live.shift(); total -= o.size; evict.push(o); }
  const keys = [...stale, ...evict].map((o) => o.key);
  if (keys.length) await deleteKeys(env, keys);
  return keys.length;
}

function randomId(len = 10) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let s = '';
  for (const b of bytes) s += ID_ALPHABET[b % ID_ALPHABET.length];
  return s;
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Minimal RFC 4180 line splitter — enough to drop columns without disturbing quoted fields.
function splitLine(line) {
  const out = [];
  let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}
const joinLine = (cells) => cells.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(',');

function sanitize(csv) {
  const lines = csv.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) return null;
  const header = splitLine(lines[0]).map((h) => h.trim());
  const lower = header.map((h) => h.toLowerCase());
  const need = ['latitude', 'longitude'];
  if (!need.every((n) => lower.includes(n)) || !lower.some((h) => h.startsWith('download speed'))) return null;
  const keep = lower.map((h, i) => (PRIVATE_COLUMNS.includes(h) ? -1 : i)).filter((i) => i >= 0);
  const rows = lines.map((l) => { const c = splitLine(l); return joinLine(keep.map((i) => c[i] ?? '')); });
  return { text: rows.join('\n') + '\n', rows: lines.length - 1 };
}

async function create(req, env) {
  const len = Number(req.headers.get('Content-Length') || 0);
  if (len > MAX_BYTES) return json({ error: 'too large', limit: MAX_BYTES }, 413);
  const raw = await req.text();
  if (new TextEncoder().encode(raw).length > MAX_BYTES) return json({ error: 'too large', limit: MAX_BYTES }, 413);
  const clean = sanitize(raw);
  if (!clean) return json({ error: '这不像是 Speedtest 导出的 CSV' }, 400);

  let name = 'Speedtest 测速记录';
  try { name = decodeURIComponent(req.headers.get('X-File-Name') || '') || name; } catch {}
  name = name.replace(/\.csv$/i, '').slice(0, 120);

  let id = randomId();
  for (let i = 0; i < 3 && (await env.BUCKET.head(key(id))); i++) id = randomId(12);

  const deleteToken = randomId(24);
  await housekeep(env, new TextEncoder().encode(clean.text).length);
  const created = new Date();
  await env.BUCKET.put(key(id), clean.text, {
    httpMetadata: { contentType: 'text/csv; charset=utf-8' },
    customMetadata: {
      name,
      rows: String(clean.rows),
      created: created.toISOString(),
      deleteHash: await sha256(deleteToken),
    },
  });
  return json({ id, deleteToken, rows: clean.rows, expires: new Date(created.getTime() + ttlMs(env)).toISOString() }, 201);
}

async function read(id, env) {
  const obj = await env.BUCKET.get(key(id));
  if (!obj) return json({ error: 'not found' }, 404);
  if (expired(env, obj)) {
    await env.BUCKET.delete(obj.key);
    return json({ error: 'expired' }, 410);
  }
  const m = obj.customMetadata || {};
  const expires = new Date(createdAt(obj) + ttlMs(env));
  return new Response(obj.body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Cache-Control': `public, max-age=${Math.max(0, Math.min(300, Math.floor((expires - Date.now()) / 1000)))}`,
      'X-Share-Expires': expires.toISOString(),
      'X-Share-Name': encodeURIComponent(m.name || ''),
      'X-Share-Created': m.created || '',
      'X-Share-Rows': m.rows || '',
      ETag: obj.httpEtag,
      ...CORS,
    },
  });
}

async function remove(id, req, env) {
  const token = req.headers.get('X-Delete-Token') || '';
  const head = await env.BUCKET.head(key(id));
  if (!head) return json({ error: 'not found' }, 404);
  if (!token || (await sha256(token)) !== head.customMetadata?.deleteHash) return json({ error: 'forbidden' }, 403);
  await env.BUCKET.delete(key(id));
  return new Response(null, { status: 204, headers: CORS });
}

export default {
  // hourly cron (worker/wrangler.toml): delete expired shares and keep the bucket under its limit
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(housekeep(env));
  },

  async fetch(req, env) {
    const { pathname } = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    try {
      if (pathname === '/api/health') return json({ ok: true });
      if (pathname === '/api/share' && req.method === 'POST') return await create(req, env);
      const m = pathname.match(/^\/api\/share\/([^/]+)$/);
      if (m) {
        if (!ID_RE.test(m[1])) return json({ error: 'bad id' }, 400);
        if (req.method === 'GET' || req.method === 'HEAD') return await read(m[1], env);
        if (req.method === 'DELETE') return await remove(m[1], req, env);
        return json({ error: 'method not allowed' }, 405);
      }
      return json({ error: 'not found' }, 404);
    } catch (err) {
      return json({ error: 'server error', detail: String(err?.message || err) }, 500);
    }
  },
};
