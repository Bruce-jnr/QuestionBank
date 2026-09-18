export default function DiagnosticIntro({ preferences, onChange, onStart }) {
  return (
    <section className="diagnostic-card diagnostic-intro">
      <div>
        <span className="category-label">Free readiness snapshot</span>
        <h1>Find your NCLEX starting point.</h1>
        <p>
          Answer eight questions covering every Client Needs category. You will
          receive an instant score, subject breakdown, and suggested next steps.
        </p>
      </div>
      <div className="diagnostic-details">
        <div>
          <strong>8</strong>
          <span>Focused questions</span>
        </div>
        <div>
          <strong>8</strong>
          <span>Client Needs categories</span>
        </div>
        <div>
          <strong>1</strong>
          <span>Personalized focus plan</span>
        </div>
      </div>
      <form className="diagnostic-setup" onSubmit={onStart}>
        <label>
          When is your exam? <span>Optional</span>
          <input
            min={new Date().toISOString().split('T')[0]}
            type="date"
            value={preferences.examDate}
            onChange={(event) =>
              onChange({ ...preferences, examDate: event.target.value })
            }
          />
        </label>
        <label>
          Daily study target
          <select
            value={preferences.dailyMinutes}
            onChange={(event) =>
              onChange({ ...preferences, dailyMinutes: event.target.value })
            }
          >
            <option value="20">20 minutes</option>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">60 minutes</option>
          </select>
        </label>
        <button type="submit">Start Free Assessment</button>
      </form>
      <p className="diagnostic-note">
        No account required. This short assessment provides a study snapshot,
        not an official NCLEX readiness prediction.
      </p>
    </section>
  );
}
