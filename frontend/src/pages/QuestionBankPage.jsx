import { useState } from 'react'
import PublicLayout from '../components/PublicLayout'

export default function QuestionBankPage() {
  const [credentials, setCredentials] = useState({ email: '', password: '' })

  function submit(event) {
    event.preventDefault()
    sessionStorage.setItem('studentPreview', 'true')
    window.location.assign('/student-area')
  }

  return (
    <PublicLayout>
      <section className="question-bank-hero">
        <div className="question-bank-copy">
          <span className="category-label">Student Question Bank</span>
          <h1>Practice with purpose. Test with confidence.</h1>
          <p>Build clinical judgment with focused NCLEX questions, detailed rationales, and realistic timed exams.</p>
          <a className="assessment-text-link" href="/diagnostic">New here? Take the free readiness assessment</a>
          <div className="mode-preview-grid">
            <article><span className="mode-icon">P</span><div><h3>Practice Mode</h3><p>Learn at your pace with immediate answers and rationales.</p></div></article>
            <article><span className="mode-icon">T</span><div><h3>Test Mode</h3><p>Simulate exam conditions and review results when you finish.</p></div></article>
          </div>
        </div>
        <form className="student-login-card stacked-form" onSubmit={submit}>
          <div><span className="category-label">Student access</span><h2>Sign in to study</h2><p>Use the account provided by your administrator.</p></div>
          <label>Email or student ID<input required value={credentials.email} onChange={(event) => setCredentials({ ...credentials, email: event.target.value })} placeholder="student@example.com" /></label>
          <label>Password<input required type="password" value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} placeholder="Enter your password" /></label>
          <button type="submit">Open Student Area</button>
          <p className="student-help">Need access? Contact your NCLEX Prep administrator.</p>
        </form>
      </section>
      <section className="page-section question-features">
        <div className="centered-heading"><span>Everything in one place</span><h2>A focused study experience</h2></div>
        <div className="three-column">
          <article><strong>Topic-based review</strong><p>Choose nursing categories and focus on the subjects that need attention.</p></article>
          <article><strong>Clear rationales</strong><p>Understand why each answer is correct and learn from every attempt.</p></article>
          <article><strong>Progress tracking</strong><p>Monitor performance, accuracy, completed sessions, and improvement.</p></article>
        </div>
      </section>
    </PublicLayout>
  )
}
