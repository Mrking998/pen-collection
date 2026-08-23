const { Resend } = require('resend');

async function sendEmail({ to, subject, text }) {
  if (!process.env.RESEND_API_KEY || !to) return;
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.FROM_EMAIL || 'Pen Collection <onboarding@resend.dev>',
    to,
    subject,
    text,
  });
}

module.exports = { sendEmail };
