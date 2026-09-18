import { useEffect, useState } from 'react';
import PostCards from '../components/PostCards';
import PublicLayout from '../components/PublicLayout';
import ScrollReveal from '../components/ScrollReveal';
import { getPublishedPosts, getStudyTopics } from '../services/api';

const testimonials = [
  [
    'Sarah Mitchell',
    'The study guides and practice questions were incredibly helpful. I passed on my first attempt.',
  ],
  [
    'James Davis',
    'The pharmacology tips helped me understand concepts that had always felt overwhelming.',
  ],
  [
    'Emily Martinez',
    'The content is organized clearly, so my study sessions became focused and productive.',
  ],
];

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [studyTopics, setStudyTopics] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([getPublishedPosts('limit=6'), getStudyTopics()])
      .then(([postData, categoryData]) => {
        setPosts(postData.posts || []);
        setStudyTopics(categoryData.categories || []);
      })
      .catch(() => {
        setPosts([]);
        setStudyTopics([]);
      });
  }, []);

  function submitSearch(event) {
    event.preventDefault();
    window.location.assign(`/blog?search=${encodeURIComponent(search)}`);
  }

  return (
    <PublicLayout>
      <section className="legacy-hero">
        <img
          className="home-hero-image"
          src="/images/hero.jpg"
          alt="Nursing students preparing for the NCLEX"
        />
        <ScrollReveal className="hero-content" delay={100}>
          <span className="hero-kicker">Your NCLEX preparation partner</span>
          <h1>Pass the NCLEX With Confidence.</h1>
          <p>
            Your trusted resource for study guides, practice questions, and
            expert tips to help you succeed.
          </p>
          <div className="hero-actions">
            <a className="hero-primary-cta" href="/question-bank">
              <span>Start Practicing</span>
              <small>Open the Question Bank</small>
            </a>
            <a className="hero-secondary-cta" href="/diagnostic">
              Take Free Assessment
            </a>
          </div>
          <form className="hero-search" onSubmit={submitSearch}>
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search NCLEX Tips..."
              value={search}
            />
            <button type="submit">Search</button>
          </form>
        </ScrollReveal>
      </section>
      <ScrollReveal as="section" className="diagnostic-callout">
        <div>
          <span className="category-label">Not sure where to begin?</span>
          <h2>Get your personalized NCLEX starting point.</h2>
          <p>
            Complete one question from every Client Needs category and receive
            an instant focus plan. No account required.
          </p>
          <a href="/diagnostic">Take the Free Assessment</a>
        </div>
        <div className="diagnostic-callout-steps">
          <article>
            <span>01</span>
            <strong>Answer 8 questions</strong>
            <p>A quick snapshot across every Client Needs category.</p>
          </article>
          <article>
            <span>02</span>
            <strong>See your breakdown</strong>
            <p>Identify the subjects that deserve your attention first.</p>
          </article>
          <article>
            <span>03</span>
            <strong>Follow your focus plan</strong>
            <p>Move directly into matching study guides and practice.</p>
          </article>
        </div>
      </ScrollReveal>
      <ScrollReveal as="section" className="page-section" delay={60}>
        <div className="section-title">
          <div>
            <span>From the blog</span>
            <h2>Latest Blog Posts</h2>
          </div>
          <a href="/blog">View all</a>
        </div>
        {posts.length ? (
          <PostCards posts={posts} />
        ) : (
          <p className="empty-state">No published posts yet.</p>
        )}
      </ScrollReveal>
      <ScrollReveal
        as="section"
        className="subject-distribution-section"
        direction="left"
      >
        <div className="subject-distribution-copy">
          <span className="category-label">NCLEX-RN Test Plan</span>
          <h2>Client Needs Subject Distribution</h2>
          <p>
            Focus your preparation according to the percentage of questions
            represented by each Client Needs category.
          </p>
          <a href="/question-bank">Practice by subject</a>
        </div>
        <div className="subject-table-wrap">
          <table className="subject-table">
            <thead>
              <tr>
                <th>Client Need Categories</th>
                <th>Distribution</th>
              </tr>
            </thead>
            <tbody>
              {studyTopics.map((topic) => (
                <tr key={topic.id}>
                  <td>{topic.name}</td>
                  <td>
                    <span>{topic.distribution}%</span>
                    <div>
                      <i style={{ width: `${topic.distribution * 4}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th>Total</th>
                <th>
                  {studyTopics.reduce(
                    (total, topic) => total + topic.distribution,
                    0,
                  )}
                  %
                </th>
              </tr>
            </tfoot>
          </table>
        </div>
      </ScrollReveal>
      <ScrollReveal
        as="section"
        className="page-section muted-section"
        delay={60}
      >
        <div className="centered-heading">
          <span>Proven support</span>
          <h2>What Our Students Say</h2>
          <p>Hear from successful NCLEX candidates who used these resources.</p>
        </div>
        <div className="testimonial-grid">
          {testimonials.map(([name, quote]) => (
            <blockquote key={name}>
              <div className="stars">5.0 / 5.0</div>
              <p>{quote}</p>
              <cite>{name}, RN</cite>
            </blockquote>
          ))}
        </div>
      </ScrollReveal>
    </PublicLayout>
  );
}
