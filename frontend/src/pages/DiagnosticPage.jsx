import { useState } from 'react'
import DiagnosticIntro from '../components/DiagnosticIntro'
import DiagnosticQuiz from '../components/DiagnosticQuiz'
import DiagnosticResults from '../components/DiagnosticResults'
import PublicLayout from '../components/PublicLayout'
import { diagnosticQuestions } from '../data/diagnosticQuestions'

export default function DiagnosticPage() {
  const [phase, setPhase] = useState('intro')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [preferences, setPreferences] = useState({ examDate: '', dailyMinutes: '30' })
  const currentQuestion = diagnosticQuestions[currentIndex]

  function startAssessment(event) {
    event.preventDefault()
    setPhase('quiz')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function nextQuestion() {
    if (currentIndex === diagnosticQuestions.length - 1) {
      setPhase('results')
    } else {
      setCurrentIndex((index) => index + 1)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function restart() {
    setAnswers({})
    setCurrentIndex(0)
    setPhase('intro')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <PublicLayout>
      <main className="diagnostic-page">
        {phase === 'intro' && <DiagnosticIntro preferences={preferences} onChange={setPreferences} onStart={startAssessment} />}
        {phase === 'quiz' && <DiagnosticQuiz question={currentQuestion} questionNumber={currentIndex + 1} total={diagnosticQuestions.length} selectedAnswer={answers[currentQuestion.id]} onAnswer={(answer) => setAnswers({ ...answers, [currentQuestion.id]: answer })} onNext={nextQuestion} onExit={restart} />}
        {phase === 'results' && <DiagnosticResults answers={answers} preferences={preferences} questions={diagnosticQuestions} onRestart={restart} />}
      </main>
    </PublicLayout>
  )
}
