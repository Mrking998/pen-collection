const { sql } = require('./_lib/db');
const { sendEmail } = require('./_lib/email');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { name, phone, email, message } = req.body || {};
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });

  let stored = false;
  let notified = false;

  try {
    await sql`INSERT INTO messages (name, phone, email, message) VALUES (${name || null}, ${phone || null}, ${email || null}, ${message})`;
    stored = true;
  } catch (err) {
    console.error('Saving message failed', err);
  }

  try {
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `New website enquiry from ${name || 'a visitor'}`,
      text: `Name: ${name || '-'}\nPhone: ${phone || '-'}\nEmail: ${email || '-'}\n\nMessage:\n${message}`,
    });
    notified = true;
  } catch (err) {
    console.error('Sending notification email failed', err);
  }

  if (!stored && !notified) {
    return res.status(503).json({ ok: false, error: 'We could not send your enquiry right now. Please try again shortly.' });
  }

  return res.status(200).json({ ok: true });
};
