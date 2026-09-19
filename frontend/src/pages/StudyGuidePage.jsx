import { useEffect, useMemo, useState } from 'react';
import PageHero from '../components/PageHero';
import PublicLayout from '../components/PublicLayout';
import ActionIcon from '../components/ActionIcon';
import { getStudyGuide } from '../services/api';

const quickStart = [
  [
    '01',
    'Assess Your Knowledge',
    'Identify strong topics and the areas that need focused review.',
  ],
  [
    '02',
    'Create a Study Plan',
    'Build a realistic schedule around your exam date and daily routine.',
  ],
  [
    '03',
    'Practice Regularly',
    'Answer questions every day and review the rationale for every choice.',
  ],
];

const strategies = [
  [
    'Time Management',
    'Use focused blocks, schedule breaks, and protect time for review.',
  ],
  [
    'Practice Questions',
    'Practice under timed conditions and study every rationale.',
  ],
  [
    'Active Learning',
    'Teach concepts aloud, create summaries, and use spaced repetition.',
  ],
  [
    'Test Anxiety',
    'Use breathing exercises, sleep consistently, and simulate exam day.',
  ],
];

const topicImages = {
  MANAGEMENT_OF_CARE: '/images/topic-management.png',
  SAFETY_AND_INFECTION_CONTROL: '/images/topic-safety.png',
  HEALTH_PROMOTION_AND_MAINTENANCE: '/images/topic-health-promotion.png',
  PSYCHOSOCIAL_INTEGRITY: '/images/topic-psychosocial.png',
  BASIC_CARE_AND_COMFORT: '/images/topic-basic-care.png',
  PHARMACOLOGICAL_AND_PARENTERAL_THERAPIES: '/images/topic-pharmacology.png',
  REDUCTION_OF_RISK_POTENTIAL: '/images/topic-risk-reduction.png',
  PHYSIOLOGICAL_ADAPTATION: '/images/topic-physiological.png',
};

export function StudyGuideContent({ embedded = false }) {
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get('search') || '');
  const [distribution, setDistribution] = useState('all');
  const [domains, setDomains] = useState([]);

  useEffect(() => {
    getStudyGuide()
      .then((data) => setDomains(data.domains || []))
      .catch(() => setDomains([]));
  }, []);

  const filteredDomains = useMemo(
    () =>
      domains
        .map((domain) => ({
          ...domain,
          topics: domain.topics.filter((topic) => {
            const term = search.trim().toLowerCase();
            const matchesSearch =
              !term ||
              `${topic.name} ${topic.description || ''}`
                .toLowerCase()
                .includes(term);
            const percentage = topic.distribution;
            const matchesDistribution =
              distribution === 'all' ||
              (distribution === 'high' && percentage >= 15) ||
              (distribution === 'medium' &&
                percentage >= 12 &&
                percentage < 15) ||
              (distribution === 'focused' && percentage < 12);
            return matchesSearch && matchesDistribution;
          }),
        }))
        .filter((domain) => domain.topics.length),
    [distribution, domains, search],
  );

  return (
    <>
      {embedded ? <div className="embedded-guide-heading"><div><span className="category-label">Study guides</span><h1>Study by topic</h1><p>Review lessons without leaving your student dashboard.</p></div><a href="/student-area">Back to dashboard</a></div> : <PageHero
        align="center"
        title="NCLEX Study Guide"
        text="A clear path from your first review session to exam day."
      />}
      <section className={embedded ? 'embedded-guide-content' : 'page-section'}>
        <div className="quick-start">
          <h2>Quick Start Guide</h2>
          <div className="three-column">
            {quickStart.map(([number, title, text]) => (
              <article key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="centered-heading">
          <span>Core content</span>
          <h2>Study by Topic</h2>
        </div>
        <div className="study-topic-toolbar">
          <label className="study-search">
            <span>Search</span>
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search subjects..."
              type="search"
              value={search}
            />
          </label>
          <label className="study-filter">
            <span>Filter</span>
            <select
              onChange={(event) => setDistribution(event.target.value)}
              value={distribution}
            >
              <option value="all">All distributions</option>
              <option value="high">High: 15-20%</option>
              <option value="medium">Medium: 12-14%</option>
              <option value="focused">Focused: 9%</option>
            </select>
          </label>
        </div>
        {filteredDomains.length ? (
          <div className="study-domain-list">
            {filteredDomains.map((domain, domainIndex) => (
              <section className="study-domain" key={domain.id}>
                <header>
                  <span>0{domainIndex + 1}</span>
                  <div>
                    <h2>{domain.name}</h2>
                    <p>{domain.description}</p>
                  </div>
                </header>
                <div className="topic-grid">
                  {domain.topics.map((topic, topicIndex) => (
                    <article className="topic-image-card" key={topic.id}>
                      <div
                        className="topic-card-visual"
                        style={{
                          backgroundImage: `url('${topicImages[topic.client_need] || '/images/study-topics.png'}')`,
                          backgroundPosition: `${35 + ((domainIndex + topicIndex) % 3) * 15}% center`,
                        }}
                      >
                        <div className="topic-card-overlay">
                          <div className="topic-card-meta">
                            <span className="topic-percentage">{topic.distribution}% distribution</span>
                            {embedded ? (
                              <span className="topic-question-count total-count">
                                {topic.question_count || 0} {topic.question_count === 1 ? 'question' : 'questions'}
                              </span>
                            ) : <>
                              <span className="topic-question-count free-count">{topic.free_question_count || 0} free</span>
                              <a className="topic-question-count premium-count" href="/pricing" title="View Premium plan"><ActionIcon name="diamond" size={11} /> +{topic.premium_question_count || 0}<span className="sr-only"> premium questions</span></a>
                            </>}
                          </div>
                          <h3>{topic.name}</h3>
                          <p>{topic.description}</p>
                        </div>
                      </div>
                      <div className="topic-card-content">
                      {topic.modules?.length > 0 && (
                        <div className="study-module-preview">
                          {topic.modules.map((module) => (
                            <details key={module.id}>
                              <summary>
                                <span>{module.title}</span>
                                <small>
                                  {module.estimated_minutes
                                    ? `${module.estimated_minutes} min`
                                    : 'Lesson'}
                                </small>
                              </summary>
                              <p>{module.summary}</p>
                              {module.content && (
                                <div className="module-copy">
                                  {module.content}
                                </div>
                              )}
                            </details>
                          ))}
                        </div>
                      )}
                      <a
                        href={`/student-area?topic=${encodeURIComponent(topic.name)}`}
                      >
                        Practice this topic
                      </a>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <p className="empty-state">
            No subjects match your search and filter.
          </p>
        )}
      </section>
      <section className={embedded ? 'embedded-guide-strategies' : 'page-section muted-section'}>
        <div className="centered-heading">
          <span>Build a routine</span>
          <h2>Effective Study Strategies</h2>
        </div>
        <div className="strategy-grid">
          {strategies.map(([title, text]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

export default function StudyGuidePage() {
  return <PublicLayout><StudyGuideContent /></PublicLayout>
}
