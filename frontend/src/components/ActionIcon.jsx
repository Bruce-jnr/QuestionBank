export default function ActionIcon({ name, size = 18 }) {
  const common = {
    'aria-hidden': true,
    className: 'action-icon',
    fill: 'none',
    height: size,
    viewBox: '0 0 24 24',
    width: size,
  };

  if (name === 'edit') return <svg {...common}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" /></svg>;
  if (name === 'delete') return <svg {...common}><path d="M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6m4 4v7m6-7v7" /></svg>;
  if (name === 'archive') return <svg {...common}><path d="M4 7h16v13H4zM3 3h18v4H3zm6 8h6" /></svg>;
  if (name === 'close') return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>;
  if (name === 'diamond') return <svg {...common} fill="currentColor"><path d="m12 2 8 8-8 12-8-12Z" stroke="none" /></svg>;
  return null;
}
