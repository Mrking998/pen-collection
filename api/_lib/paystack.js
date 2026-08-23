const PAYSTACK_BASE = 'https://api.paystack.co';

async function initializeTransaction({ email, amountKobo, reference, callback_url, metadata }) {
  const resp = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, amount: amountKobo, reference, callback_url, metadata }),
  });
  const data = await resp.json();
  if (!data.status) throw new Error(data.message || 'Paystack initialize failed');
  return data.data; // { authorization_url, access_code, reference }
}

async function verifyTransaction(reference) {
  const resp = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  });
  const data = await resp.json();
  if (!data.status) throw new Error(data.message || 'Paystack verify failed');
  return data.data;
}

module.exports = { initializeTransaction, verifyTransaction };
