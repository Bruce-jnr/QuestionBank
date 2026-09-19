const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function emailConfig() {
  return {
    apiKey: process.env.RESEND_KEY || process.env.RESEND_API_KEY,
    from: process.env.RESEND_FROM_EMAIL || 'CBRUCENCLEX <onboarding@resend.dev>',
  };
}

async function sendEmail({ from, to, subject, html, text, replyTo, idempotencyKey }) {
  const config = emailConfig();
  if (!config.apiKey) throw new Error('Resend is not configured');

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from: from || config.from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.message || 'Email delivery failed');
    error.statusCode = response.status;
    throw error;
  }
  return result;
}

module.exports = { sendEmail };
