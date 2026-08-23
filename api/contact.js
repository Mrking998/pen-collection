const { sql } = require('./_lib/db');
const { sendEmail } = require('./_lib/email');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { name, phone, email, message } = req.body || {};
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });

  try {
    await sql`INSERT INTO messages (name, phone, email, message) VALUES (${name || null}, ${phone || null}, ${email || null}, ${message})`;
  } catch (err) {
    console.error('Saving message failed', err);
  }

  try {
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `New website enquiry from ${name || 'a visitor'}`,
      text: `Name: ${name || '-'}\nPhone: ${phone || '-'}\nEmail: ${email || '-'}\n\nMessage:\n${message}`,
    });
  } catch (err) {
    console.error('Sending notification email failed', err);
  }

  res.status(200).json({ ok: true });
};
