import {
  BarChart3,
  LayoutDashboard,
  Leaf,
  ShieldCheck,
  Sprout,
  UserRound,
} from 'lucide-react';
import { ProgressBar } from './ui';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'plans', label: 'Rencana tanam', icon: Sprout },
  { key: 'analysis', label: 'Analisis usaha', icon: BarChart3 },
  { key: 'quality', label: 'Kualitas data', icon: ShieldCheck },
  { key: 'account', label: 'Akun & keamanan', icon: UserRound },
];

export default function Sidebar({
  route,
  open,
  onNavigate,
  onClose,
  user,
  connected,
  connectionLabel,
  planCount,
  qualityScore,
}) {
  return (
    <>
      <div className={`sidebar-overlay${open ? ' is-open' : ''}`} onClick={onClose} />
      <aside className={`sidebar${open ? ' is-open' : ''}`}>
        <a
          className="brand"
          href="#dashboard"
          onClick={(event) => {
            event.preventDefault();
            onNavigate('dashboard');
          }}
        >
          <span className="brand-mark">
            <Leaf size={20} />
          </span>
          <span>
            Agri<span>Insight</span>
          </span>
        </a>

        <div className="workspace-label">MENU UTAMA</div>
        <nav className="sidebar-nav" aria-label="Navigasi utama">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.key}
                href={`#${item.key}`}
                className={`side-link${route === item.key ? ' active' : ''}`}
                aria-current={route === item.key ? 'page' : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  onNavigate(item.key);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.key === 'plans' && planCount > 0 && <em className="nav-badge">{planCount}</em>}
              </a>
            );
          })}
        </nav>

        <div className="sidebar-widget">
          <div className="sidebar-widget-head">
            <span>Kelengkapan data</span>
            <strong>{qualityScore}%</strong>
          </div>
          <ProgressBar value={qualityScore} label="Kelengkapan data" />
          <p>Lengkapi data agar analisis usaha lebih akurat.</p>
          <button type="button" className="sidebar-widget-link" onClick={() => onNavigate('quality')}>
            Periksa sekarang
          </button>
        </div>

        <div className="sidebar-footer">
          <div className={`connection-pill${connected ? ' is-online' : ''}`}>
            <span className="connection-dot" />
            <span>{connectionLabel}</span>
          </div>
          {user && (
            <div className="sidebar-user">
              <span className="avatar">{(user.email || 'A').slice(0, 2).toUpperCase()}</span>
              <div>
                <strong>{user.email.split('@')[0]}</strong>
                <span>{user.email}</span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
