const crypto = require('crypto');
const { sql } = require('./_lib/db');
const { initializeTransaction } = require('./_lib/paystack');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { name, email, phone, items } = req.body || {};

  if (!name || !email || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Missing name, email, or cart items' });
  }

  try {
    let total = 0;
    const lineItems = [];

    // Prices and stock are always re-checked against the database — never trusted from the browser.
    for (const item of items) {
      const { rows } = await sql`SELECT id, name, price_kobo, stock_quantity FROM products WHERE id = ${item.id} AND is_active = true`;
      const product = rows[0];
      if (!product) return res.status(400).json({ error: `A product in your cart is no longer available.` });
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      if (product.stock_quantity < qty) {
        return res.status(400).json({ error: `${product.name} — only ${product.stock_quantity} left in stock.` });
      }
      total += product.price_kobo * qty;
      lineItems.push({
        product_id: product.id,
        product_name: product.name,
        size: item.size || null,
        quantity: qty,
        unit_price_kobo: product.price_kobo,
      });
    }

    const reference = `PEN-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const { rows: orderRows } = await sql`
      INSERT INTO orders (reference, customer_name, customer_email, customer_phone, total_kobo, status)
      VALUES (${reference}, ${name}, ${email}, ${phone || null}, ${total}, 'pending')
      RETURNING id`;
    const orderId = orderRows[0].id;

    for (const li of lineItems) {
      await sql`
        INSERT INTO order_items (order_id, product_id, product_name, size, quantity, unit_price_kobo)
        VALUES (${orderId}, ${li.product_id}, ${li.product_name}, ${li.size}, ${li.quantity}, ${li.unit_price_kobo})`;
    }

    const origin = `https://${req.headers.host}`;
    const paystackData = await initializeTransaction({
      email,
      amountKobo: total,
      reference,
      callback_url: `${origin}/order-confirmed.html?reference=${reference}`,
      metadata: { order_id: orderId },
    });

    res.status(200).json({ authorization_url: paystackData.authorization_url, reference });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Checkout failed. Please try again, or message us on WhatsApp.' });
  }
};
