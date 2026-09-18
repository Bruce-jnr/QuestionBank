function getReadiness(score) {
  if (score >= 75)
    return [
      'Strong start',
      'You have a solid foundation. Use mixed practice to strengthen consistency and close the remaining gaps.',
    ];
  if (score >= 50)
    return [
      'Building momentum',
      'You have a useful foundation. Focused category practice will help turn partial knowledge into reliable performance.',
    ];
  return [
    'Start with the foundations',
    'Begin with focused study guides, then use Practice Mode to apply each concept with immediate feedback.',
  ];
}

export default function DiagnosticResults({
  answers,
  preferences,
  questions,
  onRestart,
}) {
  const correct = questions.filter(
    (question) => answers[question.id] === question.answer,
  ).length;
  const score = Math.round((correct / questions.length) * 100);
  const [readiness, message] = getReadiness(score);
  const missed = questions.filter(
    (question) => answers[question.id] !== question.answer,
  );
  const focusTopics = (missed.length ? missed : questions.slice(0, 3)).slice(
    0,
    3,
  );
  const examDate = preferences.examDate
    ? new Date(`${preferences.examDate}T12:00:00`)
    : null;
  const daysRemaining = examDate
    ? Math.max(0, Math.ceil((examDate - new Date()) / 86400000))
    : null;

  const storedResult = {
    completedAt: new Date().toISOString(),
    score,
    correct,
    total: questions.length,
    focusCategories: focusTopics.map((question) => question.category),
    preferences,
  };
  localStorage.setItem('nclexDiagnosticResult', JSON.stringify(storedResult));

  return (
    <section className="diagnostic-results" aria-live="polite">
      <div className="diagnostic-result-hero">
        <div className="score-ring" style={{ '--score': `${score * 3.6}deg` }}>
          <div>
            <strong>{score}%</strong>
            <span>
              {correct} of {questions.length}
            </span>
          </div>
        </div>
        <div>
          <span className="category-label">Your readiness snapshot</span>
          <h1>{readiness}</h1>
          <p>{message}</p>
          <div className="result-actions">
            <a href="/question-bank">Continue to Question Bank</a>
            <button onClick={onRestart} type="button">
              Retake Assessment
            </button>
          </div>
        </div>
      </div>

      <div className="diagnostic-result-grid">
        <article className="result-panel">
          <div className="result-panel-heading">
            <div>
              <span className="category-label">Category breakdown</span>
              <h2>Your results</h2>
            </div>
            <span>
              {correct}/{questions.length} correct
            </span>
          </div>
          <div className="category-results">
            {questions.map((question) => {
              const isCorrect = answers[question.id] === question.answer;
              return (
                <div key={question.id}>
                  <span
                    className={
                      isCorrect
                        ? 'result-status correct'
                        : 'result-status review'
                    }
                  >
                    {isCorrect ? 'Correct' : 'Review'}
                  </span>
                  <strong>{question.category}</strong>
                  <div>
                    <i className={isCorrect ? 'correct' : ''} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="result-panel focus-plan">
          <span className="category-label">Suggested plan</span>
          <h2>Your next steps</h2>
          <p>
            Study for <strong>{preferences.dailyMinutes} minutes a day</strong>
            {daysRemaining !== null
              ? ` over the next ${daysRemaining} days`
              : ''}
            .
          </p>
          <ol>
            {focusTopics.map((question) => (
              <li key={question.id}>
                <span>{question.category}</span>
                <small>
                  {answers[question.id] === question.answer
                    ? 'Maintain with mixed practice'
                    : 'Review the guide, then complete 10 practice questions'}
                </small>
              </li>
            ))}
          </ol>
          <a href="/study-guide">Open Study Guides</a>
        </article>
      </div>

      <section className="answer-review">
        <div className="result-panel-heading">
          <div>
            <span className="category-label">Learn from every answer</span>
            <h2>Answer review</h2>
          </div>
        </div>
        {questions.map((question, index) => {
          const isCorrect = answers[question.id] === question.answer;
          return (
            <details key={question.id}>
              <summary>
                <span>{index + 1}</span>
                <strong>{question.category}</strong>
                <small className={isCorrect ? 'correct-text' : 'review-text'}>
                  {isCorrect ? 'Correct' : 'Needs review'}
                </small>
              </summary>
              <div>
                <p>{question.prompt}</p>
                <strong>
                  Correct answer: {question.options[question.answer]}
                </strong>
                <p>{question.rationale}</p>
              </div>
            </details>
          );
        })}
      </section>
      <p className="diagnostic-note">
        This educational assessment is not affiliated with NCSBN and does not
        guarantee an NCLEX result.
      </p>
    </section>
  );
}
