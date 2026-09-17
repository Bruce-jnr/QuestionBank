import { useEffect, useState } from 'react'
import LogoMark from './LogoMark'
import Navbar from './Navbar'

export default function Header() {
  const [open, setOpen] = useState(false)
  const currentPath = window.location.pathname.replace(/\.html$/, '')

  useEffect(() => {
    document.documentElement.removeAttribute('data-theme')
    localStorage.removeItem('theme')
  }, [])

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a className="brand" href="/">
          <LogoMark />
          <span>NCLEX Prep</span>
        </a>
        <Navbar currentPath={currentPath} open={open} />
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
  )
}
