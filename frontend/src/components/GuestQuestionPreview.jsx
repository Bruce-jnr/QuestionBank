import { useEffect, useMemo, useState } from 'react';
import ButtonLoader from './ButtonLoader';
import { DragDropAnswer } from '../pages/StudySessionPage';
import MatrixAnswer from './MatrixAnswer';
import {
  getGuestQuestionAvailability,
  startGuestQuestionPreview,
  submitGuestQuestionAnswer,
} from '../services/api';

const clientNeedLabels = {
  MANAGEMENT_OF_CARE: 'Management of Care',
  SAFETY_AND_INFECTION_CONTROL: 'Safety and Infection Control',
  HEALTH_PROMOTION_AND_MAINTENANCE: 'Health Promotion and Maintenance',
  PSYCHOSOCIAL_INTEGRITY: 'Psychosocial Integrity',
  BASIC_CARE_AND_COMFORT: 'Basic Care and Comfort',
  PHARMACOLOGICAL_AND_PARENTERAL_THERAPIES: 'Pharmacological and Parenteral Therapies',
  REDUCTION_OF_RISK_POTENTIAL: 'Reduction of Risk Potential',
  PHYSIOLOGICAL_ADAPTATION: 'Physiological Adaptation',
};

const questionTypeLabels = {
  MULTIPLE_CHOICE: 'Multiple choice',
  MULTIPLE_RESPONSE: 'Multiple response',
  EXTENDED_MULTIPLE_RESPONSE: 'NGN extended multiple response',
  DRAG_DROP: 'NGN drag and drop',
  HOT_SPOT: 'NGN enhanced hot spot',
  MATRIX_GRID: 'Matrix grid',
  CLOZE_DROP_DOWN: 'Cloze drop-down',
  CASE_STUDY: 'NGN case study',
  RATIONALE_PAIRED: 'Rationale paired',
  BOW_TIE: 'Bow tie',
};

const multipleTypes = ['MULTIPLE_RESPONSE', 'EXTENDED_MULTIPLE_RESPONSE', 'HOT_SPOT'];
const groupedTypes = ['CLOZE_DROP_DOWN'];

export default function GuestQuestionPreview() {
  const [availability, setAvailability] = useState([]);
  const [filters, setFilters] = useState({ clientNeed: '', questionType: '', questionCount: '5' });
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [results, setResults] = useState([]);
  const [phase, setPhase] = useState('setup');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getGuestQuestionAvailability()
      .then((data) => setAvailability(data.combinations || []))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const clientNeeds = useMemo(
    () => [...new Set(availability.map((item) => item.clientNeed))],
    [availability],
  );
  const questionTypes = useMemo(
    () => [...new Set(availability
      .filter((item) => !filters.clientNeed || item.clientNeed === filters.clientNeed)
      .map((item) => item.questionType))],
    [availability, filters.clientNeed],
  );
  const availableCount = availability
    .filter((item) => (!filters.clientNeed || item.clientNeed === filters.clientNeed)
      && (!filters.questionType || item.questionType === filters.questionType))
    .reduce((sum, item) => sum + item.count, 0);
  const currentQuestion = questions[index];
  const groupedOptions = currentQuestion?.options?.reduce((groups, option) => {
    const group = option.group || 'Response';
    return { ...groups, [group]: [...(groups[group] || []), option] };
  }, {}) || {};

  function updateClientNeed(value) {
    const validTypes = new Set(availability
      .filter((item) => !value || item.clientNeed === value)
      .map((item) => item.questionType));
    setFilters((current) => ({
      ...current,
      clientNeed: value,
      questionType: validTypes.has(current.questionType) ? current.questionType : '',
    }));
  }

  async function startPreview(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await startGuestQuestionPreview({
        clientNeed: filters.clientNeed || null,
        questionType: filters.questionType || null,
        questionCount: Math.min(Number(filters.questionCount), availableCount, 5),
      });
      setQuestions(data.questions);
      setIndex(0);
      setSelected([]);
      setFeedback(null);
      setResults([]);
      setPhase('practice');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function choose(optionId) {
    if (feedback) return;
    if (multipleTypes.includes(currentQuestion.questionType)) {
      setSelected((values) => values.includes(optionId)
        ? values.filter((value) => value !== optionId)
        : [...values, optionId]);
    } else {
      setSelected([optionId]);
    }
  }

  async function checkAnswer() {
    setError('');
    setSubmitting(true);
    try {
      const data = await submitGuestQuestionAnswer({
        questionId: currentQuestion.id,
        selected,
      });
      setFeedback(data);
      setResults((current) => [...current, data]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  function continuePreview() {
    if (index === questions.length - 1) {
      setPhase('results');
      return;
    }
    setIndex((current) => current + 1);
    setSelected([]);
    setFeedback(null);
    setError('');
  }

  function restart() {
    setPhase('setup');
    setQuestions([]);
    setSelected([]);
    setFeedback(null);
    setResults([]);
    setError('');
  }

  if (phase === 'results') {
    const correct = results.filter((result) => result.isCorrect).length;
    const percentage = results.length ? Math.round((correct / results.length) * 100) : 0;
    return (
      <section className="page-section guest-preview-section" id="guest-practice">
        <div className="guest-result-card">
          <span className="category-label">Guest practice complete</span>
          <strong className="guest-result-score">{percentage}%</strong>
          <h2>You answered {correct} of {results.length} correctly.</h2>
          <p>Your free preview is not saved. Sign in for complete sessions, progress tracking, and the full premium question bank.</p>
          <div className="guest-result-actions">
            <button onClick={restart} type="button">Try another free set</button>
            <a href="#student-login">Student sign in</a>
            <a className="secondary" href="/pricing">View plans</a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section guest-preview-section" id="guest-practice">
      <div className="guest-preview-heading">
        <div>
          <span className="category-label">No account required</span>
          <h2>Try the question bank</h2>
          <p>Practise with published free questions directly from the CBRUCENCLEX question bank.</p>
        </div>
        <span className="guest-free-badge">Free guest access</span>
      </div>

      {phase === 'setup' ? (
        <form className="guest-preview-builder" onSubmit={startPreview}>
          <label>
            Client need
            <select value={filters.clientNeed} onChange={(event) => updateClientNeed(event.target.value)}>
              <option value="">All client needs</option>
              {clientNeeds.map((value) => <option key={value} value={value}>{clientNeedLabels[value] || value}</option>)}
            </select>
          </label>
          <label>
            Question type
            <select value={filters.questionType} onChange={(event) => setFilters({ ...filters, questionType: event.target.value })}>
              <option value="">All question types</option>
              {questionTypes.map((value) => <option key={value} value={value}>{questionTypeLabels[value] || value}</option>)}
            </select>
          </label>
          <label>
            Questions
            <select value={filters.questionCount} onChange={(event) => setFilters({ ...filters, questionCount: event.target.value })}>
              {[1, 3, 5].filter((count) => count <= availableCount).map((count) => <option key={count} value={count}>{count}</option>)}
            </select>
          </label>
          <button disabled={loading || !availableCount} type="submit">
            <ButtonLoader loading={loading} loadingText="Loading questions...">Start free practice</ButtonLoader>
          </button>
          <small>{loading ? 'Checking free questions...' : `${availableCount} matching free question${availableCount === 1 ? '' : 's'}`}</small>
          {error && <p className="student-error">{error}</p>}
        </form>
      ) : (
        <div className="guest-question-card">
          <div className="guest-question-progress">
            <span>Question {index + 1} of {questions.length}</span>
            <span>{questionTypeLabels[currentQuestion.questionType]}</span>
          </div>
          <div className="guest-progress-track"><span style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>
          <span className="category-label">{clientNeedLabels[currentQuestion.clientNeed]}</span>
          {currentQuestion.stem && <p className="guest-question-stem">{currentQuestion.stem}</p>}
          {currentQuestion.content?.image?.url && (
            <figure className="question-clinical-image">
              <a href={currentQuestion.content.image.url} rel="noreferrer" target="_blank" title="Open full-size image">
                <img alt={currentQuestion.content.image.alt || ''} src={currentQuestion.content.image.url} />
              </a>
              {currentQuestion.content.image.caption && <figcaption>{currentQuestion.content.image.caption}</figcaption>}
            </figure>
          )}
          <h3>{currentQuestion.prompt}</h3>

          {groupedTypes.includes(currentQuestion.questionType) && (
            <div className="ngn-grouped-options">
              {Object.entries(groupedOptions).map(([group, options]) => (
                <label key={group}>
                  <span>{group}</span>
                  <select disabled={Boolean(feedback)} onChange={(event) => setSelected((values) => [...values.filter((id) => !options.some((option) => option.id === id)), event.target.value].filter(Boolean))} value={selected.find((id) => options.some((option) => option.id === id)) || ''}>
                    <option value="">Select...</option>
                    {options.map((option) => <option key={option.id} value={option.id}>{option.text}</option>)}
                  </select>
                </label>
              ))}
            </div>
          )}

          {currentQuestion.questionType === 'MATRIX_GRID' && (
            <MatrixAnswer disabled={Boolean(feedback)} onChange={setSelected} question={currentQuestion} selected={selected} />
          )}

          {currentQuestion.questionType === 'DRAG_DROP' ? (
            <DragDropAnswer disabled={Boolean(feedback)} onChange={setSelected} options={currentQuestion.options} selected={selected} />
          ) : ![...groupedTypes, 'MATRIX_GRID'].includes(currentQuestion.questionType) && (
            <div className="guest-answer-options">
              {currentQuestion.options.map((option) => (
                <button className={selected.includes(option.id) ? 'selected' : ''} disabled={Boolean(feedback)} key={option.id} onClick={() => choose(option.id)} type="button">
                  <span>{option.id.toUpperCase()}</span>{option.text}
                </button>
              ))}
            </div>
          )}

          {feedback && (
            <div className={`answer-feedback ${feedback.isCorrect ? 'correct' : 'review'}`}>
              <strong>{feedback.isCorrect ? 'Correct' : 'Review this answer'}</strong>
              <p>{feedback.rationale}</p>
            </div>
          )}
          {error && <p className="student-error">{error}</p>}
          <div className="guest-question-actions">
            <button className="secondary" onClick={restart} type="button">Exit preview</button>
            {feedback ? (
              <button onClick={continuePreview} type="button">{index === questions.length - 1 ? 'See results' : 'Next question'}</button>
            ) : (
              <button disabled={!selected.length || submitting} onClick={checkAnswer} type="button">
                <ButtonLoader loading={submitting} loadingText="Checking...">Check answer</ButtonLoader>
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
