import LogoMark from './LogoMark';

export default function Footer() {
  return (
    <footer className="site-footer-shell">
      <div className="site-footer">
        <div className="footer-main">
          <section className="footer-brand-column" aria-label="About CBRUCENCLEX">
            <a className="footer-brand" href="/" aria-label="CBRUCENCLEX home">
              <span className="footer-logo"><LogoMark /></span>
              <span>CBRUCENCLEX</span>
            </a>
            <p>
              Focused NCLEX preparation built to help nursing students study
              with purpose, practise confidently, and understand every answer.
            </p>
            <a className="footer-email" href="mailto:support@cbrucenclex.com">
              support@cbrucenclex.com
            </a>
          </section>

          <nav className="footer-nav-column" aria-label="Study resources">
            <h2>Prepare</h2>
            <a href="/study-guide">Study Guides</a>
            <a href="/question-bank">Question Bank</a>
            <a href="/pricing">Plans</a>
            <a href="/student-area">Student Area</a>
          </nav>

          <nav className="footer-nav-column" aria-label="Company links">
            <h2>Explore</h2>
            <a href="/about">About</a>
            <a href="/blog">Blog</a>
            <a href="/contact">Contact</a>
            <a href="/faq">FAQ</a>
          </nav>

          <section className="footer-action-column">
            <span className="footer-eyebrow">Ready to practise?</span>
            <h2>Build confidence one question at a time.</h2>
            <p>Create a focused session by client need and question type.</p>
            <a className="footer-cta" href="/question-bank">
              Start practising <span aria-hidden="true">→</span>
            </a>
          </section>
        </div>

        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} CBRUCENCLEX. All rights reserved.
          </p>
          <div className="footer-legal-links">
            <a href="/privacy-policy">Privacy Policy</a>
            <a href="/contact">Support</a>
          </div>
          <p className="footer-disclaimer">
            Educational use only. Not affiliated with or endorsed by NCSBN.
          </p>
        </div>
      </div>
    </footer>
  );
}
