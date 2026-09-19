const crypto = require('crypto');
const { z } = require('zod');
const prisma = require('../src/config/database');
const { hashPassword } = require('../src/config/auth');
const { sendEmail } = require('./emailService');

const OTP_LIFETIME_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const requestSchema = z.object({ email: z.string().trim().email().max(255) });
const resetSchema = z.object({
  email: z.string().trim().email().max(255),
  code: z.string().trim().regex(/^\d{6}$/, 'Enter the six-digit code'),
  password: z.string().min(8).max(128),
});

function codeHash(code, email, accountType) {
  return crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(`${accountType}:${email}:${code}`)
    .digest('hex');
}

function safeEqual(first, second) {
  const a = Buffer.from(first);
  const b = Buffer.from(second);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function findAccount(accountType, email) {
  if (accountType === 'student') {
    return prisma.student.findUnique({ where: { email } });
  }
  return prisma.admin.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
}

async function requestPasswordReset(accountType, req, res) {
  const result = requestSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: 'Enter a valid email address' });
  const email = result.data.email.toLowerCase();
  const neutralResponse = { message: 'If an account matches that email, a reset code has been sent.' };

  try {
    const account = await findAccount(accountType, email);
    if (!account || (accountType === 'student' && account.status !== 'ACTIVE')) {
      return res.json(neutralResponse);
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + OTP_LIFETIME_MS);
    await prisma.$transaction([
      prisma.passwordResetOtp.updateMany({
        where: { account_type: accountType, email, used_at: null },
        data: { used_at: new Date() },
      }),
      prisma.passwordResetOtp.create({
        data: {
          account_type: accountType,
          email,
          code_hash: codeHash(code, email, accountType),
          expires_at: expiresAt,
        },
      }),
    ]);

    await sendEmail({
      to: email,
      subject: 'Your CBRUCENCLEX password reset code',
      text: `Your CBRUCENCLEX password reset code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#17202a;max-width:560px"><h2>Reset your password</h2><p>Use this code to reset your CBRUCENCLEX ${accountType} password:</p><div style="font-size:32px;font-weight:800;letter-spacing:8px;padding:18px 22px;background:#f1f6fb;border-radius:10px;text-align:center">${code}</div><p>This code expires in 10 minutes. If you did not request a reset, you can safely ignore this email.</p></div>`,
    });
    return res.json(neutralResponse);
  } catch (error) {
    console.error(`${accountType} password reset request error:`, error.message);
    return res.status(500).json({ error: 'Unable to send a reset code right now' });
  }
}

async function completePasswordReset(accountType, req, res) {
  const result = resetSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0]?.message || 'Invalid reset details' });
  const email = result.data.email.toLowerCase();

  try {
    const otp = await prisma.passwordResetOtp.findFirst({
      where: { account_type: accountType, email, used_at: null },
      orderBy: { created_at: 'desc' },
    });
    if (!otp || otp.expires_at <= new Date()) {
      return res.status(400).json({ error: 'This reset code is invalid or has expired' });
    }
    if (otp.attempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({ error: 'Too many incorrect attempts. Request a new code.' });
    }

    const submittedHash = codeHash(result.data.code, email, accountType);
    if (!safeEqual(submittedHash, otp.code_hash)) {
      await prisma.passwordResetOtp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
      return res.status(400).json({ error: 'This reset code is invalid or has expired' });
    }

    const account = await findAccount(accountType, email);
    if (!account) return res.status(400).json({ error: 'This reset code is invalid or has expired' });
    const password = await hashPassword(result.data.password);
    await prisma.$transaction([
      accountType === 'student'
        ? prisma.student.update({ where: { id: account.id }, data: { password, must_change_password: false } })
        : prisma.admin.update({ where: { id: account.id }, data: { password } }),
      prisma.passwordResetOtp.update({ where: { id: otp.id }, data: { used_at: new Date() } }),
    ]);
    return res.json({ message: 'Your password has been reset. You can now sign in.' });
  } catch (error) {
    console.error(`${accountType} password reset error:`, error.message);
    return res.status(500).json({ error: 'Unable to reset your password right now' });
  }
}

module.exports = { completePasswordReset, requestPasswordReset };
