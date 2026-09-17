export default function DiagnosticQuiz({ question, questionNumber, total, selectedAnswer, onAnswer, onNext, onExit }) {
  const progress = (questionNumber / total) * 100

  return (
    <section className="diagnostic-card diagnostic-quiz" aria-live="polite">
      <div className="diagnostic-progress-copy">
        <button className="text-button" onClick={onExit} type="button">Exit assessment</button>
        <span>Question {questionNumber} of {total}</span>
      </div>
      <div className="diagnostic-progress" aria-label={`${Math.round(progress)}% complete`}><span style={{ width: `${progress}%` }} /></div>
      <div className="diagnostic-question-heading">
        <span className="category-label">{question.category}</span>
        <h1>{question.prompt}</h1>
        <p>Select the best answer.</p>
      </div>
      <div className="diagnostic-options">
        {question.options.map((option, index) => (
          <button className={selectedAnswer === index ? 'selected' : ''} key={option} onClick={() => onAnswer(index)} type="button">
            <span>{String.fromCharCode(65 + index)}</span>
            {option}
          </button>
        ))}
      </div>
      <div className="diagnostic-navigation">
        <span>{selectedAnswer === undefined ? 'Choose an answer to continue' : 'Answer selected'}</span>
        <button disabled={selectedAnswer === undefined} onClick={onNext} type="button">{questionNumber === total ? 'View My Results' : 'Next Question'}</button>
      </div>
    </section>
  )
}
