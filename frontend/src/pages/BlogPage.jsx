import { useEffect, useMemo, useState } from 'react';
import PageHero from '../components/PageHero';
import PostCards from '../components/PostCards';
import PublicLayout from '../components/PublicLayout';
import { getCategories, getPublishedPosts } from '../services/api';
import image1 from '../assets/master.jpg';

export default function BlogPage() {
  const params = new URLSearchParams(window.location.search);
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(params.get('category') || 'All');
  const [search, setSearch] = useState(params.get('search') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPublishedPosts(), getCategories()])
      .then(([postData, categoryData]) => {
        setPosts(postData.posts || []);
        setCategories(categoryData.categories || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      posts.filter((post) => {
        const categoryMatch = selected === 'All' || post.category === selected;
        const term = search.toLowerCase();
        const searchMatch =
          !term ||
          `${post.title} ${post.excerpt || ''}`.toLowerCase().includes(term);
        return categoryMatch && searchMatch;
      }),
    [posts, search, selected],
  );

  return (
    <PublicLayout>
      <PageHero
        image={image1}
        imageAlt="Healthcare professional reviewing digital nursing resources"
        title="NCLEX Study Resources"
        text="Expert guidance, practical study strategies, and focused nursing review."
      />
      <section className="page-section">
        <div className="study-topic-toolbar">
          <label className="study-search">
            <span>Search</span>
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search articles..."
              type="search"
              value={search}
            />
          </label>
          <label className="study-filter">
            <span>Filter</span>
            <select
              onChange={(event) => setSelected(event.target.value)}
              value={selected}
            >
              <option value="All">All categories</option>
              {categories.map((category) => (
                <option key={category.id || category.name} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {loading ? (
          <p className="empty-state">Loading articles...</p>
        ) : filtered.length ? (
          <PostCards posts={filtered} />
        ) : (
          <p className="empty-state">No articles match your search and filter.</p>
        )}
      </section>
    </PublicLayout>
  );
}
