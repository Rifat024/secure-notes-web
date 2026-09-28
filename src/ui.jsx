const AVATAR_GRADIENTS = [
  ['#7c5cff', '#22d3ee'],
  ['#f472b6', '#fb923c'],
  ['#34d399', '#22d3ee'],
  ['#facc15', '#f97316'],
  ['#60a5fa', '#a78bfa'],
  ['#f43f5e', '#8b5cf6'],
];

const hashOf = (value = '') => [...value].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);

export function Avatar({ name = '?', seed, size }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
  const [from, to] = AVATAR_GRADIENTS[hashOf(seed ?? name) % AVATAR_GRADIENTS.length];
  return (
    <div className={`avatar ${size === 'lg' ? 'avatar-lg' : ''}`} style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
      {initials || '?'}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <header className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {children && <div className="row">{children}</div>}
    </header>
  );
}

export function Alert({ kind = 'error', children }) {
  if (!children) return null;
  return <div className={`alert alert-${kind}`}>{children}</div>;
}

export function Empty({ icon = '✨', title, children }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <strong>{title}</strong>
      {children && <p>{children}</p>}
    </div>
  );
}

export function Skeletons({ count = 3 }) {
  return (
    <div className="grid-cards">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton" />
      ))}
    </div>
  );
}

export function RoleBadge({ role }) {
  return <span className={`badge ${role === 'admin' ? 'badge-admin' : ''}`}>{role === 'admin' ? '★ admin' : 'user'}</span>;
}

export function Pager({ data, page, setPage }) {
  if (!data || data.total === 0) return null;
  const totalPages = Math.max(1, data.totalPages);
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
  const from = (data.page - 1) * data.limit + 1;
  const to = Math.min(data.total, data.page * data.limit);

  return (
    <div className="pager">
      <span>
        Showing <b>{from}–{to}</b> of <b>{data.total}</b>
      </span>
      <div className="pager-pages">
        <button className="btn btn-sm btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          ← Prev
        </button>
        {pages.map((n) => (
          <button key={n} className={`btn btn-sm pager-page ${n === page ? 'active' : 'btn-ghost'}`} onClick={() => setPage(n)}>
            {n}
          </button>
        ))}
        <button className="btn btn-sm btn-ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
          Next →
        </button>
      </div>
    </div>
  );
}

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const UNITS = [
  ['year', 31536000],
  ['month', 2592000],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
];

export function timeAgo(date) {
  const seconds = (new Date(date).getTime() - Date.now()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return 'just now';
}
