import { useEffect, useRef, useState } from 'react';
import {
  archiveQuestion,
  createQuestion,
  getQuestions,
  importQuestions,
  updateQuestion,
} from '../services/api';

const clientNeeds = [
  ['MANAGEMENT_OF_CARE', 'Management of Care'],
  ['SAFETY_AND_INFECTION_CONTROL', 'Safety and Infection Control'],
  ['HEALTH_PROMOTION_AND_MAINTENANCE', 'Health Promotion and Maintenance'],
  ['PSYCHOSOCIAL_INTEGRITY', 'Psychosocial Integrity'],
  ['BASIC_CARE_AND_COMFORT', 'Basic Care and Comfort'],
  [
    'PHARMACOLOGICAL_AND_PARENTERAL_THERAPIES',
    'Pharmacological and Parenteral Therapies',
  ],
  ['REDUCTION_OF_RISK_POTENTIAL', 'Reduction of Risk Potential'],
  ['PHYSIOLOGICAL_ADAPTATION', 'Physiological Adaptation'],
];

const questionTypes = [
  ['MULTIPLE_CHOICE', 'Multiple choice'],
  ['MULTIPLE_RESPONSE', 'Multiple response'],
  ['MATRIX_GRID', 'Matrix grid'],
  ['CLOZE_DROP_DOWN', 'Cloze drop-down'],
  ['RATIONALE_PAIRED', 'Rationale paired'],
  ['BOW_TIE', 'Bow tie'],
];

const emptyQuestion = {
  externalId: '',
  stem: '',
  prompt: '',
  options: [
    { id: 'a', text: '' },
    { id: 'b', text: '' },
  ],
  correctAnswers: ['a'],
  rationale: '',
  clientNeed: 'MANAGEMENT_OF_CARE',
  questionType: 'MULTIPLE_CHOICE',
  scoringMethod: 'ZERO_ONE',
  difficulty: 0.5,
  status: 'DRAFT',
};

function apiQuestion(question) {
  return {
    externalId: question.external_id || '',
    stem: question.stem,
    prompt: question.prompt,
    options: question.options,
    correctAnswers: question.correct_answers,
    rationale: question.rationale,
    clientNeed: question.client_need,
    questionType: question.question_type,
    scoringMethod: question.scoring_method,
    difficulty: question.difficulty,
    status: question.status,
  };
}

function parseCsv(text) {
  const rows = [];
  let row = [],
    field = '',
    quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field);
      field = '';
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
    } else field += char;
  }
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  if (rows.length < 2)
    throw new Error('CSV must contain a header and at least one question.');
  const headers = rows[0].map((value) => value.trim());
  return rows
    .slice(1)
    .map((values) =>
      Object.fromEntries(
        headers.map((header, i) => [header, values[i]?.trim() || '']),
      ),
    );
}

function parseOptions(value) {
  if (value.trim().startsWith('[')) return JSON.parse(value);
  return value
    .split('|')
    .filter(Boolean)
    .map((option) => {
      const divider = option.indexOf(':');
      if (divider < 1)
        throw new Error('CSV options must use id:text pairs separated by |.');
      return {
        id: option.slice(0, divider).trim(),
        text: option.slice(divider + 1).trim(),
      };
    });
}

function normalizeImport(question) {
  const normalized = {
    externalId: question.externalId || null,
    stem: question.stem,
    prompt: question.prompt,
    options: Array.isArray(question.options)
      ? question.options
      : parseOptions(question.options || ''),
    correctAnswers: Array.isArray(question.correctAnswers)
      ? question.correctAnswers
      : (question.correctAnswers || '')
          .split('|')
          .map((value) => value.trim())
          .filter(Boolean),
    rationale: question.rationale,
    clientNeed: question.clientNeed,
    questionType: question.questionType || 'MULTIPLE_CHOICE',
    scoringMethod: question.scoringMethod || 'ZERO_ONE',
    difficulty: Number(question.difficulty || 0.5),
    status: question.status || 'DRAFT',
  };
  return normalized;
}

export default function QuestionBankPanel() {
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyQuestion);
  const fileInput = useRef(null);

  async function loadQuestions(page = 1, searchTerm = appliedSearch) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (searchTerm) params.set('search', searchTerm);
    try {
      const data = await getQuestions(params.toString());
      setQuestions(data.questions || []);
      setPagination(
        data.pagination || {
          page,
          total: data.questions?.length || 0,
          totalPages: 1,
        },
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getQuestions('page=1&limit=20')
      .then((data) => {
        setQuestions(data.questions || []);
        setPagination(
          data.pagination || {
            page: 1,
            total: data.questions?.length || 0,
            totalPages: 1,
          },
        );
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  function submitSearch(event) {
    event.preventDefault();
    const term = search.trim();
    setAppliedSearch(term);
    loadQuestions(1, term);
  }

  function openEditor(question = null) {
    setEditing(question);
    setForm(
      question
        ? apiQuestion(question)
        : {
            ...emptyQuestion,
            options: emptyQuestion.options.map((option) => ({ ...option })),
          },
    );
    setError('');
    setNotice('');
  }

  async function saveQuestion(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    try {
      const payload = {
        ...form,
        externalId: form.externalId || null,
        difficulty: Number(form.difficulty),
      };
      if (editing) await updateQuestion(editing.id, payload);
      else await createQuestion(payload);
      setNotice(editing ? 'Question updated.' : 'Question created.');
      setEditing(null);
      setForm(emptyQuestion);
      await loadQuestions(pagination.page);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function importFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setNotice('');
    try {
      const text = await file.text();
      const raw = file.name.toLowerCase().endsWith('.json')
        ? JSON.parse(text)
        : parseCsv(text);
      const importedRows = Array.isArray(raw) ? raw : raw.questions;
      if (!Array.isArray(importedRows) || !importedRows.length)
        throw new Error('The file does not contain any questions.');
      const questionsToImport = importedRows.map(normalizeImport);
      const result = await importQuestions(questionsToImport);
      setNotice(
        `${result.imported} question${result.imported === 1 ? '' : 's'} imported.`,
      );
      setAppliedSearch('');
      setSearch('');
      await loadQuestions(1, '');
    } catch (importError) {
      setError(importError.message || 'Unable to import questions.');
    } finally {
      event.target.value = '';
    }
  }

  async function archive(question) {
    if (!window.confirm('Archive this question?')) return;
    try {
      await archiveQuestion(question.id);
      const targetPage =
        questions.length === 1 && pagination.page > 1
          ? pagination.page - 1
          : pagination.page;
      await loadQuestions(targetPage);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function downloadTemplate() {
    const header =
      'externalId,stem,prompt,options,correctAnswers,rationale,clientNeed,questionType,scoringMethod,difficulty,status\n';
    const example =
      'sample-001,"A nurse is caring for a client.","What should the nurse do first?","a:Assess the client|b:Call the provider",a,"Assessment comes before intervention.",MANAGEMENT_OF_CARE,MULTIPLE_CHOICE,ZERO_ONE,0.5,DRAFT\n';
    const link = document.createElement('a');
    link.href = URL.createObjectURL(
      new Blob([header + example], { type: 'text/csv' }),
    );
    link.download = 'question-import-template.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <>
      <div className="dashboard-heading question-heading">
        <div>
          <h1>Question Bank</h1>
          <p>Create, publish, edit, or import NCLEX questions.</p>
        </div>
        <div className="question-heading-actions">
          <input
            accept=".json,.csv,application/json,text/csv"
            hidden
            onChange={importFile}
            ref={fileInput}
            type="file"
          />
          <button
            className="secondary-button"
            onClick={downloadTemplate}
            type="button"
          >
            CSV Template
          </button>
          <button
            className="secondary-button"
            onClick={() => fileInput.current?.click()}
            type="button"
          >
            Upload JSON or CSV
          </button>
          <button onClick={() => openEditor()} type="button">
            Add Question
          </button>
        </div>
      </div>
      {error && <p className="error-text">{error}</p>}
      {notice && <p className="success-text">{notice}</p>}
      <p className="question-import-note">
        Imports support a JSON array (or a <code>questions</code> array) and CSV
        files based on the downloadable template. Separate CSV options with{' '}
        <code>|</code> and option IDs from text with <code>:</code>.
      </p>
      <section className="dashboard-panel">
        <form
          className="dashboard-search question-search"
          onSubmit={submitSearch}
        >
          <span>Search</span>
          <input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search questions..."
            value={search}
          />
          <button disabled={loading} type="submit">
            Search
          </button>
        </form>
        <div className="dashboard-table-wrap">
          <table className="dashboard-table question-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Category</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question) => (
                <tr key={question.id}>
                  <td>
                    <strong>{question.stem}</strong>
                    <small>{question.prompt}</small>
                  </td>
                  <td>
                    {clientNeeds.find(
                      ([value]) => value === question.client_need,
                    )?.[1] || question.client_need}
                  </td>
                  <td>{question.question_type.replaceAll('_', ' ')}</td>
                  <td>
                    <span className={`status ${question.status.toLowerCase()}`}>
                      {question.status}
                    </span>
                  </td>
                  <td>
                    <div className="dashboard-actions">
                      <button
                        onClick={() => openEditor(question)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="delete-action"
                        disabled={question.status === 'ARCHIVED'}
                        onClick={() => archive(question)}
                        type="button"
                      >
                        Archive
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading ? (
            <p className="empty-state">Loading questions...</p>
          ) : !questions.length ? (
            <p className="empty-state">No questions found.</p>
          ) : null}
        </div>
        <div className="dashboard-pagination question-pagination">
          <button
            disabled={loading || pagination.page <= 1}
            onClick={() => loadQuestions(pagination.page - 1)}
            type="button"
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages} ·{' '}
            {pagination.total} questions
          </span>
          <button
            disabled={loading || pagination.page >= pagination.totalPages}
            onClick={() => loadQuestions(pagination.page + 1)}
            type="button"
          >
            Next
          </button>
        </div>
      </section>
      {(editing !== null || form !== emptyQuestion) && (
        <QuestionEditor
          editing={editing}
          form={form}
          onClose={() => {
            setEditing(null);
            setForm(emptyQuestion);
          }}
          onSave={saveQuestion}
          setForm={setForm}
        />
      )}
    </>
  );
}

function QuestionEditor({ editing, form, onClose, onSave, setForm }) {
  const setField = (field, value) => setForm({ ...form, [field]: value });
  function setOption(index, field, value) {
    setField(
      'options',
      form.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, [field]: value } : option,
      ),
    );
  }
  return (
    <div className="admin-modal-backdrop">
      <form className="admin-modal question-editor" onSubmit={onSave}>
        <div className="modal-heading">
          <div>
            <span className="category-label">Question editor</span>
            <h2>{editing ? 'Edit Question' : 'Add Question'}</h2>
          </div>
          <button onClick={onClose} type="button">
            Close
          </button>
        </div>
        <div className="question-form-grid">
          <label>
            External ID
            <input
              value={form.externalId}
              onChange={(event) => setField('externalId', event.target.value)}
              placeholder="Optional unique ID"
            />
          </label>
          <label>
            Status
            <select
              value={form.status}
              onChange={(event) => setField('status', event.target.value)}
            >
              <option>DRAFT</option>
              <option>PUBLISHED</option>
              <option>ARCHIVED</option>
            </select>
          </label>
          <label className="full-field">
            Scenario / stem
            <textarea
              required
              value={form.stem}
              onChange={(event) => setField('stem', event.target.value)}
            />
          </label>
          <label className="full-field">
            Question prompt
            <textarea
              required
              value={form.prompt}
              onChange={(event) => setField('prompt', event.target.value)}
            />
          </label>
          <label>
            Client need
            <select
              value={form.clientNeed}
              onChange={(event) => setField('clientNeed', event.target.value)}
            >
              {clientNeeds.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Question type
            <select
              value={form.questionType}
              onChange={(event) => setField('questionType', event.target.value)}
            >
              {questionTypes.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Scoring
            <select
              value={form.scoringMethod}
              onChange={(event) =>
                setField('scoringMethod', event.target.value)
              }
            >
              <option value="ZERO_ONE">Zero/one</option>
              <option value="PLUS_MINUS">Plus/minus</option>
              <option value="RATIONALE">Rationale</option>
            </select>
          </label>
          <label>
            Difficulty (0–1)
            <input
              max="1"
              min="0"
              onChange={(event) => setField('difficulty', event.target.value)}
              required
              step="0.1"
              type="number"
              value={form.difficulty}
            />
          </label>
        </div>
        <fieldset className="question-options">
          <legend>Answer options</legend>
          {form.options.map((option, index) => (
            <div key={index}>
              <input
                aria-label={`Option ${index + 1} ID`}
                onChange={(event) => setOption(index, 'id', event.target.value)}
                required
                value={option.id}
              />
              <input
                aria-label={`Option ${index + 1} text`}
                onChange={(event) =>
                  setOption(index, 'text', event.target.value)
                }
                required
                value={option.text}
              />
              <button
                disabled={form.options.length <= 2}
                onClick={() =>
                  setField(
                    'options',
                    form.options.filter(
                      (_, optionIndex) => optionIndex !== index,
                    ),
                  )
                }
                type="button"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              setField('options', [
                ...form.options,
                { id: String.fromCharCode(97 + form.options.length), text: '' },
              ])
            }
            type="button"
          >
            Add option
          </button>
        </fieldset>
        <label>
          Correct answer IDs
          <input
            required
            value={form.correctAnswers.join(', ')}
            onChange={(event) =>
              setField(
                'correctAnswers',
                event.target.value
                  .split(',')
                  .map((value) => value.trim())
                  .filter(Boolean),
              )
            }
            placeholder="a or a, c"
          />
        </label>
        <label>
          Rationale
          <textarea
            required
            value={form.rationale}
            onChange={(event) => setField('rationale', event.target.value)}
          />
        </label>
        <div className="question-editor-actions">
          <button className="secondary-button" onClick={onClose} type="button">
            Cancel
          </button>
          <button type="submit">
            {editing ? 'Save Changes' : 'Create Question'}
          </button>
        </div>
      </form>
    </div>
  );
}
