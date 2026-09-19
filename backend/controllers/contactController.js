const { z } = require('zod');
const Setting = require('../models/Setting');
const { sendEmail } = require('../services/emailService');

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(5000),
  website: z.string().max(0).optional(),
});

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function submitContact(req, res) {
  const result = contactSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0]?.message || 'Invalid message' });
  }

  try {
    const recipient = process.env.CONTACT_EMAIL || await Setting.findByKey('contact_email');
    if (!recipient) return res.status(503).json({ error: 'Contact email is not configured' });

    const { name, email, subject, message } = result.data;
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message).replaceAll('\n', '<br>');

    await sendEmail({
      to: recipient,
      replyTo: email,
      subject: `[CBRUCENCLEX contact] ${subject}`,
      text: `New website message\n\nFrom: ${name} <${email}>\nSubject: ${subject}\n\n${message}`,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#17202a"><h2>New website message</h2><p><strong>From:</strong> ${safeName} &lt;${safeEmail}&gt;</p><p><strong>Subject:</strong> ${safeSubject}</p><div style="margin-top:20px;padding:18px;background:#f5f7fa;border-radius:10px">${safeMessage}</div></div>`,
    });

    return res.status(202).json({ message: 'Your message has been sent.' });
  } catch (error) {
    console.error('Contact email error:', error.message);
    return res.status(502).json({ error: 'We could not send your message. Please try again later.' });
  }
}

module.exports = { submitContact };
