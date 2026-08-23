const { sql } = require('../_lib/db');
const { requireAuth } = require('../_lib/auth');

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;

  if (req.method === 'GET') {
    const { rows } = await sql`SELECT * FROM products ORDER BY created_at DESC`;
    return res.status(200).json({ products: rows });
  }

  if (req.method === 'POST') {
    const { name, color, category, description, price_kobo, image_url, sizes, stock_quantity, is_active } = req.body || {};
    if (!name || !price_kobo) return res.status(400).json({ error: 'name and price_kobo are required' });
    const { rows } = await sql`
      INSERT INTO products (name, color, category, description, price_kobo, image_url, sizes, stock_quantity, is_active)
      VALUES (${name}, ${color || null}, ${category || null}, ${description || null}, ${price_kobo}, ${image_url || null}, ${sizes || []}, ${stock_quantity || 0}, ${is_active !== false})
      RETURNING *`;
    return res.status(201).json({ product: rows[0] });
  }

  if (req.method === 'PUT') {
    const { id, name, color, category, description, price_kobo, image_url, sizes, stock_quantity, is_active } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id is required' });
    const { rows } = await sql`
      UPDATE products SET
        name = ${name}, color = ${color || null}, category = ${category || null},
        description = ${description || null}, price_kobo = ${price_kobo},
        image_url = ${image_url || null}, sizes = ${sizes || []},
        stock_quantity = ${stock_quantity || 0}, is_active = ${is_active !== false},
        updated_at = now()
      WHERE id = ${id}
      RETURNING *`;
    return res.status(200).json({ product: rows[0] });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id is required' });
    await sql`DELETE FROM products WHERE id = ${id}`;
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
