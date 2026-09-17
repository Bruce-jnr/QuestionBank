import { navItems } from '../data/navigation';

export default function Navbar({ currentPath, open }) {
  return (
    <nav
      className={open ? 'main-nav open' : 'main-nav'}
      aria-label="Primary navigation"
    >
      {navItems.map(([href, label]) => (
        <a
          className={currentPath === href ? 'active' : ''}
          href={href}
          key={href}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
