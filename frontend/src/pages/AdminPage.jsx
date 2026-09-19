import { useEffect, useState } from 'react';
import LogoMark from '../components/LogoMark';
import ButtonLoader from '../components/ButtonLoader';
import PasswordResetForm from '../components/PasswordResetForm';
import { login, verifySession } from '../services/api';

export default function AdminPage() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('authToken'))
      verifySession()
        .then(() => window.location.assign('/dashboard'))
        .catch(() => localStorage.removeItem('authToken'));
  }, []);

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const data = await login(credentials);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.assign('/dashboard');
    } catch (requestError) {
      setError(requestError.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <a className="brand" href="/">
        <LogoMark />
        <span>CBRUCENCLEX</span>
      </a>
      <div className="auth-card">
        {resettingPassword ? (
          <PasswordResetForm
            accountType="admin"
            onCancel={() => setResettingPassword(false)}
          />
        ) : (
          <form className="stacked-form" onSubmit={submit}>
            <span className="category-label">Administrator</span>
            <h1>Welcome back</h1>
            <p>Sign in to manage NCLEX resources.</p>
            <label>
              Username
              <input
                autoComplete="username"
                disabled={submitting}
                required
                value={credentials.username}
                onChange={(event) =>
                  setCredentials({
                    ...credentials,
                    username: event.target.value,
                  })
                }
              />
            </label>
            <label>
              Password
              <input
                autoComplete="current-password"
                disabled={submitting}
                required
                type="password"
                value={credentials.password}
                onChange={(event) =>
                  setCredentials({
                    ...credentials,
                    password: event.target.value,
                  })
                }
              />
            </label>
            <button aria-busy={submitting} disabled={submitting} type="submit">
              <ButtonLoader loading={submitting} loadingText="Signing in...">
                Sign in
              </ButtonLoader>
            </button>
            <button
              className="text-button"
              onClick={() => setResettingPassword(true)}
              type="button"
            >
              Forgot password?
            </button>
            {error && <p className="error-text">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
