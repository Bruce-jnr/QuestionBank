import { useEffect, useState } from 'react';
import LogoMark from '../components/LogoMark';
import CategoryPanel from '../components/CategoryPanel';
import QuestionBankPanel from '../components/QuestionBankPanel';
import {
  createPost,
  createStudent as createStudentAccount,
  deletePost,
  deleteStudent,
  getAdminPosts,
  getAdminCategories,
  getStudents,
  resetStudentPassword,
  uploadImage,
  verifySession,
} from '../services/api';
import { formatDate } from '../utils/formatDate';

export default function DashboardPage() {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activePanel, setActivePanel] = useState('posts');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  async function loadPosts() {
    try {
      await verifySession();
      const data = await getAdminPosts();
      setPosts(data.posts || []);
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.message.toLowerCase().includes('token'))
        window.location.assign('/admin');
    }
  }

  async function loadStudents() {
    const data = await getStudents();
    setStudents(data.students || []);
  }

  useEffect(() => {
    verifySession()
      .then(() => Promise.all([getAdminPosts(), getStudents()]))
      .then(([postData, studentData]) => {
        setPosts(postData.posts || []);
        setStudents(studentData.students || []);
      })
      .catch((requestError) => {
        setError(requestError.message);
        if (requestError.message.toLowerCase().includes('token'))
          window.location.assign('/admin');
      });
  }, []);

  function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.assign('/admin');
  }

  async function createStudent(event) {
    event.preventDefault();
    setError('');
    try {
      await createStudentAccount(studentForm);
      await loadStudents();
      setStudentForm({ name: '', email: '', password: '' });
      setShowCreateUser(false);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const filteredPosts = posts.filter((post) => {
    const term = search.toLowerCase();
    return (
      !term ||
      `${post.title} ${post.author_name || ''}`.toLowerCase().includes(term)
    );
  });

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <div>
          <a className="dashboard-identity" href="/">
            <LogoMark />
            <span>
              <strong>NCLEX Prep</strong>
              <small>Admin Panel</small>
            </span>
          </a>
          <nav className="dashboard-nav">
            <button type="button">Dashboard</button>
            <button
              className={activePanel === 'posts' ? 'active' : ''}
              onClick={() => setActivePanel('posts')}
              type="button"
            >
              Posts
            </button>
            <button className={activePanel === 'categories' ? 'active' : ''} onClick={() => setActivePanel('categories')} type="button">Categories</button>
            <button className={activePanel === 'study-topics' ? 'active' : ''} onClick={() => setActivePanel('study-topics')} type="button">Study Topics</button>
            <button
              className={activePanel === 'questions' ? 'active' : ''}
              onClick={() => setActivePanel('questions')}
              type="button"
            >
              Questions
            </button>
            <button
              className={activePanel === 'users' ? 'active' : ''}
              onClick={() => setActivePanel('users')}
              type="button"
            >
              Users
            </button>
            <button type="button">Settings</button>
          </nav>
        </div>
        <div className="dashboard-account">
          <a href="/blog">View public site</a>
          <button onClick={logout} type="button">
            Logout
          </button>
        </div>
      </aside>
      <main className="dashboard-content">
        <div className="dashboard-content-inner">
          {activePanel === 'posts' ? (
            <PostsPanel
              error={error}
              filteredPosts={filteredPosts}
              loadPosts={loadPosts}
              search={search}
              setSearch={setSearch}
            />
          ) : activePanel === 'categories' ? (
            <CategoryPanel categoryType="BLOG" />
          ) : activePanel === 'study-topics' ? (
            <CategoryPanel categoryType="STUDY" />
          ) : activePanel === 'questions' ? (
            <QuestionBankPanel />
          ) : (
            <UsersPanel
              createStudent={createStudent}
              error={error}
              setShowCreateUser={setShowCreateUser}
              setStudentForm={setStudentForm}
              showCreateUser={showCreateUser}
              studentForm={studentForm}
              students={students}
              loadStudents={loadStudents}
              setError={setError}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function PostsPanel({ error, filteredPosts, loadPosts, search, setSearch }) {
  const [showEditor, setShowEditor] = useState(false);
  const [categories, setCategories] = useState([]);
  const [editorError, setEditorError] = useState('');
  const [saving, setSaving] = useState(false);
  const [postForm, setPostForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    featured_image: '',
    status: 'draft',
    featured: false,
  });

  async function openEditor() {
    setEditorError('');
    try {
      const data = await getAdminCategories('BLOG');
      setCategories(data.categories || []);
    } catch (requestError) {
      setEditorError(requestError.message);
    }
    setShowEditor(true);
  }

  async function submitPost(event) {
    event.preventDefault();
    setSaving(true);
    setEditorError('');
    try {
      await createPost({
        ...postForm,
        category: postForm.category || null,
        featured_image: postForm.featured_image || null,
      });
      setPostForm({
        title: '', excerpt: '', content: '', category: '',
        featured_image: '', status: 'draft', featured: false,
      });
      setShowEditor(false);
      await loadPosts();
    } catch (requestError) {
      setEditorError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="dashboard-heading">
        <h1>Manage Posts</h1>
        <button onClick={openEditor} type="button">Add New Post</button>
      </div>
      {error && <p className="error-text">{error}</p>}
      <section className="dashboard-panel">
        <div className="dashboard-search">
          <span>Search</span>
          <input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search posts by title or author..."
            value={search}
          />
        </div>
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Date Published</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map((post) => (
                <tr key={post.id}>
                  <td>{post.title}</td>
                  <td>{post.author_name || 'Admin'}</td>
                  <td>{formatDate(post.published_at || post.created_at)}</td>
                  <td>
                    <span className={`status ${post.status}`}>
                      {post.status}
                    </span>
                  </td>
                  <td>
                    <div className="dashboard-actions">
                      <button title="Edit post" type="button">
                        Edit
                      </button>
                      <button
                        className="delete-action"
                        onClick={async () => {
                          if (window.confirm('Delete this post?')) {
                            await deletePost(post.id);
                            loadPosts();
                          }
                        }}
                        title="Delete post"
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredPosts.length && (
            <p className="empty-state">No posts found.</p>
          )}
        </div>
        <div className="dashboard-pagination">
          <button type="button">Previous</button>
          <button className="active" type="button">
            1
          </button>
          <button type="button">Next</button>
        </div>
      </section>
      {showEditor && (
        <PostEditor
          categories={categories}
          error={editorError}
          form={postForm}
          onClose={() => setShowEditor(false)}
          onSubmit={submitPost}
          saving={saving}
          setForm={setPostForm}
        />
      )}
    </>
  );
}

function PostEditor({ categories, error, form, onClose, onSubmit, saving, setForm }) {
  const setField = (field, value) => setForm({ ...form, [field]: value });
  const [uploading, setUploading] = useState(false);
  async function selectImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { const uploaded = await uploadImage(file); setField('featured_image', uploaded.path); }
    catch (uploadError) { window.alert(uploadError.message); }
    finally { setUploading(false); }
  }
  return (
    <div className="admin-modal-backdrop">
      <form className="admin-modal post-editor" onSubmit={onSubmit}>
        <div className="modal-heading">
          <div><span className="category-label">Blog post</span><h2>Add New Post</h2></div>
          <button disabled={saving} onClick={onClose} type="button">Close</button>
        </div>
        {error && <p className="error-text">{error}</p>}
        <div className="post-form-grid">
          <label className="full-field">Title<input autoFocus required value={form.title} onChange={(event) => setField('title', event.target.value)} placeholder="Post title" /></label>
          <label>Category<select value={form.category} onChange={(event) => setField('category', event.target.value)}><option value="">No category</option>{categories.map((category) => <option key={category.id || category.name} value={category.name}>{category.name}</option>)}</select></label>
          <label>Status<select value={form.status} onChange={(event) => setField('status', event.target.value)}><option value="draft">Draft</option><option value="published">Published</option></select></label>
          <label className="full-field">Excerpt<textarea value={form.excerpt} onChange={(event) => setField('excerpt', event.target.value)} placeholder="A short summary shown on the blog page" /></label>
          <label className="full-field">Content<textarea className="post-content-input" required value={form.content} onChange={(event) => setField('content', event.target.value)} placeholder="Write the article content..." /></label>
          <label className="full-field">Featured image<input accept="image/jpeg,image/png,image/gif,image/webp" disabled={uploading} onChange={selectImage} type="file" />{uploading && <small>Uploading image...</small>}{form.featured_image && <img className="post-image-preview" src={form.featured_image} alt="Post preview" />}</label>
          <label className="post-featured-toggle"><input checked={form.featured} onChange={(event) => setField('featured', event.target.checked)} type="checkbox" /> Feature this post</label>
        </div>
        <div className="question-editor-actions"><button className="secondary-button" disabled={saving} onClick={onClose} type="button">Cancel</button><button disabled={saving} type="submit">{saving ? 'Saving...' : form.status === 'published' ? 'Publish Post' : 'Save Draft'}</button></div>
      </form>
    </div>
  );
}

function UsersPanel({
  createStudent,
  error,
  loadStudents,
  setError,
  setShowCreateUser,
  setStudentForm,
  showCreateUser,
  studentForm,
  students,
}) {
  async function removeStudent(student) {
    if (!window.confirm(`Remove ${student.name}'s account and study history?`))
      return;
    try {
      await deleteStudent(student.id);
      await loadStudents();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function resetPassword(student) {
    const password = window.prompt(
      `Enter a new temporary password for ${student.name}`,
    );
    if (!password) return;
    try {
      await resetStudentPassword(student.id, password);
      window.alert('Password updated successfully.');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <>
      <div className="dashboard-heading">
        <div>
          <h1>Manage Students</h1>
          <p>Create and control access to the student question bank.</p>
        </div>
        <button onClick={() => setShowCreateUser(true)} type="button">
          Add New Student
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
      <section className="dashboard-panel users-panel">
        <div className="users-summary">
          <div>
            <span>Total students</span>
            <strong>{students.length}</strong>
          </div>
          <div>
            <span>Active accounts</span>
            <strong>
              {students.filter((student) => student.status === 'ACTIVE').length}
            </strong>
          </div>
          <div>
            <span>Question bank access</span>
            <strong>{students.length}</strong>
          </div>
        </div>
        <div className="dashboard-table-wrap">
          <table className="dashboard-table users-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Created</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>
                    <div className="student-cell">
                      <span>
                        {student.name
                          .split(' ')
                          .map((part) => part[0])
                          .join('')
                          .slice(0, 2)}
                      </span>
                      <strong>{student.name}</strong>
                    </div>
                  </td>
                  <td>{student.email}</td>
                  <td>{formatDate(student.created_at)}</td>
                  <td>
                    <span
                      className={`status ${student.status === 'ACTIVE' ? 'published' : 'draft'}`}
                    >
                      {student.status === 'ACTIVE' ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <div className="dashboard-actions">
                      <button
                        onClick={() => resetPassword(student)}
                        type="button"
                      >
                        Reset password
                      </button>
                      <button
                        className="delete-action"
                        onClick={() => removeStudent(student)}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {showCreateUser && (
        <CreateStudentModal
          createStudent={createStudent}
          setShowCreateUser={setShowCreateUser}
          setStudentForm={setStudentForm}
          studentForm={studentForm}
        />
      )}
    </>
  );
}

function CreateStudentModal({
  createStudent,
  setShowCreateUser,
  setStudentForm,
  studentForm,
}) {
  return (
    <div className="admin-modal-backdrop">
      <form className="admin-modal stacked-form" onSubmit={createStudent}>
        <div className="modal-heading">
          <div>
            <span className="category-label">Student account</span>
            <h2>Add New Student</h2>
          </div>
          <button onClick={() => setShowCreateUser(false)} type="button">
            Close
          </button>
        </div>
        <label>
          Full name
          <input
            required
            value={studentForm.name}
            onChange={(event) =>
              setStudentForm({ ...studentForm, name: event.target.value })
            }
            placeholder="Student name"
          />
        </label>
        <label>
          Email address
          <input
            required
            type="email"
            value={studentForm.email}
            onChange={(event) =>
              setStudentForm({ ...studentForm, email: event.target.value })
            }
            placeholder="student@example.com"
          />
        </label>
        <label>
          Temporary password
          <input
            required
            minLength="8"
            type="password"
            value={studentForm.password}
            onChange={(event) =>
              setStudentForm({ ...studentForm, password: event.target.value })
            }
            placeholder="Minimum 8 characters"
          />
        </label>
        <p>
          The student will use these credentials to access the Question Bank.
        </p>
        <button type="submit">Create Student Account</button>
      </form>
    </div>
  );
}
