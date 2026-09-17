import { navItems } from '../data/navigation'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div><strong>NCLEX Prep Academy</strong><p>Your trusted resource for focused NCLEX preparation.</p></div>
      <div className="footer-links">{navItems.slice(1).map(([href, label]) => <a href={href} key={href}>{label}</a>)}</div>
      <p>Copyright {new Date().getFullYear()} NCLEX Prep. All rights reserved.</p>
    </footer>
  )
}
