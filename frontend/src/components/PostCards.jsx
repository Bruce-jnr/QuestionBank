export default function PostCards({ posts }) {
  return (
    <div className="card-grid">
      {posts.map((post) => (
        <article className="post-card" key={post.id}>
          {post.featured_image && <img src={post.featured_image} alt="" />}
          <div className="post-card-body">
            <span className="category-label">
              {post.category || 'NCLEX Review'}
            </span>
            <h3>{post.title}</h3>
            <p>{post.excerpt || post.content}</p>
            <a href={`/post?slug=${encodeURIComponent(post.slug)}`}>
              Read more
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}
