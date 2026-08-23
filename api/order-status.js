const { sql } = require('./_lib/db');
const { verifyTransaction } = require('./_lib/paystack');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { reference } = req.query;
  if (!reference) return res.status(400).json({ error: 'reference is required' });

  try {
    const { rows } = await sql`SELECT status, total_kobo, customer_name FROM orders WHERE reference = ${reference}`;
    let order = rows[0];
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // The webhook usually marks the order paid within a second or two. As a fallback
    // (e.g. webhook not yet configured), double-check directly with Paystack here.
    if (order.status === 'pending') {
      try {
        const verify = await verifyTransaction(reference);
        if (verify.status === 'success') {
          await sql`UPDATE orders SET status = 'paid', paystack_status = ${verify.status}, updated_at = now() WHERE reference = ${reference}`;
          order = { ...order, status: 'paid' };
        }
      } catch (e) {
        console.error('Fallback verify failed', e);
      }
    }

    res.status(200).json({ status: order.status, total_kobo: order.total_kobo, customer_name: order.customer_name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check order status' });
  }
};
