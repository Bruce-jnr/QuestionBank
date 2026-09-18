import { navItems } from '../data/navigation';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <strong>CBRUCENCLEX</strong>
        <p>Your trusted resource for focused NCLEX preparation.</p>
      </div>
      <div className="footer-links">
        {navItems.slice(1).map(([href, label]) => (
          <a href={href} key={href}>
            {label}
          </a>
        ))}
        <a href="/faq">FAQ</a>
        <a href="/privacy-policy">Privacy Policy</a>
      </div>
      <p>
        Copyright {new Date().getFullYear()} CBRUCENCLEX. All rights reserved.
      </p>
    </footer>
  );
}
