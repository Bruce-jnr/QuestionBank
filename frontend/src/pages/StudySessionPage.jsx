import { useEffect, useMemo, useState } from 'react';
import LogoMark from '../components/LogoMark';
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
  }

  function choose(optionId) {
    if (feedback && session.mode === 'PRACTICE') return;
    if (currentQuestion.questionType === 'MULTIPLE_RESPONSE') {
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
    setError('');
    setSaving(true);
    try {
      const data = await submitExamAnswer(session.id, {
        questionId: currentQuestion.id,
        selected,
        timeSpentSec: 0,
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
    return (
      <main className="study-session-page session-results-page">
        <header className="session-header">
          <a className="student-brand" href="/student-area">
            <LogoMark />
            <span>
              <strong>NCLEX Prep</strong>
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
          <div>
            <a href="/student-area">Start another session</a>
          </div>
        </section>
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

  return (
    <main className="study-session-page">
      <header className="session-header">
        <a className="student-brand" href="/student-area">
          <LogoMark />
          <span>
            <strong>NCLEX Prep</strong>
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
        </div>
        <div className="session-progress-track">
          <span
            style={{
              width: `${((currentIndex + 1) / session.questions.length) * 100}%`,
            }}
          />
        </div>
      </section>
      <section className="session-question-card">
        <span className="category-label">
          {currentQuestion.questionType === 'MULTIPLE_RESPONSE'
            ? 'Select all that apply'
            : 'Choose one answer'}
        </span>
        <p className="session-stem">{currentQuestion.stem}</p>
        <h1>{currentQuestion.prompt}</h1>
        <div className="session-answer-options">
          {currentQuestion.options.map((option) => (
            <button
              className={selected.includes(option.id) ? 'selected' : ''}
              disabled={Boolean(feedback) && session.mode === 'PRACTICE'}
              key={option.id}
              onClick={() => choose(option.id)}
              type="button"
            >
              <span>{option.id.toUpperCase()}</span>
              {option.text}
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
            disabled={saving}
            onClick={
              feedback && session.mode === 'PRACTICE'
                ? continuePractice
                : submitCurrentAnswer
            }
            type="button"
          >
            {saving
              ? 'Saving...'
              : feedback && session.mode === 'PRACTICE'
                ? isLast
                  ? 'Complete Session'
                  : 'Next Question'
                : isLast
                  ? 'Submit Session'
                  : 'Save and Continue'}
          </button>
        </div>
      </section>
    </main>
  );
}
