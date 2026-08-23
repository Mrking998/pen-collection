const crypto = require('crypto');

const SECRET = process.env.ADMIN_SESSION_SECRET || 'change-me-in-env-vars';
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

function sign(value) {
  return crypto.createHmac('sha256', SECRET).update(value).digest('hex');
}

function createSessionCookie() {
  const expires = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `admin:${expires}`;
  const token = `${payload}.${sign(payload)}`;
  return `admin_session=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${MAX_AGE_SECONDS}`;
}

function clearSessionCookie() {
  return 'admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0';
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  return Object.fromEntries(
    header
      .split(';')
      .filter(Boolean)
      .map((c) => {
        const idx = c.indexOf('=');
        return [c.slice(0, idx).trim(), decodeURIComponent(c.slice(idx + 1).trim())];
      })
  );
}

function isAuthenticated(req) {
  const token = parseCookies(req).admin_session;
  if (!token) return false;
  const dot = token.lastIndexOf('.');
  if (dot === -1) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (sign(payload) !== sig) return false;
  const expires = Number(payload.split(':')[1]);
  return Date.now() <= expires;
}

function requireAuth(req, res) {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

module.exports = { createSessionCookie, clearSessionCookie, isAuthenticated, requireAuth };
