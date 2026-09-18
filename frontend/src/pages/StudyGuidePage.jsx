import { useEffect, useMemo, useState } from 'react'
import PageHero from '../components/PageHero'
import PublicLayout from '../components/PublicLayout'
import { getStudyGuide } from '../services/api'

const quickStart = [
  ['01', 'Assess Your Knowledge', 'Identify strong topics and the areas that need focused review.'],
  ['02', 'Create a Study Plan', 'Build a realistic schedule around your exam date and daily routine.'],
  ['03', 'Practice Regularly', 'Answer questions every day and review the rationale for every choice.'],
]

const strategies = [
  ['Time Management', 'Use focused blocks, schedule breaks, and protect time for review.'],
  ['Practice Questions', 'Practice under timed conditions and study every rationale.'],
  ['Active Learning', 'Teach concepts aloud, create summaries, and use spaced repetition.'],
  ['Test Anxiety', 'Use breathing exercises, sleep consistently, and simulate exam day.'],
]

export default function StudyGuidePage() {
  const [search, setSearch] = useState('')
  const [distribution, setDistribution] = useState('all')
  const [domains, setDomains] = useState([])

  useEffect(() => {
    getStudyGuide().then((data) => setDomains(data.domains || [])).catch(() => setDomains([]))
  }, [])

  const filteredDomains = useMemo(() => domains.map((domain) => ({ ...domain, topics: domain.topics.filter((topic) => {
    const term = search.trim().toLowerCase()
    const matchesSearch = !term || `${topic.name} ${topic.description || ''}`.toLowerCase().includes(term)
    const percentage = topic.distribution
    const matchesDistribution = distribution === 'all'
      || (distribution === 'high' && percentage >= 15)
      || (distribution === 'medium' && percentage >= 12 && percentage < 15)
      || (distribution === 'focused' && percentage < 12)
    return matchesSearch && matchesDistribution
  }) })).filter((domain) => domain.topics.length), [distribution, domains, search])

  return (
    <PublicLayout>
      <PageHero align="center" title="NCLEX Study Guide" text="A clear path from your first review session to exam day." />
      <section className="page-section">
        <div className="quick-start"><h2>Quick Start Guide</h2><div className="three-column">{quickStart.map(([number, title, text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div></div>
        <div className="centered-heading"><span>Core content</span><h2>Study by Topic</h2></div>
        <div className="study-topic-toolbar">
          <label className="study-search"><span>Search</span><input onChange={(event) => setSearch(event.target.value)} placeholder="Search subjects..." type="search" value={search} /></label>
          <label className="study-filter"><span>Filter</span><select onChange={(event) => setDistribution(event.target.value)} value={distribution}><option value="all">All distributions</option><option value="high">High: 15-20%</option><option value="medium">Medium: 12-14%</option><option value="focused">Focused: 9%</option></select></label>
        </div>
        {filteredDomains.length ? <div className="study-domain-list">{filteredDomains.map((domain, domainIndex) => <section className="study-domain" key={domain.id}><header><span>0{domainIndex + 1}</span><div><h2>{domain.name}</h2><p>{domain.description}</p></div></header><div className="topic-grid">{domain.topics.map((topic) => <article key={topic.id}><span className="topic-percentage">{topic.distribution}% distribution</span><h3>{topic.name}</h3><p>{topic.description}</p>{topic.modules?.length > 0 && <div className="study-module-preview">{topic.modules.map((module) => <details key={module.id}><summary><span>{module.title}</span><small>{module.estimated_minutes ? `${module.estimated_minutes} min` : 'Lesson'}</small></summary><p>{module.summary}</p>{module.content && <div className="module-copy">{module.content}</div>}</details>)}</div>}<a href={`/student-area?topic=${encodeURIComponent(topic.name)}`}>Practice this topic</a></article>)}</div></section>)}</div> : <p className="empty-state">No subjects match your search and filter.</p>}
      </section>
      <section className="page-section muted-section"><div className="centered-heading"><span>Build a routine</span><h2>Effective Study Strategies</h2></div><div className="strategy-grid">{strategies.map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    </PublicLayout>
  )
}
