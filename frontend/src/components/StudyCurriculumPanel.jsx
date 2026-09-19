import { useEffect, useState } from 'react';
import ButtonLoader from './ButtonLoader';
import ActionIcon from './ActionIcon';
import {
  createCategory,
  createStudyDomain,
  createStudyModule,
  deleteStudyDomain,
  deleteStudyModule,
  deleteCategory,
  getAdminCategories,
  getStudyDomains,
  updateCategory,
  updateStudyDomain,
  updateStudyModule,
} from '../services/api';

const blankDomain = {
  name: '',
  description: '',
  displayOrder: 0,
  isPublished: true,
};
const blankModule = {
  topicId: '',
  title: '',
  summary: '',
  content: '',
  estimatedMinutes: 15,
  displayOrder: 0,
  isPublished: true,
};
const needs = [
  'MANAGEMENT_OF_CARE',
  'SAFETY_AND_INFECTION_CONTROL',
  'HEALTH_PROMOTION_AND_MAINTENANCE',
  'PSYCHOSOCIAL_INTEGRITY',
  'BASIC_CARE_AND_COMFORT',
  'PHARMACOLOGICAL_AND_PARENTERAL_THERAPIES',
  'REDUCTION_OF_RISK_POTENTIAL',
  'PHYSIOLOGICAL_ADAPTATION',
];

export default function StudyCurriculumPanel() {
  const [domains, setDomains] = useState([]);
  const [topics, setTopics] = useState([]);
  const [editor, setEditor] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const [domainData, topicData] = await Promise.all([
        getStudyDomains(),
        getAdminCategories('STUDY'),
      ]);
      setDomains(domainData.domains || []);
      setTopics(topicData.categories || []);
    } catch (requestError) {
      setError(requestError.message);
    }
  }
  useEffect(() => {
    Promise.all([getStudyDomains(), getAdminCategories('STUDY')])
      .then(([d, t]) => {
        setDomains(d.domains || []);
        setTopics(t.categories || []);
      })
      .catch((requestError) => setError(requestError.message));
  }, []);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editor.kind === 'domain') {
        if (editor.id) await updateStudyDomain(editor.id, editor.form);
        else await createStudyDomain(editor.form);
      } else if (editor.kind === 'module') {
        if (editor.id) await updateStudyModule(editor.id, editor.form);
        else await createStudyModule(editor.form);
      } else {
        const topicPayload = {
          ...editor.form,
          type: 'STUDY',
          domainId: Number(editor.form.domainId),
          distribution: Number(editor.form.distribution),
          displayOrder: Number(editor.form.displayOrder),
        };
        if (editor.id) await updateCategory(editor.id, topicPayload);
        else await createCategory(topicPayload);
      }
      setEditor(null);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(kind, id) {
    if (!window.confirm(`Delete this ${kind}?`)) return;
    try {
      if (kind === 'domain') await deleteStudyDomain(id);
      else if (kind === 'topic') await deleteCategory(id);
      else await deleteStudyModule(id);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <>
      <div className="dashboard-heading">
        <div>
          <h1>Study Curriculum</h1>
          <p>
            Structure the guide into domains, topics, and focused learning
            modules.
          </p>
        </div>
        <div className="question-heading-actions">
          <button
            className="secondary-button"
            onClick={() => setEditor({ kind: 'domain', form: blankDomain })}
            type="button"
          >
            Add Domain
          </button>
          <button
            onClick={() =>
              setEditor({
                kind: 'topic',
                form: {
                  name: '',
                  description: '',
                  clientNeed: '',
                  distribution: 10,
                  domainId: '',
                  displayOrder: 0,
                  isPublished: true,
                },
              })
            }
            type="button"
          >
            Add Topic
          </button>
        </div>
      </div>
      {error && <p className="error-text">{error}</p>}
      <div className="curriculum-board">
        {domains.map((domain) => {
          const domainTopics = topics.filter(
            (topic) => topic.domain_id === domain.id,
          );
          return (
            <section className="curriculum-domain" key={domain.id}>
              <header>
                <div>
                  <span>Domain {domain.display_order}</span>
                  <h2>{domain.name}</h2>
                  <p>{domain.description}</p>
                </div>
                <div className="dashboard-actions">
                  <button
                    aria-label={`Edit ${domain.name}`}
                    className="icon-button"
                    onClick={() =>
                      setEditor({
                        kind: 'domain',
                        id: domain.id,
                        form: {
                          name: domain.name,
                          description: domain.description || '',
                          displayOrder: domain.display_order,
                          isPublished: domain.is_published,
                        },
                      })
                    }
                    type="button"
                    title="Edit domain"
                  >
                    <ActionIcon name="edit" />
                  </button>
                  <button
                    className="delete-action"
                    aria-label={`Delete ${domain.name}`}
                    onClick={() => remove('domain', domain.id)}
                    type="button"
                    title="Delete domain"
                  >
                    <ActionIcon name="delete" />
                  </button>
                </div>
              </header>
              <div className="curriculum-topics">
                {domainTopics.map((topic) => (
                  <article key={topic.id}>
                    <div className="curriculum-topic-heading">
                      <div>
                        <span>{topic.distribution}% distribution</span>
                        <h3>{topic.name}</h3>
                        <p>{topic.description}</p>
                      </div>
                      <button
                        aria-label={`Edit ${topic.name}`}
                        className="icon-button"
                        onClick={() =>
                          setEditor({
                            kind: 'topic',
                            id: topic.id,
                            form: {
                              name: topic.name,
                              description: topic.description || '',
                              clientNeed: topic.client_need,
                              distribution: topic.distribution,
                              domainId: topic.domain_id || '',
                              displayOrder: topic.display_order,
                              isPublished: topic.is_published,
                            },
                          })
                        }
                        type="button"
                        title="Edit topic"
                      >
                        <ActionIcon name="edit" />
                      </button>
                      <button
                        className="delete-action"
                        aria-label={`Delete ${topic.name}`}
                        onClick={() => remove('topic', topic.id)}
                        type="button"
                        title="Delete topic"
                      >
                        <ActionIcon name="delete" />
                      </button>
                    </div>
                    <div className="module-list">
                      {topic.modules?.map((module) => (
                        <div key={module.id}>
                          <div>
                            <strong>{module.title}</strong>
                            <small>
                              {module.estimated_minutes
                                ? `${module.estimated_minutes} min`
                                : 'Self-paced'}
                            </small>
                          </div>
                          <div className="dashboard-actions">
                            <button
                              aria-label={`Edit ${module.title}`}
                              className="icon-button"
                              onClick={() =>
                                setEditor({
                                  kind: 'module',
                                  id: module.id,
                                  form: {
                                    topicId: module.topic_id,
                                    title: module.title,
                                    summary: module.summary || '',
                                    content: module.content || '',
                                    estimatedMinutes:
                                      module.estimated_minutes || '',
                                    displayOrder: module.display_order,
                                    isPublished: module.is_published,
                                  },
                                })
                              }
                              type="button"
                              title="Edit module"
                            >
                              <ActionIcon name="edit" />
                            </button>
                            <button
                              className="delete-action"
                              aria-label={`Delete ${module.title}`}
                              onClick={() => remove('module', module.id)}
                              type="button"
                              title="Delete module"
                            >
                              <ActionIcon name="delete" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      className="add-module-button"
                      onClick={() =>
                        setEditor({
                          kind: 'module',
                          form: { ...blankModule, topicId: topic.id },
                        })
                      }
                      type="button"
                    >
                      + Add module
                    </button>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      {topics.some((topic) => !topic.domain_id) && (
        <section className="unassigned-topics">
          <h2>Unassigned topics</h2>
          {topics
            .filter((topic) => !topic.domain_id)
            .map((topic) => (
              <button
                key={topic.id}
                onClick={() =>
                  setEditor({
                    kind: 'topic',
                    id: topic.id,
                    form: { domainId: '', displayOrder: 0, isPublished: true },
                  })
                }
                type="button"
              >
                {topic.name}
              </button>
            ))}
        </section>
      )}
      {editor && (
        <CurriculumEditor
          domains={domains}
          editor={editor}
          onClose={() => setEditor(null)}
          onSave={save}
          saving={saving}
          setEditor={setEditor}
        />
      )}
    </>
  );
}

function CurriculumEditor({
  domains,
  editor,
  onClose,
  onSave,
  saving,
  setEditor,
}) {
  const field = (name, value) =>
    setEditor({ ...editor, form: { ...editor.form, [name]: value } });
  return (
    <div className="admin-modal-backdrop">
      <form
        className="admin-modal category-editor stacked-form"
        onSubmit={onSave}
      >
        <div className="modal-heading">
          <div>
            <span className="category-label">Study curriculum</span>
            <h2>
              {editor.id ? 'Edit' : 'Add'} {editor.kind}
            </h2>
          </div>
          <button aria-label="Close curriculum editor" className="modal-close-button" disabled={saving} onClick={onClose} title="Close" type="button">
            <ActionIcon name="close" />
          </button>
        </div>
        {editor.kind === 'domain' && (
          <>
            <label>
              Name
              <input
                required
                value={editor.form.name}
                onChange={(e) => field('name', e.target.value)}
              />
            </label>
            <label>
              Description
              <textarea
                value={editor.form.description}
                onChange={(e) => field('description', e.target.value)}
              />
            </label>
          </>
        )}
        {editor.kind === 'topic' && (
          <>
            <label>
              Topic name
              <input
                required
                value={editor.form.name || ''}
                onChange={(e) => field('name', e.target.value)}
              />
            </label>
            <label>
              Description
              <textarea
                value={editor.form.description || ''}
                onChange={(e) => field('description', e.target.value)}
              />
            </label>
            <label>
              Domain
              <select
                required
                value={editor.form.domainId}
                onChange={(e) => field('domainId', e.target.value)}
              >
                <option value="">Select domain</option>
                {domains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Client Need
              <select
                required
                value={editor.form.clientNeed || ''}
                onChange={(e) => field('clientNeed', e.target.value)}
              >
                <option value="">Select mapping</option>
                {needs.map((need) => (
                  <option key={need}>{need.replaceAll('_', ' ')}</option>
                ))}
              </select>
            </label>
            <label>
              Distribution %
              <input
                max="100"
                min="0"
                required
                type="number"
                value={editor.form.distribution ?? ''}
                onChange={(e) => field('distribution', e.target.value)}
              />
            </label>
          </>
        )}
        {editor.kind === 'module' && (
          <>
            <label>
              Module title
              <input
                required
                value={editor.form.title}
                onChange={(e) => field('title', e.target.value)}
              />
            </label>
            <label>
              Summary
              <textarea
                value={editor.form.summary}
                onChange={(e) => field('summary', e.target.value)}
              />
            </label>
            <label>
              Lesson content
              <textarea
                className="module-content-editor"
                value={editor.form.content}
                onChange={(e) => field('content', e.target.value)}
              />
            </label>
            <label>
              Estimated minutes
              <input
                min="1"
                type="number"
                value={editor.form.estimatedMinutes}
                onChange={(e) => field('estimatedMinutes', e.target.value)}
              />
            </label>
          </>
        )}
        <label>
          Display order
          <input
            min="0"
            type="number"
            value={editor.form.displayOrder}
            onChange={(e) => field('displayOrder', e.target.value)}
          />
        </label>
        <label className="post-featured-toggle">
          <input
            checked={editor.form.isPublished}
            onChange={(e) => field('isPublished', e.target.checked)}
            type="checkbox"
          />{' '}
          Published
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
          <button aria-busy={saving} disabled={saving} type="submit">
            <ButtonLoader loading={saving} loadingText="Saving...">
              Save
            </ButtonLoader>
          </button>
        </div>
      </form>
    </div>
  );
}
