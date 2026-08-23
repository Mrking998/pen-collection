const crypto = require('crypto');
const { sql } = require('../_lib/db');

// Needed so we can verify Paystack's signature against the exact raw request body.
module.exports.config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const rawBody = await readRawBody(req);
  const signature = req.headers['x-paystack-signature'];
  const expected = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '').update(rawBody).digest('hex');

  if (!signature || signature !== expected) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: 'Bad payload' });
  }

  if (event.event === 'charge.success') {
    const { reference, status } = event.data;
    try {
      const { rows } = await sql`SELECT id, status FROM orders WHERE reference = ${reference}`;
      const order = rows[0];
      if (order && order.status !== 'paid') {
        await sql`UPDATE orders SET status = 'paid', paystack_status = ${status}, updated_at = now() WHERE id = ${order.id}`;
        const { rows: items } = await sql`SELECT product_id, quantity FROM order_items WHERE order_id = ${order.id}`;
        for (const item of items) {
          if (item.product_id) {
            await sql`UPDATE products SET stock_quantity = GREATEST(stock_quantity - ${item.quantity}, 0) WHERE id = ${item.product_id}`;
          }
        }
      }
    } catch (err) {
      console.error('Webhook processing failed', err);
    }
  }

  res.status(200).json({ received: true });
};
