import { useEffect, useMemo, useRef, useState } from 'react';
import LogoMark from '../components/LogoMark';
import ButtonLoader from '../components/ButtonLoader';
import {
  finalizeExamSession,
  getExamSession,
  submitExamAnswer,
} from '../services/api';

function displayTopic(value) {
  if (!value) return 'Mixed Topics';
  return value
    .toLowerCase()
    .split('_')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

function questionFeedback(question) {
  if (!question?.rationale) return null;
  return {
    isCorrect: question.answer?.isCorrect,
    correctAnswers: question.correctAnswers,
    rationale: question.rationale,
  };
}

export default function StudySessionPage() {
  const sessionId = useMemo(
    () => new URLSearchParams(window.location.search).get('id'),
    [],
  );
  const [session, setSession] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [flagged, setFlagged] = useState(() => new Set());
  const questionStartedAt = useRef(0);

  useEffect(() => {
    const timer = window.setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!sessionId || !localStorage.getItem('studentToken')) {
      window.location.assign('/question-bank');
      return;
    }
    getExamSession(sessionId)
      .then((data) => {
        setSession(data.session);
        setSelected(data.session.questions[0]?.answer?.selected || []);
        setFeedback(questionFeedback(data.session.questions[0]));
      })
      .catch((requestError) => setError(requestError.message));
  }, [sessionId]);

  const currentQuestion = session?.questions[currentIndex];

  function moveToQuestion(index) {
    const question = session.questions[index];
    setSelected(question?.answer?.selected || []);
    setFeedback(questionFeedback(question));
    setError('');
    setCurrentIndex(index);
    questionStartedAt.current = elapsed;
  }

  function goToQuestion(index) {
    if (selected.length && !currentQuestion.answer && !window.confirm('Leave this question without saving your selected answer?')) return;
    moveToQuestion(index);
  }

  function choose(optionId) {
    if (feedback && session.mode === 'PRACTICE') return;
    if (['MULTIPLE_RESPONSE', 'EXTENDED_MULTIPLE_RESPONSE', 'HOT_SPOT'].includes(currentQuestion.questionType)) {
      setSelected((values) =>
        values.includes(optionId)
          ? values.filter((value) => value !== optionId)
          : [...values, optionId],
      );
      return;
    }
    setSelected([optionId]);
  }

  async function finishSession() {
    const data = await finalizeExamSession(session.id);
    setSession(data.session);
  }

  async function submitCurrentAnswer() {
    if (!selected.length) {
      setError('Select an answer before continuing.');
      return;
    }
    if (session.mode === 'TEST' && currentIndex === session.questions.length - 1 && !window.confirm('Submit and complete this test session?')) return;
    setError('');
    setSaving(true);
    try {
      const data = await submitExamAnswer(session.id, {
        questionId: currentQuestion.id,
        selected,
        timeSpentSec: Math.max(1, elapsed - questionStartedAt.current),
      });
      setSession((current) => ({
        ...current,
        questions: current.questions.map((question) =>
          question.id === currentQuestion.id
            ? {
                ...question,
                answer: { ...question.answer, ...data.answer },
                ...(data.answer.correctAnswers
                  ? { correctAnswers: data.answer.correctAnswers }
                  : {}),
                ...(data.answer.rationale
                  ? { rationale: data.answer.rationale }
                  : {}),
              }
            : question,
        ),
      }));
      if (session.mode === 'PRACTICE') {
        setFeedback(data.answer);
      } else if (currentIndex === session.questions.length - 1) {
        await finishSession();
      } else {
        moveToQuestion(currentIndex + 1);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function continuePractice() {
    if (currentIndex === session.questions.length - 1) {
      setSaving(true);
      try {
        await finishSession();
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setSaving(false);
      }
      return;
    }
    moveToQuestion(currentIndex + 1);
  }

  if (error && !session) {
    return (
      <main className="session-loading">
        <p>{error}</p>
        <a href="/student-area">Return to Student Area</a>
      </main>
    );
  }

  if (!session)
    return <main className="session-loading">Loading study session...</main>;

  if (session.isCompleted) {
    const percentage = session.maxScore
      ? Math.round((session.score / session.maxScore) * 100)
      : 0;
    const categoryResults = Object.values(session.questions.reduce((results, question) => {
      const key = question.clientNeed;
      const current = results[key] || { clientNeed: key, earned: 0, possible: 0 };
      current.earned += question.answer?.pointsEarned || 0;
      current.possible += question.answer?.pointsPossible || 1;
      results[key] = current;
      return results;
    }, {})).map((result) => ({ ...result, percentage: result.possible ? Math.round((result.earned / result.possible) * 100) : 0 })).sort((a, b) => a.percentage - b.percentage);
    const weakest = categoryResults[0];
    return (
      <main className="study-session-page session-results-page">
        <header className="session-header">
          <a className="student-brand" href="/student-area">
            <LogoMark />
            <span>
              <strong>CBRUCENCLEX</strong>
              <small>Student Area</small>
            </span>
          </a>
          <a href="/student-area">Back to dashboard</a>
        </header>
        <section className="session-result-card">
          <span className="category-label">Session complete</span>
          <h1>{percentage}%</h1>
          <p>
            You earned {session.score} of {session.maxScore} available points
            across {session.questionCount} questions.
          </p>
          <div className="session-result-metrics"><span><strong>{session.questionCount}</strong> Questions</span><span><strong>{Math.max(1, Math.round((session.timeSpentSec || 0) / 60))}</strong> Minutes</span><span><strong>{categoryResults.length}</strong> Topics</span></div>
          <div>
            <a href="/student-area">Start another session</a>
            {weakest && <a className="secondary-result-link" href={`/student-area?view=study-guides&search=${encodeURIComponent(displayTopic(weakest.clientNeed))}`}>Review weakest topic</a>}
          </div>
        </section>
        <section className="session-category-results"><h2>Performance by topic</h2><div>{categoryResults.map((result) => <article key={result.clientNeed}><span>{displayTopic(result.clientNeed)}</span><strong>{result.percentage}%</strong><i><b style={{ width: `${result.percentage}%` }} /></i></article>)}</div></section>
        <section className="session-review">
          <h2>Answer review</h2>
          {session.questions.map((question, index) => (
            <details key={question.id}>
              <summary>
                <span>{index + 1}</span>
                <strong>{question.prompt}</strong>
                <small
                  className={
                    question.answer?.isCorrect ? 'correct-text' : 'review-text'
                  }
                >
                  {question.answer?.isCorrect ? 'Correct' : 'Review'}
                </small>
              </summary>
              <div>
                <p>
                  <strong>Your answer:</strong>{' '}
                  {question.answer?.selected
                    ?.map(
                      (id) =>
                        question.options.find((option) => option.id === id)
                          ?.text,
                    )
                    .filter(Boolean)
                    .join(', ') || 'No answer'}
                </p>
                <p>
                  <strong>Correct answer:</strong>{' '}
                  {question.correctAnswers
                    ?.map(
                      (id) =>
                        question.options.find((option) => option.id === id)
                          ?.text,
                    )
                    .filter(Boolean)
                    .join(', ')}
                </p>
                <p>{question.rationale}</p>
              </div>
            </details>
          ))}
        </section>
      </main>
    );
  }

  const isLast = currentIndex === session.questions.length - 1;
  const multiple = ['MULTIPLE_RESPONSE', 'EXTENDED_MULTIPLE_RESPONSE', 'HOT_SPOT'].includes(currentQuestion.questionType);
  const groupedOptions = currentQuestion.options.reduce((groups, option) => {
    const group = option.group || 'Response';
    return { ...groups, [group]: [...(groups[group] || []), option] };
  }, {});

  return (
    <main className="study-session-page">
      <header className="session-header">
        <a className="student-brand" href="/student-area">
          <LogoMark />
          <span>
            <strong>CBRUCENCLEX</strong>
            <small>
              {session.mode === 'PRACTICE' ? 'Practice Mode' : 'Test Mode'}
            </small>
          </span>
        </a>
        <a href="/student-area">Save and exit</a>
      </header>
      <section className="session-progress">
        <div>
          <span>
            Question {currentIndex + 1} of {session.questions.length}
          </span>
          <strong>{displayTopic(currentQuestion.clientNeed)}</strong>
          <small>{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</small>
        </div>
        <div className="session-progress-track">
          <span
            style={{
              width: `${((currentIndex + 1) / session.questions.length) * 100}%`,
            }}
          />
        </div>
      </section>
      <nav className="session-question-navigator" aria-label="Question navigator">
        {session.questions.map((question, index) => <button aria-label={`Question ${index + 1}${question.answer ? ', answered' : ''}${flagged.has(question.id) ? ', flagged' : ''}`} className={`${index === currentIndex ? 'current' : ''} ${question.answer ? 'answered' : ''} ${flagged.has(question.id) ? 'flagged' : ''}`} key={question.id} onClick={() => goToQuestion(index)} type="button">{index + 1}</button>)}
      </nav>
      <section className="session-question-card">
        <button className={`flag-question ${flagged.has(currentQuestion.id) ? 'active' : ''}`} onClick={() => setFlagged((current) => { const next = new Set(current); if (next.has(currentQuestion.id)) next.delete(currentQuestion.id); else next.add(currentQuestion.id); return next; })} type="button">{flagged.has(currentQuestion.id) ? 'Flagged for review' : 'Flag for review'}</button>
        <span className="category-label">
          {multiple
            ? 'Select all that apply'
            : currentQuestion.questionType === 'DRAG_DROP'
              ? 'Select items in the correct order'
              : ['CLOZE_DROP_DOWN', 'MATRIX_GRID'].includes(currentQuestion.questionType)
                ? 'Complete each response'
            : 'Choose one answer'}
        </span>
        <p className="session-stem">{currentQuestion.stem}</p>
        <h1>{currentQuestion.prompt}</h1>
        {currentQuestion.content?.exhibits?.length > 0 && <div className="ngn-exhibits">{currentQuestion.content.exhibits.map((exhibit) => <details key={exhibit.title}><summary>{exhibit.title}</summary><p>{exhibit.content}</p></details>)}</div>}
        {['CLOZE_DROP_DOWN', 'MATRIX_GRID'].includes(currentQuestion.questionType) ? <div className="ngn-grouped-options">{Object.entries(groupedOptions).map(([group, options]) => <label key={group}><span>{group}</span><select disabled={Boolean(feedback) && session.mode === 'PRACTICE'} onChange={(event) => setSelected((values) => [...values.filter((id) => !options.some((option) => option.id === id)), event.target.value].filter(Boolean))} value={selected.find((id) => options.some((option) => option.id === id)) || ''}><option value="">Select...</option>{options.map((option) => <option key={option.id} value={option.id}>{option.text}</option>)}</select></label>)}</div> : null}
        <div className="session-answer-options">
          {!['CLOZE_DROP_DOWN', 'MATRIX_GRID'].includes(currentQuestion.questionType) && currentQuestion.options.map((option) => (
            <button
              className={selected.includes(option.id) ? 'selected' : ''}
              disabled={Boolean(feedback) && session.mode === 'PRACTICE'}
              key={option.id}
              onClick={() => currentQuestion.questionType === 'DRAG_DROP' ? setSelected((values) => values.includes(option.id) ? values.filter((id) => id !== option.id) : [...values, option.id]) : choose(option.id)}
              type="button"
            >
              <span>{option.id.toUpperCase()}</span>
              {currentQuestion.questionType === 'DRAG_DROP' && selected.includes(option.id) ? `${selected.indexOf(option.id) + 1}. ` : ''}{option.text}
            </button>
          ))}
        </div>
        {feedback && (
          <div
            className={`answer-feedback ${feedback.isCorrect ? 'correct' : 'review'}`}
          >
            <strong>
              {feedback.isCorrect ? 'Correct' : 'Review this answer'}
            </strong>
            <p>{feedback.rationale}</p>
          </div>
        )}
        {error && <p className="student-error">{error}</p>}
        <div className="session-navigation">
          <button
            disabled={currentIndex === 0 || saving}
            onClick={() => moveToQuestion(currentIndex - 1)}
            type="button"
          >
            Previous
          </button>
          <button
            aria-busy={saving}
            disabled={saving}
            onClick={
              feedback && session.mode === 'PRACTICE'
                ? continuePractice
                : submitCurrentAnswer
            }
            type="button"
          >
            <ButtonLoader loading={saving} loadingText="Saving...">
              {feedback && session.mode === 'PRACTICE'
                ? isLast
                  ? 'Complete Session'
                  : 'Next Question'
                : isLast
                  ? 'Submit Session'
                  : 'Save and Continue'}
            </ButtonLoader>
          </button>
        </div>
      </section>
    </main>
  );
}
