import { useEffect, useState } from 'react';
import LogoMark from './LogoMark';
import Navbar from './Navbar';

export default function Header() {
  const [open, setOpen] = useState(false);
  const currentPath = window.location.pathname.replace(/\.html$/, '');

  useEffect(() => {
    document.documentElement.removeAttribute('data-theme');
    localStorage.removeItem('theme');
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    document.body.classList.add('offcanvas-open');
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.classList.remove('offcanvas-open');
    };
  }, [open]);

  return (
    <header className={`site-header ${open ? 'menu-open' : ''}`}>
      <div className="site-header-inner">
        <a className="brand" href="/">
          <LogoMark />
          <span>C-BRUCE NCLEX</span>
        </a>
        <Navbar currentPath={currentPath} onClose={() => setOpen(false)} open={open} />
        <button
          aria-label="Close navigation menu"
          className={`public-nav-backdrop ${open ? 'is-visible' : ''}`}
          onClick={() => setOpen(false)}
          tabIndex={open ? 0 : -1}
          type="button"
        />
        <div className="header-actions">
          <a
            className={
              currentPath === '/question-bank'
                ? 'question-bank-nav-cta active'
                : 'question-bank-nav-cta'
            }
            href="/question-bank"
          >
            Question Bank
          </a>
          <button
            aria-controls="primary-navigation"
            className="menu-button"
            onClick={() => setOpen(!open)}
            type="button"
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={open}
          >
            {open ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
