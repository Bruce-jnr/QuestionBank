import { useEffect, useState } from 'react'
import LogoMark from '../components/LogoMark'
import { login, verifySession } from '../services/api'

export default function AdminPage() {
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (localStorage.getItem('authToken')) verifySession().then(() => window.location.assign('/dashboard')).catch(() => localStorage.removeItem('authToken'))
  }, [])

  async function submit(event) {
    event.preventDefault()
    try {
      const data = await login(credentials)
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      window.location.assign('/dashboard')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return <div className="auth-page"><a className="brand" href="/"><LogoMark /><span>NCLEX Prep</span></a><form className="auth-card stacked-form" onSubmit={submit}><span className="category-label">Administrator</span><h1>Welcome back</h1><p>Sign in to manage NCLEX resources.</p><label>Username<input required value={credentials.username} onChange={(event) => setCredentials({ ...credentials, username: event.target.value })} /></label><label>Password<input required type="password" value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} /></label><button type="submit">Sign in</button>{error && <p className="error-text">{error}</p>}</form></div>
}
