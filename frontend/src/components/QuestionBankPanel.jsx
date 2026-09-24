import { useEffect, useRef, useState } from 'react';
import ButtonLoader from './ButtonLoader';
import ActionIcon from './ActionIcon';
import {
  archiveQuestion,
  createQuestion,
  getQuestions,
  importQuestions,
  uploadQuestionImage,
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
  ['EXTENDED_MULTIPLE_RESPONSE', 'NGN extended multiple response'],
  ['DRAG_DROP', 'NGN drag and drop'],
  ['HOT_SPOT', 'NGN enhanced hot spot'],
  ['MATRIX_GRID', 'Matrix grid'],
  ['CLOZE_DROP_DOWN', 'Cloze drop-down'],
  ['CASE_STUDY', 'NGN case study item'],
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
  content: {},
  rationale: '',
  clientNeed: 'MANAGEMENT_OF_CARE',
  questionType: 'MULTIPLE_CHOICE',
  scoringMethod: 'ZERO_ONE',
  difficulty: 0.5,
  status: 'DRAFT',
  accessTier: 'FREE',
};

const emptyFilters = { status: '', accessTier: '', questionType: '', clientNeed: '' };

function apiQuestion(question) {
  return {
    externalId: question.external_id || '',
    stem: question.stem,
    prompt: question.prompt,
    options: question.options,
    correctAnswers: question.correct_answers,
    content: question.content || {},
    rationale: question.rationale,
    clientNeed: question.client_need,
    questionType: question.question_type,
    scoringMethod: question.scoring_method,
    difficulty: question.difficulty,
    status: question.status,
    accessTier: question.access_tier || 'FREE',
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
    content: question.content || {},
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
    accessTier: question.accessTier || 'FREE',
  };
  return normalized;
}

export default function QuestionBankPanel() {
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState('');
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [archivingId, setArchivingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyQuestion);
  const fileInput = useRef(null);

  async function loadQuestions(
    page = 1,
    searchTerm = appliedSearch,
    activeFilters = appliedFilters,
    action = '',
  ) {
    setLoading(true);
    setLoadingAction(action);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (searchTerm) params.set('search', searchTerm);
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
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
      setLoadingAction('');
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
    setAppliedFilters(filters);
    loadQuestions(1, term, filters, 'search');
  }

  function clearFilters() {
    setSearch('');
    setAppliedSearch('');
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    loadQuestions(1, '', emptyFilters, 'search');
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
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  }

  async function importFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setNotice('');
    setImporting(true);
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
      const importedMessage = `${result.imported} question${result.imported === 1 ? '' : 's'} imported`;
      const skippedMessage = result.skipped
        ? `; ${result.skipped} duplicate${result.skipped === 1 ? '' : 's'} skipped`
        : '';
      setNotice(`${importedMessage}${skippedMessage}.`);
      setAppliedSearch('');
      setSearch('');
      setFilters(emptyFilters);
      setAppliedFilters(emptyFilters);
      await loadQuestions(1, '', emptyFilters);
    } catch (importError) {
      setError(importError.message || 'Unable to import questions.');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  }

  async function archive(question) {
    if (!window.confirm('Archive this question?')) return;
    setArchivingId(question.id);
    try {
      await archiveQuestion(question.id);
      const targetPage =
        questions.length === 1 && pagination.page > 1
          ? pagination.page - 1
          : pagination.page;
      await loadQuestions(targetPage);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setArchivingId(null);
    }
  }

  function downloadTemplate() {
    const header =
      'externalId,stem,prompt,options,correctAnswers,rationale,clientNeed,questionType,scoringMethod,difficulty,status,accessTier\n';
    const example =
      'sample-001,"A nurse is caring for a client.","What should the nurse do first?","a:Assess the client|b:Call the provider",a,"Assessment comes before intervention.",MANAGEMENT_OF_CARE,MULTIPLE_CHOICE,ZERO_ONE,0.5,DRAFT,FREE\n';
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
            aria-busy={importing}
            className="secondary-button"
            disabled={importing}
            onClick={() => fileInput.current?.click()}
            type="button"
          >
            <ButtonLoader loading={importing} loadingText="Importing...">
              Upload JSON or CSV
            </ButtonLoader>
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
        Duplicate external IDs or matching stems and prompts are skipped.
      </p>
      <section className="dashboard-panel">
        <form className="question-filter-bar" onSubmit={submitSearch}>
          <label className="question-filter-search">
            <span>Search questions</span>
            <input onChange={(event) => setSearch(event.target.value)} placeholder="ID, stem, or prompt..." value={search} />
          </label>
          <label><span>Status</span><select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">All statuses</option><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></label>
          <label><span>Access</span><select value={filters.accessTier} onChange={(event) => setFilters({ ...filters, accessTier: event.target.value })}><option value="">All access</option><option value="FREE">Free</option><option value="PREMIUM">Premium</option></select></label>
          <label><span>Question type</span><select value={filters.questionType} onChange={(event) => setFilters({ ...filters, questionType: event.target.value })}><option value="">All types</option>{questionTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Client need</span><select value={filters.clientNeed} onChange={(event) => setFilters({ ...filters, clientNeed: event.target.value })}><option value="">All client needs</option>{clientNeeds.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <div className="question-filter-actions">
            <button aria-busy={loadingAction === 'search'} disabled={loading} type="submit"><ButtonLoader loading={loadingAction === 'search'} loadingText="Filtering...">Apply filters</ButtonLoader></button>
            <button className="secondary-button" disabled={loading} onClick={clearFilters} type="button">Clear</button>
          </div>
        </form>
        <div className="dashboard-table-wrap">
          <table className="dashboard-table question-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Category</th>
                <th>Type</th>
                <th>Status</th>
                <th>Access</th>
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
                  <td><span className={`access-tier ${question.access_tier === 'PREMIUM' ? 'premium' : 'free'}`}>{question.access_tier === 'PREMIUM' && <ActionIcon name="diamond" size={12} />}{question.access_tier === 'PREMIUM' ? 'Premium' : 'Free'}</span></td>
                  <td>
                    <div className="dashboard-actions">
                      <button
                        aria-label="Edit question"
                        className="icon-button"
                        onClick={() => openEditor(question)}
                        title="Edit question"
                        type="button"
                      >
                        <ActionIcon name="edit" />
                      </button>
                      <button
                        className="delete-action"
                        aria-busy={archivingId === question.id}
                        disabled={
                          question.status === 'ARCHIVED' || archivingId !== null
                        }
                        onClick={() => archive(question)}
                        aria-label="Archive question"
                        title="Archive question"
                        type="button"
                      >
                        <ButtonLoader
                          loading={archivingId === question.id}
                          loadingText="Archiving..."
                        >
                          <ActionIcon name="archive" />
                        </ButtonLoader>
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
            aria-busy={loadingAction === 'previous'}
            disabled={loading || pagination.page <= 1}
            onClick={() =>
              loadQuestions(pagination.page - 1, appliedSearch, appliedFilters, 'previous')
            }
            type="button"
          >
            <ButtonLoader
              loading={loadingAction === 'previous'}
              loadingText="Loading..."
            >
              Previous
            </ButtonLoader>
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages} ·{' '}
            {pagination.total} questions
          </span>
          <button
            aria-busy={loadingAction === 'next'}
            disabled={loading || pagination.page >= pagination.totalPages}
            onClick={() =>
              loadQuestions(pagination.page + 1, appliedSearch, appliedFilters, 'next')
            }
            type="button"
          >
            <ButtonLoader
              loading={loadingAction === 'next'}
              loadingText="Loading..."
            >
              Next
            </ButtonLoader>
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
          saving={saving}
          setForm={setForm}
        />
      )}
    </>
  );
}

function QuestionEditor({ editing, form, onClose, onSave, saving, setForm }) {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const setField = (field, value) => setForm({ ...form, [field]: value });
  function setOption(index, field, value) {
    setField(
      'options',
      form.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, [field]: value } : option,
      ),
    );
  }

  async function handleQuestionImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setImageError('');
    try {
      const uploaded = await uploadQuestionImage(file);
      setForm((current) => ({
        ...current,
        content: {
          ...(current.content || {}),
          image: {
            key: uploaded.key,
            url: uploaded.url,
            alt: current.content?.image?.alt || '',
            caption: current.content?.image?.caption || '',
          },
        },
      }));
    } catch (uploadError) {
      setImageError(uploadError.message);
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  }

  function updateImage(field, value) {
    setForm((current) => ({
      ...current,
      content: {
        ...(current.content || {}),
        image: { ...(current.content?.image || {}), [field]: value },
      },
    }));
  }

  function removeImage() {
    setForm((current) => {
      const content = { ...(current.content || {}) };
      delete content.image;
      return { ...current, content };
    });
    setImageError('');
  }
  return (
    <div className="admin-modal-backdrop">
      <form className="admin-modal question-editor" onSubmit={onSave}>
        <div className="modal-heading">
          <div>
            <span className="category-label">Question editor</span>
            <h2>{editing ? 'Edit Question' : 'Add Question'}</h2>
          </div>
          <button aria-label="Close question editor" className="modal-close-button" disabled={saving} onClick={onClose} title="Close" type="button">
            <ActionIcon name="close" />
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
          <fieldset className="question-image-field full-field">
            <legend>Question image <span>Optional</span></legend>
            {form.content?.image?.url ? (
              <div className="question-image-editor-preview">
                <img alt={form.content.image.alt || 'Question preview'} src={form.content.image.url} />
                <div>
                  <label>
                    Alternative text
                    <input
                      onChange={(event) => updateImage('alt', event.target.value)}
                      placeholder="Describe the clinical information shown"
                      required
                      value={form.content.image.alt || ''}
                    />
                  </label>
                  <label>
                    Caption
                    <input
                      onChange={(event) => updateImage('caption', event.target.value)}
                      placeholder="Optional caption shown below the image"
                      value={form.content.image.caption || ''}
                    />
                  </label>
                  <button aria-label="Remove question image" className="modal-icon-delete question-image-remove" disabled={saving || uploadingImage} onClick={removeImage} title="Remove image" type="button">
                    <ActionIcon name="delete" size={17} />
                  </button>
                </div>
              </div>
            ) : (
              <p>Upload an ECG, clinical photograph, diagram, chart, or other image the student must analyse.</p>
            )}
            <label className="question-image-upload">
              <input accept="image/jpeg,image/png,image/gif,image/webp" disabled={saving || uploadingImage} onChange={handleQuestionImage} type="file" />
              <span className="secondary-button">
                <ButtonLoader loading={uploadingImage} loadingText="Uploading to AWS...">
                  {form.content?.image?.url ? 'Replace image' : 'Upload question image'}
                </ButtonLoader>
              </span>
            </label>
            <small>JPEG, PNG, GIF, or WebP. Maximum size 5 MB.</small>
            {imageError && <p className="error-text">{imageError}</p>}
          </fieldset>
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
            Access
            <select
              value={form.accessTier}
              onChange={(event) => setField('accessTier', event.target.value)}
            >
              <option value="FREE">Free</option>
              <option value="PREMIUM">Premium</option>
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
              {['CLOZE_DROP_DOWN', 'MATRIX_GRID'].includes(
                form.questionType,
              ) && (
                <input
                  aria-label={`Option ${index + 1} response group`}
                  onChange={(event) =>
                    setOption(index, 'group', event.target.value)
                  }
                  placeholder="Row or blank label"
                  required
                  value={option.group || ''}
                />
              )}
              <button
                aria-label={`Remove option ${index + 1}`}
                className="icon-button delete-action"
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
                title="Remove option"
              >
                <ActionIcon name="delete" />
              </button>
            </div>
          ))}
          <button
            className="modal-inline-button"
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
          <button
            className="secondary-button"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button className="modal-primary-button" aria-busy={saving} disabled={saving} type="submit">
            <ButtonLoader loading={saving} loadingText="Saving...">
              {editing ? 'Save Changes' : 'Create Question'}
            </ButtonLoader>
          </button>
        </div>
      </form>
    </div>
  );
}
