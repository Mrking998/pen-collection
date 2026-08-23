const { sql } = require('./_lib/db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { rows } = await sql`
      SELECT id, name, color, category, description, price_kobo, image_url, sizes, stock_quantity
      FROM products
      WHERE is_active = true
      ORDER BY created_at DESC`;
    res.status(200).json({ products: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load products' });
  }
};
