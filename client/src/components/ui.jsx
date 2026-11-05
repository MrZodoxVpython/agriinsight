import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Inbox,
  Info,
  X,
} from 'lucide-react';
import { statusMeta } from '../lib/plans';

export function StatusBadge({ status }) {
  const meta = statusMeta(status);
  return <span className={`badge badge-${meta.tone}`}>{meta.label}</span>;
}

export function ProgressBar({ value, tone = 'green', label }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="progress-wrap" aria-label={label}>
      <div className="progress-track">
        <div className={`progress-fill progress-${tone}`} style={{ width: `${safe}%` }} />
      </div>
      <span className="progress-value">{Math.round(safe)}%</span>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, compact = false }) {
  return (
    <div className={`empty-state${compact ? ' empty-state-compact' : ''}`}>
      <span className="empty-icon">
        <Icon size={22} />
      </span>
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function Modal({ title, subtitle, onClose, children, footer, size = 'default' }) {
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return createPortal(
    <div className="modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className={`modal modal-${size}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export function ConfirmDialog({ title, description, confirmLabel = 'Hapus', onConfirm, onClose, loading }) {
  return (
    <Modal
      title={title}
      subtitle={description}
      onClose={onClose}
      size="small"
      footer={
        <>
          <button type="button" className="button button-ghost" onClick={onClose} disabled={loading}>
            Batal
          </button>
          <button type="button" className="button button-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Memproses...' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="danger-note">
        <AlertTriangle size={18} />
        <span>Tindakan ini tidak dapat dibatalkan.</span>
      </div>
    </Modal>
  );
}

const toastIcons = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

export function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(onClose, 4200);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;
  const Icon = toastIcons[toast.type] || Info;

  return createPortal(
    <div className={`toast toast-${toast.type}`} role="status">
      <Icon size={18} />
      <span>{toast.message}</span>
      <button type="button" onClick={onClose} aria-label="Tutup notifikasi">
        <X size={15} />
      </button>
    </div>,
    document.body
  );
}
