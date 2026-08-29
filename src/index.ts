const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};
const SESSION_SECONDS = 60 * 60 * 8;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

type ProductRow = {
  id: number; name: string; color: string | null; category: string | null;
  description: string | null; price_kobo: number; image_url: string | null;
  image_key: string | null; sizes_json: string; stock_quantity: number;
  is_active: number; created_at: string; updated_at: string;
};

function json(data: unknown, status = 200, extra: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...extra } });
}

function methodNotAllowed(allow: string): Response {
  return json({ error: 'Method not allowed' }, 405, { allow });
}

function parseCookies(request: Request): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of (request.headers.get('cookie') || '').split(';')) {
    const index = part.indexOf('=');
    if (index > 0) result[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return result;
}

function buffer(value: string): ArrayBuffer {
  const encoded = new TextEncoder().encode(value);
  const copy = new Uint8Array(encoded.byteLength);
  copy.set(encoded);
  return copy.buffer;
}

function base64url(data: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(data));
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

async function hmac(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', buffer(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return base64url(await crypto.subtle.sign('HMAC', key, buffer(value)));
}

function constantTimeEqual(left: string, right: string): boolean {
  const a = new Uint8Array(buffer(left));
  const b = new Uint8Array(buffer(right));
  let mismatch = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) mismatch |= (a[index] || 0) ^ (b[index] || 0);
  return mismatch === 0;
}

async function createSession(secret: string): Promise<string> {
  const payload = `admin:${Date.now() + SESSION_SECONDS * 1000}:${crypto.randomUUID()}`;
  return `${payload}.${await hmac(payload, secret)}`;
}

async function authenticated(request: Request, env: Env): Promise<boolean> {
  const token = parseCookies(request).admin_session;
  if (!token || !env.ADMIN_SESSION_SECRET) return false;
  const dot = token.lastIndexOf('.');
  if (dot < 0) return false;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!constantTimeEqual(signature, await hmac(payload, env.ADMIN_SESSION_SECRET))) return false;
  const expires = Number(payload.split(':')[1]);
  return Number.isFinite(expires) && Date.now() <= expires;
}

function sessionCookie(token: string): string {
  return `admin_session=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}`;
}

function clearSessionCookie(): string {
  return 'admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0';
}

function sameOriginMutation(request: Request): boolean {
  const origin = request.headers.get('origin');
  const expected = new URL(request.url).origin;
  const fetchSite = request.headers.get('sec-fetch-site');
  return (!origin || origin === expected) && (!fetchSite || fetchSite === 'same-origin');
}

async function bodyJson(request: Request): Promise<Record<string, unknown>> {
  if (!(request.headers.get('content-type') || '').includes('application/json')) throw new Error('JSON required');
  return request.json<Record<string, unknown>>();
}

function product(row: ProductRow) {
  let sizes: string[] = [];
  try { sizes = JSON.parse(row.sizes_json) as string[]; } catch { sizes = []; }
  return { ...row, sizes, is_active: Boolean(row.is_active), sizes_json: undefined, image_key: undefined };
}

function cleanText(value: unknown, max: number, required = false): string | null {
  const text = typeof value === 'string' ? value.trim() : '';
  if (required && !text) throw new Error('Required field missing');
  return text ? text.slice(0, max) : null;
}

function integer(value: unknown, min = 0): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min) throw new Error('Invalid number');
  return parsed;
}

function productInput(data: Record<string, unknown>) {
  const rawSizes = Array.isArray(data.sizes) ? data.sizes : [];
  return {
    name: cleanText(data.name, 160, true) as string,
    color: cleanText(data.color, 80), category: cleanText(data.category, 80),
    description: cleanText(data.description, 1200), price: integer(data.price_kobo),
    imageUrl: cleanText(data.image_url, 500),
    imageKey: typeof data.image_url === 'string' && data.image_url.startsWith('/media/') ? data.image_url.slice(7) : null,
    sizes: rawSizes.map((size) => String(size).trim().slice(0, 30)).filter(Boolean).slice(0, 30),
    stock: integer(data.stock_quantity), active: data.is_active === false ? 0 : 1,
  };
}

async function publicProducts(env: Env): Promise<Response> {
  const result = await env.DB.prepare(`SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC`).all<ProductRow>();
  return json({ products: result.results.map(product) }, 200, { 'cache-control': 'public, max-age=60' });
}

async function login(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed('POST');
  if (!sameOriginMutation(request)) return json({ error: 'Invalid request origin' }, 403);
  if (!env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) return json({ error: 'Admin is not configured' }, 503);
  const ip = request.headers.get('cf-connecting-ip') || 'local';
  const key = await hmac(ip, env.ADMIN_SESSION_SECRET);
  const attempt = await env.DB.prepare('SELECT attempts, blocked_until FROM login_attempts WHERE client_key = ?').bind(key).first<{ attempts: number; blocked_until: number }>();
  const now = Date.now();
  if (attempt && attempt.blocked_until > now) return json({ error: 'Try again later' }, 429);
  const data = await bodyJson(request);
  const supplied = typeof data.password === 'string' ? data.password : '';
  if (!constantTimeEqual(supplied, env.ADMIN_PASSWORD)) {
    const attempts = (attempt?.attempts || 0) + 1;
    const blockedUntil = attempts >= 5 ? now + 15 * 60 * 1000 : 0;
    await env.DB.prepare(`INSERT INTO login_attempts (client_key, attempts, blocked_until, updated_at) VALUES (?, ?, ?, ?)
      ON CONFLICT(client_key) DO UPDATE SET attempts = excluded.attempts, blocked_until = excluded.blocked_until, updated_at = excluded.updated_at`)
      .bind(key, attempts >= 5 ? 0 : attempts, blockedUntil, now).run();
    return json({ error: 'Incorrect password' }, 401);
  }
  await env.DB.prepare('DELETE FROM login_attempts WHERE client_key = ?').bind(key).run();
  return json({ ok: true }, 200, { 'set-cookie': sessionCookie(await createSession(env.ADMIN_SESSION_SECRET)) });
}

async function requireAdmin(request: Request, env: Env): Promise<Response | null> {
  return (await authenticated(request, env)) ? null : json({ error: 'Unauthorized' }, 401);
}

async function adminProducts(request: Request, env: Env): Promise<Response> {
  const denied = await requireAdmin(request, env); if (denied) return denied;
  if (request.method === 'GET') {
    const result = await env.DB.prepare('SELECT * FROM products ORDER BY created_at DESC').all<ProductRow>();
    return json({ products: result.results.map(product) });
  }
  if (!sameOriginMutation(request) || request.headers.get('x-pc-admin') !== '1') return json({ error: 'Invalid admin request' }, 403);
  if (request.method === 'DELETE') {
    const id = integer(new URL(request.url).searchParams.get('id'), 1);
    const row = await env.DB.prepare('SELECT image_key FROM products WHERE id = ?').bind(id).first<{ image_key: string | null }>();
    await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
    if (row?.image_key) await env.PRODUCT_IMAGES.delete(row.image_key);
    return json({ ok: true });
  }
  if (request.method !== 'POST' && request.method !== 'PUT') return methodNotAllowed('GET, POST, PUT, DELETE');
  const data = await bodyJson(request); const input = productInput(data);
  if (request.method === 'POST') {
    const result = await env.DB.prepare(`INSERT INTO products
      (name,color,category,description,price_kobo,image_url,image_key,sizes_json,stock_quantity,is_active)
      VALUES (?,?,?,?,?,?,?,?,?,?) RETURNING *`).bind(input.name,input.color,input.category,input.description,input.price,input.imageUrl,input.imageKey,JSON.stringify(input.sizes),input.stock,input.active).first<ProductRow>();
    return json({ product: result ? product(result) : null }, 201);
  }
  const id = integer(data.id, 1);
  const result = await env.DB.prepare(`UPDATE products SET name=?,color=?,category=?,description=?,price_kobo=?,image_url=?,image_key=?,sizes_json=?,stock_quantity=?,is_active=?,updated_at=datetime('now') WHERE id=? RETURNING *`)
    .bind(input.name,input.color,input.category,input.description,input.price,input.imageUrl,input.imageKey,JSON.stringify(input.sizes),input.stock,input.active,id).first<ProductRow>();
  return result ? json({ product: product(result) }) : json({ error: 'Product not found' }, 404);
}

async function upload(request: Request, env: Env): Promise<Response> {
  const denied = await requireAdmin(request, env); if (denied) return denied;
  if (request.method !== 'POST') return methodNotAllowed('POST');
  if (!sameOriginMutation(request) || request.headers.get('x-pc-admin') !== '1') return json({ error: 'Invalid admin request' }, 403);
  const length = Number(request.headers.get('content-length') || 0);
  if (length > MAX_IMAGE_BYTES + 100_000) return json({ error: 'Image is too large' }, 413);
  const form = await request.formData(); const entry = form.get('image');
  if (!(entry instanceof File) || !IMAGE_TYPES.has(entry.type) || entry.size > MAX_IMAGE_BYTES) return json({ error: 'Use a JPG, PNG or WebP image up to 5 MB' }, 400);
  const extension = entry.type === 'image/jpeg' ? 'jpg' : entry.type.split('/')[1];
  const key = `products/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
  await env.PRODUCT_IMAGES.put(key, entry.stream(), { httpMetadata: { contentType: entry.type, cacheControl: 'public, max-age=31536000, immutable' }, customMetadata: { originalName: entry.name.slice(0, 120) } });
  return json({ image_url: `/media/${key}`, image_key: key }, 201);
}

async function media(request: Request, env: Env, key: string): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') return methodNotAllowed('GET, HEAD');
  const object = await env.PRODUCT_IMAGES.get(key);
  if (!object) return new Response('Not found', { status: 404 });
  const headers = new Headers(); object.writeHttpMetadata(headers); headers.set('etag', object.httpEtag); headers.set('x-content-type-options', 'nosniff');
  return new Response(request.method === 'HEAD' ? null : object.body, { status: 200, headers });
}

async function messages(request: Request, env: Env): Promise<Response> {
  if (request.method === 'POST') {
    if (!sameOriginMutation(request)) return json({ error: 'Invalid request origin' }, 403);
    const data = await bodyJson(request); const message = cleanText(data.message, 2000, true);
    await env.DB.prepare('INSERT INTO messages (name,phone,email,message) VALUES (?,?,?,?)').bind(cleanText(data.name,120),cleanText(data.phone,40),cleanText(data.email,200),message).run();
    return json({ ok: true }, 201);
  }
  const denied = await requireAdmin(request, env); if (denied) return denied;
  if (request.method === 'GET') return json({ messages: (await env.DB.prepare('SELECT * FROM messages ORDER BY created_at DESC LIMIT 500').all()).results });
  if (request.method === 'PATCH') {
    if (!sameOriginMutation(request) || request.headers.get('x-pc-admin') !== '1') return json({ error: 'Invalid admin request' }, 403);
    const data = await bodyJson(request); await env.DB.prepare('UPDATE messages SET is_read=? WHERE id=?').bind(data.is_read ? 1 : 0, integer(data.id,1)).run(); return json({ ok: true });
  }
  return methodNotAllowed('GET, POST, PATCH');
}

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url); const path = url.pathname;
  if (path === '/api/products') return request.method === 'GET' ? publicProducts(env) : methodNotAllowed('GET');
  if (path === '/api/admin/login') return login(request, env);
  if (path === '/api/admin/logout') return request.method === 'POST' ? json({ ok: true }, 200, { 'set-cookie': clearSessionCookie() }) : methodNotAllowed('POST');
  if (path === '/api/admin/session') return request.method === 'GET' ? json({ authenticated: await authenticated(request, env) }) : methodNotAllowed('GET');
  if (path === '/api/admin/products') return adminProducts(request, env);
  if (path === '/api/admin/upload') return upload(request, env);
  if (path === '/api/contact' || path === '/api/admin/messages') return messages(request, env);
  if (path === '/api/admin/orders') {
    const denied = await requireAdmin(request, env); if (denied) return denied;
    if (request.method !== 'GET') return methodNotAllowed('GET');
    return json({ orders: [] });
  }
  if (path.startsWith('/media/')) return media(request, env, decodeURIComponent(path.slice(7)));
  if (path.startsWith('/api/')) return json({ error: 'Not found' }, 404);
  return env.ASSETS.fetch(request);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try { return await route(request, env); }
    catch (error) {
      console.error(JSON.stringify({ event: 'request_error', path: new URL(request.url).pathname, message: error instanceof Error ? error.message : 'Unknown error' }));
      return json({ error: 'Request failed' }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
