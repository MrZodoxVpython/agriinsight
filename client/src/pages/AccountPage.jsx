import { useState } from 'react';
import {
  Download,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  LogOut,
  Mail,
  ShieldCheck,
  Sprout,
  Wallet,
} from 'lucide-react';
import { api } from '../api';
import { ProgressBar } from '../components/ui';
import { formatDate, initials, number, rupiah } from '../lib/format';
import { exportPlansToCsv } from '../lib/plans';

export default function AccountPage({ user, summary, plans, onLogout, notify, onNavigate }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setError('');
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (form.newPassword !== form.confirmPassword) {
      setError('Konfirmasi password baru belum sama.');
      return;
    }
    if (form.newPassword.length < 6) {
      setError('Password baru minimal 6 karakter.');
      return;
    }

    setLoading(true);
    try {
      await api.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      notify('success', 'Password berhasil diperbarui.');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    if (plans.length === 0) {
      notify('info', 'Belum ada data untuk diekspor.');
      return;
    }
    exportPlansToCsv(plans);
    notify('success', `${plans.length} rencana berhasil diekspor.`);
  }

  const qualityScore = summary?.quality?.score || 0;

  return (
    <div className="page-stack">
      <section className="account-grid">
        <article className="panel profile-card">
          <div className="profile-head">
            <span className="avatar avatar-large">{initials(user?.email)}</span>
            <div>
              <span className="eyebrow">AKUN AKTIF</span>
              <h2>{user?.email?.split('@')[0]}</h2>
              <p><Mail size={14} /> {user?.email}</p>
            </div>
          </div>

          <div className="profile-stats">
            <div>
              <span>Rencana tanam</span>
              <strong>{number(summary?.plan_count || 0)}</strong>
            </div>
            <div>
              <span>Total luas</span>
              <strong>{number(summary?.total_area_ha || 0, 2)} ha</strong>
            </div>
            <div>
              <span>Estimasi omzet</span>
              <strong>{rupiah(summary?.estimated_revenue || 0)}</strong>
            </div>
          </div>

          <div className="profile-meta">
            <span>Terdaftar sejak {formatDate(user?.created_at)}</span>
            <div>
              <span>Kelengkapan data</span>
              <strong>{qualityScore}%</strong>
            </div>
            <ProgressBar value={qualityScore} />
          </div>

          <div className="profile-actions">
            <button type="button" className="button button-ghost" onClick={() => onNavigate('plans')}>
              <Sprout size={15} /> Kelola rencana
            </button>
            <button type="button" className="button button-ghost" onClick={handleExport}>
              <Download size={15} /> Ekspor data
            </button>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">KEAMANAN</span>
              <h3>Ubah password</h3>
              <p className="subheading">
                Gunakan minimal 6 karakter. Password disimpan dalam bentuk hash, bukan teks biasa.
              </p>
            </div>
            <span className="panel-icon"><KeyRound size={18} /></span>
          </div>

          <form className="password-form" onSubmit={handleSubmit}>
            <label>
              Password saat ini
              <span className="input-with-icon">
                <LockKeyhole size={16} />
                <input
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.currentPassword}
                  onChange={update('currentPassword')}
                  placeholder="Masukkan password saat ini"
                  required
                />
                <button
                  type="button"
                  className="input-action"
                  onClick={() => setShow((current) => !current)}
                  aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>
            <label>
              Password baru
              <input
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.newPassword}
                onChange={update('newPassword')}
                placeholder="Minimal 6 karakter"
                required
                minLength={6}
              />
            </label>
            <label>
              Konfirmasi password baru
              <input
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
                placeholder="Ulangi password baru"
                required
                minLength={6}
              />
            </label>

            {error && <div className="form-error" role="alert">{error}</div>}

            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Perbarui password'}
            </button>
          </form>
        </article>
      </section>

      <section className="account-grid">
        <article className="panel account-info-card">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">LAPORAN</span>
              <h3>Data usaha Anda</h3>
            </div>
            <span className="panel-icon"><Wallet size={18} /></span>
          </div>
          <p className="muted">
            Unduh seluruh rencana tanam dalam format CSV untuk dibuka di Excel, Google Sheets, atau
            untuk kebutuhan pembukuan.
          </p>
          <button type="button" className="button button-primary" onClick={handleExport}>
            <Download size={15} /> Unduh laporan CSV
          </button>
        </article>

        <article className="panel account-info-card">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">SESI</span>
              <h3>Keamanan akun</h3>
            </div>
            <span className="panel-icon"><ShieldCheck size={18} /></span>
          </div>
          <p className="muted">
            Sesi Anda aktif di perangkat ini. Keluar jika menggunakan komputer bersama. Setelah
            keluar, Anda perlu memasukkan email dan password kembali.
          </p>
          <button type="button" className="button button-ghost danger-text" onClick={onLogout}>
            <LogOut size={15} /> Keluar dari akun
          </button>
        </article>
      </section>
    </div>
  );
}
