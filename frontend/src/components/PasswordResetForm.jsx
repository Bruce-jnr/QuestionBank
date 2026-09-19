import { useState } from 'react';
import ButtonLoader from './ButtonLoader';
import { completePasswordReset, requestPasswordReset } from '../services/api';

export default function PasswordResetForm({ accountType, onCancel }) {
  const [step, setStep] = useState('request');
  const [form, setForm] = useState({ email: '', code: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function requestCode(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await requestPasswordReset(accountType, form.email);
      setNotice(data.message);
      setStep('reset');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event) {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const data = await completePasswordReset(accountType, form.email, form.code, form.password);
      setNotice(data.message);
      setStep('complete');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  if (step === 'complete') return (
    <div className="password-reset-complete">
      <span className="category-label">Password updated</span>
      <h2>Reset complete</h2>
      <p className="success-text">{notice}</p>
      <button onClick={onCancel} type="button">Return to sign in</button>
    </div>
  );

  return (
    <form className="password-reset-form stacked-form" onSubmit={step === 'request' ? requestCode : resetPassword}>
      <span className="category-label">Account recovery</span>
      <h2>Reset your password</h2>
      <p>{step === 'request' ? 'Enter the email address on your account.' : 'Enter the six-digit code sent to your email.'}</p>
      <label>Email address<input autoComplete="email" disabled={loading || step === 'reset'} name="email" onChange={(event) => setForm({ ...form, email: event.target.value })} required type="email" value={form.email} /></label>
      {step === 'reset' && <>
        <label>Reset code<input autoComplete="one-time-code" inputMode="numeric" maxLength="6" onChange={(event) => setForm({ ...form, code: event.target.value.replace(/\D/g, '') })} pattern="[0-9]{6}" placeholder="000000" required value={form.code} /></label>
        <label>New password<input autoComplete="new-password" minLength="8" onChange={(event) => setForm({ ...form, password: event.target.value })} required type="password" value={form.password} /></label>
        <label>Confirm new password<input autoComplete="new-password" minLength="8" onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} required type="password" value={form.confirmPassword} /></label>
      </>}
      {notice && <p className="form-note" role="status">{notice}</p>}
      {error && <p className="error-text" role="alert">{error}</p>}
      <button aria-busy={loading} disabled={loading} type="submit"><ButtonLoader loading={loading} loadingText={step === 'request' ? 'Sending...' : 'Resetting...'}>{step === 'request' ? 'Send reset code' : 'Reset password'}</ButtonLoader></button>
      <button className="text-button" disabled={loading} onClick={onCancel} type="button">Back to sign in</button>
    </form>
  );
}
