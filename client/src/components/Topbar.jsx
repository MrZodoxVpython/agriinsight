import { CalendarDays, LogOut, Menu, Plus } from 'lucide-react';
import { todayLabel } from '../lib/format';

export default function Topbar({ title, subtitle, onMenu, onAddPlan, user, onLogout }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button type="button" className="icon-button menu-button" onClick={onMenu} aria-label="Buka menu">
          <Menu size={20} />
        </button>
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      <div className="topbar-actions">
        <span className="date-chip">
          <CalendarDays size={15} />
          <span>{todayLabel()}</span>
        </span>
        <button type="button" className="button button-primary topbar-add" onClick={onAddPlan}>
          <Plus size={16} />
          <span>Tambah rencana</span>
        </button>
        {user && (
          <div className="topbar-user">
            <span className="avatar">{(user.email || 'A').slice(0, 2).toUpperCase()}</span>
            <span className="topbar-email">{user.email}</span>
            <button type="button" className="icon-button" onClick={onLogout} aria-label="Keluar" title="Keluar">
              <LogOut size={17} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
