import { navItems } from '../data/navigation';
import ActionIcon from './ActionIcon';
import LogoMark from './LogoMark';

export default function Navbar({ currentPath, onClose, open }) {
  return (
    <nav
      className={open ? 'main-nav open' : 'main-nav'}
      aria-label="Primary navigation"
      id="primary-navigation"
    >
      <div className="mobile-nav-heading">
        <a className="mobile-nav-brand" href="/" onClick={onClose}>
          <LogoMark />
          <span><strong>C-BRUCE NCLEX</strong><small>NCLEX preparation</small></span>
        </a>
        <button aria-label="Close navigation menu" onClick={onClose} type="button"><ActionIcon name="close" /></button>
      </div>
      {navItems.map(([href, label]) => (
        <a
          className={currentPath === href ? 'active' : ''}
          href={href}
          key={href}
          onClick={onClose}
        >
          {label}
        </a>
      ))}
      <a className="mobile-nav-cta" href="/question-bank" onClick={onClose}>Open Question Bank</a>
      <p className="mobile-nav-note">Focused practice, NGN questions, and clear rationales.</p>
    </nav>
  );
}
