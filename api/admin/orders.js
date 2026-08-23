const { sql } = require('../_lib/db');
const { requireAuth } = require('../_lib/auth');

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;

  if (req.method === 'GET') {
    const { rows: orders } = await sql`SELECT * FROM orders ORDER BY created_at DESC LIMIT 200`;
    const { rows: items } = await sql`SELECT * FROM order_items`;
    const withItems = orders.map((o) => ({ ...o, items: items.filter((i) => i.order_id === o.id) }));
    return res.status(200).json({ orders: withItems });
  }

  if (req.method === 'PATCH') {
    const { id, status } = req.body || {};
    if (!id || !status) return res.status(400).json({ error: 'id and status are required' });
    const { rows } = await sql`UPDATE orders SET status = ${status}, updated_at = now() WHERE id = ${id} RETURNING *`;
    return res.status(200).json({ order: rows[0] });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
