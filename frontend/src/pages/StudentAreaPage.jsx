import { useState } from 'react'
import LogoMark from '../components/LogoMark'
import { studyTopics } from '../data/studyTopics'

function readDiagnosticResult() {
  try {
    return JSON.parse(localStorage.getItem('nclexDiagnosticResult'))
  } catch {
    return null
  }
}

export default function StudentAreaPage() {
  const [diagnostic] = useState(readDiagnosticResult)
  const [selectedMode, setSelectedMode] = useState('practice')
  const [topic, setTopic] = useState(diagnostic?.focusCategories?.[0] || 'Mixed Topics')
  const [questionCount, setQuestionCount] = useState('25')

  return (
    <div className="student-area">
      <aside className="student-sidebar">
        <a className="student-brand" href="/"><LogoMark /><span><strong>NCLEX Prep</strong><small>Student Area</small></span></a>
        <nav><button className="active" type="button">Study</button><button type="button">Performance</button><button type="button">History</button><a href="/study-guide">Study Guides</a></nav>
        <a className="student-signout" href="/question-bank">Sign out</a>
      </aside>
      <main className="student-content">
        <div className="student-topbar"><div><span>Welcome back</span><h1>Ready for your next session?</h1></div><div className="student-avatar">ST</div></div>
        {diagnostic && <section className="diagnostic-summary-banner"><div><span>Diagnostic complete</span><strong>Your focus plan is ready</strong><p>Start with {diagnostic.focusCategories?.[0] || 'mixed practice'}, then continue through your recommended categories.</p></div><a href="/diagnostic">View assessment</a></section>}
        <section className="student-stats">
          <article><span>Questions answered</span><strong>{diagnostic?.total || 0}</strong><small>{diagnostic ? 'From your diagnostic' : 'Start your first session'}</small></article>
          <article><span>Overall accuracy</span><strong>{diagnostic ? `${diagnostic.score}%` : '-'}</strong><small>{diagnostic ? `${diagnostic.correct} correct answers` : 'No results yet'}</small></article>
          <article><span>Study streak</span><strong>0 days</strong><small>Build a daily habit</small></article>
        </section>
        <section className="study-builder">
          <div className="study-builder-heading"><span className="category-label">Create a session</span><h2>Choose your study mode</h2></div>
          <div className="study-mode-grid">
            <button className={selectedMode === 'practice' ? 'selected' : ''} onClick={() => setSelectedMode('practice')} type="button"><span className="mode-icon">P</span><strong>Practice Mode</strong><p>See the answer and rationale after every question. Take your time and learn as you go.</p><small>Untimed | Immediate feedback</small></button>
            <button className={selectedMode === 'test' ? 'selected' : ''} onClick={() => setSelectedMode('test')} type="button"><span className="mode-icon">T</span><strong>Test Mode</strong><p>Answer under exam conditions. Results and rationales appear after submission.</p><small>Timed | Results at the end</small></button>
          </div>
          <div className="session-options"><label>Question topic<select value={topic} onChange={(event) => setTopic(event.target.value)}><option>Mixed Topics</option>{studyTopics.map(([title]) => <option key={title}>{title}</option>)}</select></label><label>Number of questions<select value={questionCount} onChange={(event) => setQuestionCount(event.target.value)}><option>10</option><option>25</option><option>50</option><option>85</option></select></label><button type="button">Start {selectedMode === 'practice' ? 'Practice' : 'Test'}</button></div>
        </section>
        <section className="student-bottom-grid"><article><h3>Recent activity</h3><p>Your completed practice and test sessions will appear here.</p><div className="empty-activity">{diagnostic ? `Diagnostic assessment completed with ${diagnostic.score}% accuracy` : 'No study sessions yet'}</div></article><article><h3>Recommended focus</h3>{diagnostic?.focusCategories?.length ? <><p>Based on your diagnostic assessment:</p><div className="focus-topic-list">{diagnostic.focusCategories.map((category) => <button key={category} onClick={() => { setTopic(category); window.scrollTo({ top: 0, behavior: 'smooth' }) }} type="button">{category}</button>)}</div></> : <p>Complete your first session to receive personalized topic recommendations.</p>}<a href="/study-guide">Browse study guides</a></article></section>
      </main>
    </div>
  )
}
