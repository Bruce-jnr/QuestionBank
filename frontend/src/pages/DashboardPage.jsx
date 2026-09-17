import { useEffect, useState } from 'react'
import LogoMark from '../components/LogoMark'
import { deletePost, getAdminPosts, verifySession } from '../services/api'
import { formatDate } from '../utils/formatDate'

const initialStudents = [
  { id: 1, name: 'Amina Johnson', email: 'amina@example.com', status: 'Active', created_at: '2026-09-10' },
  { id: 2, name: 'Michael Mensah', email: 'michael@example.com', status: 'Active', created_at: '2026-09-12' },
]

export default function DashboardPage() {
  const [posts, setPosts] = useState([])
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activePanel, setActivePanel] = useState('posts')
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [students, setStudents] = useState(initialStudents)
  const [studentForm, setStudentForm] = useState({ name: '', email: '', password: '' })

  async function loadPosts() {
    try {
      await verifySession()
      const data = await getAdminPosts()
      setPosts(data.posts || [])
    } catch (requestError) {
      setError(requestError.message)
      if (requestError.message.toLowerCase().includes('token')) window.location.assign('/admin')
    }
  }

  useEffect(() => {
    verifySession()
      .then(() => getAdminPosts())
      .then((data) => setPosts(data.posts || []))
      .catch((requestError) => {
        setError(requestError.message)
        if (requestError.message.toLowerCase().includes('token')) window.location.assign('/admin')
      })
  }, [])

  function logout() {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    window.location.assign('/admin')
  }

  function createStudent(event) {
    event.preventDefault()
    setStudents([...students, { id: Date.now(), name: studentForm.name, email: studentForm.email, status: 'Active', created_at: new Date().toISOString() }])
    setStudentForm({ name: '', email: '', password: '' })
    setShowCreateUser(false)
  }

  const filteredPosts = posts.filter((post) => {
    const term = search.toLowerCase()
    return !term || `${post.title} ${post.author_name || ''}`.toLowerCase().includes(term)
  })

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <div>
          <a className="dashboard-identity" href="/"><LogoMark /><span><strong>NCLEX Prep</strong><small>Admin Panel</small></span></a>
          <nav className="dashboard-nav">
            <button type="button">Dashboard</button>
            <button className={activePanel === 'posts' ? 'active' : ''} onClick={() => setActivePanel('posts')} type="button">Posts</button>
            <button type="button">Categories</button>
            <button className={activePanel === 'users' ? 'active' : ''} onClick={() => setActivePanel('users')} type="button">Users</button>
            <button type="button">Settings</button>
          </nav>
        </div>
        <div className="dashboard-account"><a href="/blog">View public site</a><button onClick={logout} type="button">Logout</button></div>
      </aside>
      <main className="dashboard-content">
        <div className="dashboard-content-inner">
          {activePanel === 'posts' ? (
            <PostsPanel error={error} filteredPosts={filteredPosts} loadPosts={loadPosts} search={search} setSearch={setSearch} />
          ) : (
            <UsersPanel
              createStudent={createStudent}
              setShowCreateUser={setShowCreateUser}
              setStudentForm={setStudentForm}
              setStudents={setStudents}
              showCreateUser={showCreateUser}
              studentForm={studentForm}
              students={students}
            />
          )}
        </div>
      </main>
    </div>
  )
}

function PostsPanel({ error, filteredPosts, loadPosts, search, setSearch }) {
  return (
    <>
      <div className="dashboard-heading"><h1>Manage Posts</h1><button type="button">Add New Post</button></div>
      {error && <p className="error-text">{error}</p>}
      <section className="dashboard-panel">
        <div className="dashboard-search"><span>Search</span><input onChange={(event) => setSearch(event.target.value)} placeholder="Search posts by title or author..." value={search} /></div>
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead><tr><th>Title</th><th>Author</th><th>Date Published</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{filteredPosts.map((post) => <tr key={post.id}><td>{post.title}</td><td>{post.author_name || 'Admin'}</td><td>{formatDate(post.published_at || post.created_at)}</td><td><span className={`status ${post.status}`}>{post.status}</span></td><td><div className="dashboard-actions"><button title="Edit post" type="button">Edit</button><button className="delete-action" onClick={async () => { if (window.confirm('Delete this post?')) { await deletePost(post.id); loadPosts() } }} title="Delete post" type="button">Delete</button></div></td></tr>)}</tbody>
          </table>
          {!filteredPosts.length && <p className="empty-state">No posts found.</p>}
        </div>
        <div className="dashboard-pagination"><button type="button">Previous</button><button className="active" type="button">1</button><button type="button">Next</button></div>
      </section>
    </>
  )
}

function UsersPanel({ createStudent, setShowCreateUser, setStudentForm, setStudents, showCreateUser, studentForm, students }) {
  return (
    <>
      <div className="dashboard-heading"><div><h1>Manage Students</h1><p>Create and control access to the student question bank.</p></div><button onClick={() => setShowCreateUser(true)} type="button">Add New Student</button></div>
      <section className="dashboard-panel users-panel">
        <div className="users-summary"><div><span>Total students</span><strong>{students.length}</strong></div><div><span>Active accounts</span><strong>{students.filter((student) => student.status === 'Active').length}</strong></div><div><span>Question bank access</span><strong>{students.length}</strong></div></div>
        <div className="dashboard-table-wrap">
          <table className="dashboard-table users-table">
            <thead><tr><th>Student</th><th>Email</th><th>Created</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{students.map((student) => <tr key={student.id}><td><div className="student-cell"><span>{student.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><strong>{student.name}</strong></div></td><td>{student.email}</td><td>{formatDate(student.created_at)}</td><td><span className="status published">{student.status}</span></td><td><div className="dashboard-actions"><button type="button">Reset password</button><button className="delete-action" onClick={() => setStudents(students.filter((item) => item.id !== student.id))} type="button">Remove</button></div></td></tr>)}</tbody>
          </table>
        </div>
      </section>
      {showCreateUser && <CreateStudentModal createStudent={createStudent} setShowCreateUser={setShowCreateUser} setStudentForm={setStudentForm} studentForm={studentForm} />}
    </>
  )
}

function CreateStudentModal({ createStudent, setShowCreateUser, setStudentForm, studentForm }) {
  return (
    <div className="admin-modal-backdrop"><form className="admin-modal stacked-form" onSubmit={createStudent}><div className="modal-heading"><div><span className="category-label">Student account</span><h2>Add New Student</h2></div><button onClick={() => setShowCreateUser(false)} type="button">Close</button></div><label>Full name<input required value={studentForm.name} onChange={(event) => setStudentForm({ ...studentForm, name: event.target.value })} placeholder="Student name" /></label><label>Email address<input required type="email" value={studentForm.email} onChange={(event) => setStudentForm({ ...studentForm, email: event.target.value })} placeholder="student@example.com" /></label><label>Temporary password<input required minLength="8" type="password" value={studentForm.password} onChange={(event) => setStudentForm({ ...studentForm, password: event.target.value })} placeholder="Minimum 8 characters" /></label><p>The student will use these credentials to access the Question Bank.</p><button type="submit">Create Student Account</button></form></div>
  )
}
