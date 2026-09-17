import { useEffect, useState } from 'react'
import PublicLayout from '../components/PublicLayout'
import { createComment, getComments, getPost, upvoteComment } from '../services/api'
import { formatDate } from '../utils/formatDate'

export default function ArticlePage() {
  const slug = new URLSearchParams(window.location.search).get('slug')
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({ author_name: '', author_email: '', content: '' })

  useEffect(() => {
    if (!slug) return
    getPost(slug).then(({ post: foundPost }) => {
      setPost(foundPost)
      return getComments(foundPost.id)
    }).then((data) => setComments(data.comments || [])).catch((requestError) => setError(requestError.message))
  }, [slug])

  async function submitComment(event) {
    event.preventDefault()
    await createComment({ ...form, post_id: post.id })
    setForm({ author_name: '', author_email: '', content: '' })
    setError('Your comment was submitted for review.')
  }

  if (!post) return <PublicLayout><section className="page-section"><p className="empty-state">{error || 'Loading article...'}</p></section></PublicLayout>

  return (
    <PublicLayout>
      <article className="article-page">
        <span className="category-label">{post.category}</span>
        <h1>{post.title}</h1>
        <div className="article-meta">By {post.author_name || 'NCLEX Prep'} | {formatDate(post.published_at)}</div>
        {post.featured_image && <img className="article-image" src={post.featured_image} alt="" />}
        <div className="article-content">{post.content}</div>
        <section className="comments-section"><h2>Join the discussion</h2><form className="stacked-form" onSubmit={submitComment}><div className="form-row"><input required placeholder="Your name" value={form.author_name} onChange={(event) => setForm({ ...form, author_name: event.target.value })} /><input placeholder="Email" type="email" value={form.author_email} onChange={(event) => setForm({ ...form, author_email: event.target.value })} /></div><textarea required placeholder="Write a comment" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} /><button type="submit">Submit comment</button></form>{error && <p className="form-note">{error}</p>}<div className="comment-list">{comments.map((comment) => <article key={comment.id}><strong>{comment.author_name}</strong><p>{comment.content}</p><button onClick={() => upvoteComment(comment.id).then(() => setComments(comments.map((item) => item.id === comment.id ? { ...item, upvotes: item.upvotes + 1 } : item)))} type="button">Helpful {comment.upvotes || 0}</button></article>)}</div></section>
      </article>
    </PublicLayout>
  )
}
