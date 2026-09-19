import { useEffect, useState } from 'react';
import LogoMark from '../components/LogoMark';
import ButtonLoader from '../components/ButtonLoader';
import ActionIcon from '../components/ActionIcon';
import { StudyGuideContent } from './StudyGuidePage';
import {
  getStudyTopics,
  getQuestionAvailability,
  getStudentHistory,
  getStudentPerformance,
  startExamSession,
  verifyStudentSession,
} from '../services/api';
import { formatDate } from '../utils/formatDate';

function readDiagnosticResult() {
  try {
    return JSON.parse(localStorage.getItem('nclexDiagnosticResult'));
  } catch {
    return null;
  }
}

function readStudent() {
  try {
    return JSON.parse(localStorage.getItem('student'));
  } catch {
    return null;
  }
}

function displayTopic(value) {
  if (!value) return 'Mixed Topics';
  return value
    .toLowerCase()
    .split('_')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

export default function StudentAreaPage() {
  const activeView =
    new URLSearchParams(window.location.search).get('view') || 'dashboard';
  const showingStudyGuides = activeView === 'study-guides';
  const [diagnostic] = useState(readDiagnosticResult);
  const [student, setStudent] = useState(readStudent);
  const [performance, setPerformance] = useState({
    questionsAnswered: 0,
    completedSessions: 0,
    accuracy: 0,
    categories: [],
  });
  const [history, setHistory] = useState([]);
  const [studyTopics, setStudyTopics] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [selectedMode, setSelectedMode] = useState('practice');
  const [topic, setTopic] = useState(
    new URLSearchParams(window.location.search).get('topic') ||
      diagnostic?.focusCategories?.[0] ||
      'Mixed Topics',
  );
  const [questionCount, setQuestionCount] = useState('10');
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('studentToken')) {
      window.location.assign('/question-bank');
      return;
    }

    Promise.all([
      verifyStudentSession(),
      getStudentPerformance(),
      getStudentHistory(),
      getStudyTopics(),
      getQuestionAvailability(),
    ])
      .then(
        ([
          sessionData,
          performanceData,
          historyData,
          categoryData,
          availabilityData,
        ]) => {
          setStudent(sessionData.student);
          setPerformance(performanceData.performance);
          setHistory(historyData.sessions || []);
          setStudyTopics(categoryData.categories || []);
          setAvailability(availabilityData);
          localStorage.setItem('student', JSON.stringify(sessionData.student));
        },
      )
      .catch(() => {
        localStorage.removeItem('studentToken');
        localStorage.removeItem('student');
        window.location.assign('/question-bank');
      });
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    document.body.classList.add('offcanvas-open');
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.classList.remove('offcanvas-open');
    };
  }, [sidebarOpen]);

  async function startSession() {
    setError('');
    setStarting(true);
    try {
      const data = await startExamSession({
        mode: selectedMode.toUpperCase(),
        clientNeed:
          studyTopics.find((category) => category.name === topic)
            ?.client_need || null,
        questionCount: Number(effectiveQuestionCount),
      });
      window.location.assign(`/study-session?id=${data.session.id}`);
    } catch (requestError) {
      setError(requestError.message);
      setStarting(false);
    }
  }

  function signOut() {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('student');
    window.location.assign('/question-bank');
  }

  const initials = (student?.name || 'Student')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const selectedClientNeed = studyTopics.find(
    (category) => category.name === topic,
  )?.client_need;
  const selectedAvailability = selectedClientNeed
    ? availability?.topics?.[selectedClientNeed]
    : availability?.mixed;
  const availableCount = selectedAvailability?.available || 0;
  const countOptions = [...new Set([5, 10, 25, 50, 85, availableCount])]
    .filter((count) => count > 0 && count <= availableCount)
    .sort((a, b) => a - b);
  const effectiveQuestionCount = countOptions.includes(Number(questionCount))
    ? questionCount
    : String(countOptions[0] || '');
  const activeSession = history.find((session) => !session.isCompleted);
  const weakestCategory = [...(performance.categories || [])].sort(
    (a, b) => a.accuracy - b.accuracy,
  )[0];

  return (
    <div className="student-area">
      <aside
        className={`student-sidebar ${sidebarOpen ? 'is-open' : ''}`}
        id="student-sidebar"
      >
        <div>
          <button
            className="offcanvas-close"
            onClick={() => setSidebarOpen(false)}
            type="button"
            aria-label="Close student menu"
          >
            <ActionIcon name="close" />
          </button>
          <a className="student-brand" href="/">
            <LogoMark />
            <span>
              <strong>CBRUCENCLEX</strong>
              <small>Student Area</small>
            </span>
          </a>
          <nav>
            <a
              className={!showingStudyGuides ? 'active' : ''}
              href="/student-area#study"
              onClick={() => setSidebarOpen(false)}
            >
              Study
            </a>
            <a
              href="/student-area#performance"
              onClick={() => setSidebarOpen(false)}
            >
              Performance
            </a>
            <a
              href="/student-area#history"
              onClick={() => setSidebarOpen(false)}
            >
              History
            </a>
            <a
              href="/student-area#videos"
              onClick={() => setSidebarOpen(false)}
            >
              Videos
            </a>
            <a
              className={showingStudyGuides ? 'active' : ''}
              href="/student-area?view=study-guides"
              onClick={() => setSidebarOpen(false)}
            >
              Study Guides
            </a>
          </nav>
        </div>
        <button className="student-signout" onClick={signOut} type="button">
          Sign out
        </button>
      </aside>
      <button
        aria-label="Close student menu"
        className={`offcanvas-backdrop ${sidebarOpen ? 'is-visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        tabIndex={sidebarOpen ? 0 : -1}
        type="button"
      />
      <main className="student-content">
        <div className="student-mobile-header">
          <button
            aria-controls="student-sidebar"
            aria-expanded={sidebarOpen}
            className="offcanvas-toggle"
            onClick={() => setSidebarOpen(true)}
            type="button"
          >
            <span className="offcanvas-menu-icon" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            Menu
          </button>
          <strong>Student Area</strong>
        </div>
        <div className="student-topbar">
          <div>
            <span>
              Welcome back
              {student?.name ? `, ${student.name.split(' ')[0]}` : ''}
            </span>
            <h1>Ready for your next session?</h1>
          </div>
          <div className="student-account-summary">
            <span
              className={`student-plan-badge ${student?.accessTier === 'PREMIUM' ? 'premium' : 'free'}`}
            >
              {student?.accessTier === 'PREMIUM' && (
                <ActionIcon name="diamond" size={13} />
              )}
              {student?.accessTier === 'PREMIUM' ? 'Premium' : 'Free'}
            </span>
            <div className="student-avatar">{initials}</div>
          </div>
        </div>
        {showingStudyGuides ? (
          <StudyGuideContent embedded />
        ) : (
          <>
            {activeSession && (
              <section className="continue-session-banner">
                <div>
                  <span>Continue where you left off</span>
                  <strong>
                    {activeSession.mode === 'PRACTICE' ? 'Practice' : 'Test'} ·{' '}
                    {displayTopic(activeSession.clientNeed)}
                  </strong>
                  <p>
                    {activeSession.questionCount} questions · Started{' '}
                    {formatDate(activeSession.createdAt)}
                  </p>
                </div>
                <a href={`/study-session?id=${activeSession.id}`}>
                  Continue studying
                </a>
              </section>
            )}
            {diagnostic && (
              <section className="diagnostic-summary-banner">
                <div>
                  <span>Diagnostic complete</span>
                  <strong>Your focus plan is ready</strong>
                  <p>
                    Start with{' '}
                    {diagnostic.focusCategories?.[0] || 'mixed practice'}, then
                    continue through your recommended categories.
                  </p>
                </div>
                <a href="/diagnostic">View assessment</a>
              </section>
            )}
            <section className="student-stats" id="performance">
              <article>
                <span>Questions answered</span>
                <strong>{performance.questionsAnswered}</strong>
                <small>Across all study sessions</small>
              </article>
              <article>
                <span>Overall accuracy</span>
                <strong>
                  {performance.questionsAnswered
                    ? `${performance.accuracy}%`
                    : '-'}
                </strong>
                <small>
                  {performance.completedSessions} completed sessions
                </small>
              </article>
              <article>
                <span>Study sessions</span>
                <strong>{performance.completedSessions}</strong>
                <small>Keep building consistency</small>
              </article>
            </section>
            <section className="study-builder" id="study">
              <div className="study-builder-heading">
                <span className="category-label">Create a session</span>
                <h2>Choose your study mode</h2>
              </div>
              <div
                className="session-builder-steps"
                aria-label="Session setup steps"
              >
                <span className="active">
                  1 <b>Mode</b>
                </span>
                <span>
                  2 <b>Topic</b>
                </span>
                <span>
                  3 <b>Questions</b>
                </span>
              </div>
              <div className="study-mode-grid">
                <button
                  className={selectedMode === 'practice' ? 'selected' : ''}
                  onClick={() => setSelectedMode('practice')}
                  type="button"
                >
                  <span className="mode-icon">P</span>
                  <strong>Practice Mode</strong>
                  <p>
                    See the answer and rationale after every question. Take your
                    time and learn as you go.
                  </p>
                  <small>Untimed | Immediate feedback</small>
                </button>
                <button
                  className={selectedMode === 'test' ? 'selected' : ''}
                  onClick={() => setSelectedMode('test')}
                  type="button"
                >
                  <span className="mode-icon">T</span>
                  <strong>Test Mode</strong>
                  <p>
                    Answer under exam conditions. Results and rationales appear
                    after submission.
                  </p>
                  <small>Results at the end</small>
                </button>
              </div>
              {error && <p className="student-error">{error}</p>}
              <div className="session-options">
                <label>
                  Question topic
                  <select
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                  >
                    <option>Mixed Topics</option>
                    {studyTopics.map((category) => (
                      <option key={category.id}>{category.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Number of questions
                  <select
                    value={effectiveQuestionCount}
                    onChange={(event) => setQuestionCount(event.target.value)}
                  >
                    {countOptions.length ? (
                      countOptions.map((count) => (
                        <option key={count}>{count}</option>
                      ))
                    ) : (
                      <option value="">No questions available</option>
                    )}
                  </select>
                </label>
                <button
                  aria-busy={starting}
                  disabled={starting || !availableCount}
                  onClick={startSession}
                  type="button"
                >
                  <ButtonLoader loading={starting} loadingText="Starting...">
                    {`Start ${selectedMode === 'practice' ? 'Practice' : 'Test'}`}
                  </ButtonLoader>
                </button>

                <small className="availability-copy">
                  {availability ? (
                    <>
                      {availableCount} available
                      {selectedAvailability?.locked ? (
                        <>
                          {' '}
                          ·{' '}
                          <span className="premium-inline">
                            <ActionIcon name="diamond" size={11} />{' '}
                            {selectedAvailability.locked} premium
                          </span>
                        </>
                      ) : null}
                    </>
                  ) : (
                    'Checking availability...'
                  )}
                </small>
              </div>
            </section>
            <section className="student-video-library" id="videos">
              <div className="video-library-heading">
                <div>
                  <span className="category-label">Video library</span>
                  <h2>Learn from recorded sessions</h2>
                  <p>
                    Class recordings and focused video lessons will appear here
                    as soon as they are available.
                  </p>
                </div>
                <span className="video-coming-soon">Coming soon</span>
              </div>
              <div className="video-library-empty">
                <div className="video-placeholder-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M8 7.5v9l7-4.5-7-4.5Z" />
                  </svg>
                </div>
                <div>
                  <strong>Your video lessons will live here</strong>
                  <p>
                    {student?.accessTier === 'PREMIUM'
                      ? 'Upcoming Zoom recordings will be securely processed and added to your premium library for on-demand viewing.'
                      : 'Video lessons will be a premium benefit. Upgrade access will be available when the video library launches.'}
                  </p>
                  <div
                    className="video-feature-list"
                    aria-label="Planned video features"
                  >
                    <span>Recorded classes</span>
                    <span>Organized by topic</span>
                    <span>Secure playback</span>
                  </div>
                </div>
              </div>
            </section>
            <section className="student-bottom-grid" id="history">
              <article>
                <h3>Recent activity</h3>
                {history.length ? (
                  <div className="session-history">
                    {history.slice(0, 5).map((session) => (
                      <a
                        href={`/study-session?id=${session.id}`}
                        key={session.id}
                      >
                        <span>
                          <strong>
                            {session.mode === 'PRACTICE' ? 'Practice' : 'Test'}{' '}
                            · {displayTopic(session.clientNeed)}
                          </strong>
                          <small>
                            {formatDate(
                              session.completedAt || session.createdAt,
                            )}
                          </small>
                        </span>
                        <b>
                          {session.isCompleted && session.maxScore
                            ? `${Math.round((session.score / session.maxScore) * 100)}%`
                            : 'Resume'}
                        </b>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="empty-activity">No study sessions yet</div>
                )}
              </article>
              <article>
                <h3>Recommended focus</h3>
                {diagnostic?.focusCategories?.length ? (
                  <>
                    <p>Based on your diagnostic assessment:</p>
                    <div className="focus-topic-list">
                      {diagnostic.focusCategories.map((category) => (
                        <button
                          key={category}
                          onClick={() => {
                            setTopic(category);
                            document
                              .getElementById('study')
                              ?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          type="button"
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p>
                    Complete your first session to receive personalized topic
                    recommendations.
                  </p>
                )}
                {weakestCategory && (
                  <p className="performance-recommendation">
                    <strong>Based on your sessions:</strong> Review{' '}
                    {displayTopic(weakestCategory.clientNeed)} (
                    {weakestCategory.accuracy}% accuracy).
                  </p>
                )}
                <a href="/student-area?view=study-guides">
                  Browse study guides
                </a>
              </article>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
