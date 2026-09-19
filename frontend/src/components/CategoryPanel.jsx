import { useEffect, useState } from 'react';
import {
  createCategory,
  deleteCategory,
  getAdminCategories,
  updateCategory,
} from '../services/api';
import ButtonLoader from './ButtonLoader';
import ActionIcon from './ActionIcon';

const clientNeeds = [
  ['', 'Select a Client Need'],
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

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  distribution: '',
  clientNeed: '',
  type: 'BLOG',
};

export default function CategoryPanel({ categoryType }) {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  async function loadCategories() {
    try {
      const data = await getAdminCategories(categoryType);
      setCategories(data.categories || []);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  useEffect(() => {
    getAdminCategories(categoryType)
      .then((data) => setCategories(data.categories || []))
      .catch((requestError) => setError(requestError.message));
  }, [categoryType]);

  function openEditor(category = null) {
    setEditing(category);
    setForm(
      category
        ? {
            name: category.name,
            slug: category.slug || '',
            description: category.description || '',
            distribution: category.distribution ?? '',
            clientNeed: category.client_need || '',
            type: category.type,
          }
        : { ...emptyForm, type: categoryType },
    );
    setError('');
    setShowEditor(true);
  }

  async function save(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      ...form,
      distribution:
        form.type === 'STUDY' && form.distribution !== ''
          ? Number(form.distribution)
          : null,
      clientNeed: form.type === 'STUDY' ? form.clientNeed || null : null,
    };
    try {
      if (editing) await updateCategory(editing.id, payload);
      else await createCategory(payload);
      setShowEditor(false);
      setEditing(null);
      setForm(emptyForm);
      await loadCategories();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(category) {
    if (!window.confirm(`Delete "${category.name}"?`)) return;
    setDeletingId(category.id);
    try {
      await deleteCategory(category.id);
      await loadCategories();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="dashboard-heading">
        <div>
          <h1>
            {categoryType === 'BLOG' ? 'Blog Categories' : 'Study Topics'}
          </h1>
          <p>
            {categoryType === 'BLOG'
              ? 'Organize articles published on the blog.'
              : 'Manage NCLEX topics, distributions, and question mappings.'}
          </p>
        </div>
        <button onClick={() => openEditor()} type="button">
          Add {categoryType === 'BLOG' ? 'Blog Category' : 'Study Topic'}
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
      <section className="dashboard-panel">
        <div className="dashboard-table-wrap">
          <table className="dashboard-table category-table">
            <thead>
              <tr>
                <th>Name</th>
                {categoryType === 'STUDY' && (
                  <>
                    <th>Distribution</th>
                    <th>Client Need</th>
                  </>
                )}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>
                    <strong>{category.name}</strong>
                    <small>{category.description || 'No description'}</small>
                  </td>
                  {categoryType === 'STUDY' && (
                    <>
                      <td>
                        {category.distribution == null
                          ? '—'
                          : `${category.distribution}%`}
                      </td>
                      <td>
                        {category.client_need?.replaceAll('_', ' ') ||
                          'Not mapped'}
                      </td>
                    </>
                  )}
                  <td>
                    <div className="dashboard-actions">
                      <button
                        aria-label={`Edit ${category.name}`}
                        className="icon-button"
                        onClick={() => openEditor(category)}
                        title="Edit"
                        type="button"
                      >
                        <ActionIcon name="edit" />
                      </button>
                      <button
                        aria-busy={deletingId === category.id}
                        className="delete-action"
                        disabled={deletingId !== null}
                        onClick={() => remove(category)}
                        type="button"
                        aria-label={`Delete ${category.name}`}
                        title="Delete"
                      >
                        <ButtonLoader
                          loading={deletingId === category.id}
                          loadingText="Deleting..."
                        >
                          <ActionIcon name="delete" />
                        </ButtonLoader>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!categories.length && (
            <p className="empty-state">
              No {categoryType === 'BLOG' ? 'blog categories' : 'study topics'}{' '}
              found.
            </p>
          )}
        </div>
      </section>
      {showEditor && (
        <div className="admin-modal-backdrop">
          <form
            className="admin-modal category-editor stacked-form"
            onSubmit={save}
          >
            <div className="modal-heading">
              <div>
                <span className="category-label">
                  {form.type === 'BLOG' ? 'Blog category' : 'Study topic'}
                </span>
                <h2>
                  {editing ? 'Edit' : 'Add'}{' '}
                  {form.type === 'BLOG' ? 'Category' : 'Study Topic'}
                </h2>
              </div>
              <button
                aria-label="Close editor"
                className="modal-close-button"
                disabled={saving}
                onClick={() => setShowEditor(false)}
                title="Close"
                type="button"
              >
                <ActionIcon name="close" />
              </button>
            </div>
            <label>
              Name
              <input
                required
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
              />
            </label>
            <label>
              Slug
              <input
                value={form.slug}
                onChange={(event) =>
                  setForm({ ...form, slug: event.target.value })
                }
                placeholder="Generated automatically when blank"
              />
            </label>
            <label>
              Description
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
              />
            </label>
            {form.type === 'STUDY' && (
              <>
                <label>
                  NCLEX distribution percentage
                  <input
                    max="100"
                    min="0"
                    required
                    type="number"
                    value={form.distribution}
                    onChange={(event) =>
                      setForm({ ...form, distribution: event.target.value })
                    }
                  />
                </label>
                <label>
                  Question-bank Client Need
                  <select
                    required
                    value={form.clientNeed}
                    onChange={(event) =>
                      setForm({ ...form, clientNeed: event.target.value })
                    }
                  >
                    {clientNeeds.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <div className="question-editor-actions">
              <button
                className="secondary-button"
                disabled={saving}
                onClick={() => setShowEditor(false)}
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
      )}
    </>
  );
}
