const { sql } = require('../_lib/db');
const { requireAuth } = require('../_lib/auth');

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;

  if (req.method === 'GET') {
    const { rows } = await sql`SELECT * FROM messages ORDER BY created_at DESC LIMIT 200`;
    return res.status(200).json({ messages: rows });
  }

  if (req.method === 'PATCH') {
    const { id, is_read } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id is required' });
    await sql`UPDATE messages SET is_read = ${!!is_read} WHERE id = ${id}`;
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
