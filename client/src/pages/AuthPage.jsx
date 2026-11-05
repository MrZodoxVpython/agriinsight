import { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Eye,
  EyeOff,
  Leaf,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sprout,
} from 'lucide-react';
import { api } from '../api';

const BENEFITS = [
  {
    icon: Sprout,
    title: 'Kelola rencana tanam',
    text: 'Catat luas, jadwal, biaya, dan target panen dalam satu tempat.',
  },
  {
    icon: BarChart3,
    title: 'Analisis kelayakan usaha',
    text: 'Lihat estimasi omzet, margin, ROI, dan harga impas secara otomatis.',
  },
  {
    icon: ShieldCheck,
    title: 'Data usaha yang rapi',
    text: 'Pantau kualitas data dan unduh laporan CSV kapan saja.',
  },
];

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setError('');
  };

  function switchMode(nextMode) {
    setMode(nextMode);
    setError('');
    setForm((current) => ({ ...current, password: '', confirmPassword: '' }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (mode === 'register' && form.password !== form.confirmPassword) {
      setError('Konfirmasi password belum sama.');
      return;
    }

    setLoading(true);
    try {
      const result =
        mode === 'login'
          ? await api.login({ email: form.email, password: form.password })
          : await api.register({ email: form.email, password: form.password });
      onAuth(result);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <div className="auth-brand">
          <span className="brand-mark">
            <Leaf size={20} />
          </span>
          <span>
            Agri<span>Insight</span>
          </span>
        </div>

        <div className="auth-aside-content">
          <span className="auth-eyebrow">AGRICULTURE BUSINESS INTELLIGENCE</span>
          <h1>
            Keputusan usaha tani yang lebih baik dimulai dari <em>data.</em>
          </h1>
          <p>
            Platform sederhana untuk merencanakan produksi, menghitung kelayakan, dan memantau
            performa usaha tani Anda.
          </p>

          <div className="auth-benefits">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="auth-benefit">
                <span>
                  <Icon size={18} />
                </span>
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-aside-footer">
          <CheckCircle2 size={15} />
          <span>Data tersimpan aman di database PostgreSQL Supabase.</span>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              className={mode === 'login' ? 'selected' : ''}
              onClick={() => switchMode('login')}
              role="tab"
              aria-selected={mode === 'login'}
            >
              Masuk
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'selected' : ''}
              onClick={() => switchMode('register')}
              role="tab"
              aria-selected={mode === 'register'}
            >
              Daftar
            </button>
          </div>

          <div className="auth-heading">
            <h2>{mode === 'login' ? 'Selamat datang kembali' : 'Buat akun AgriInsight'}</h2>
            <p>
              {mode === 'login'
                ? 'Masuk untuk melanjutkan pengelolaan rencana tanam Anda.'
                : 'Gratis, tanpa kartu kredit. Mulai dalam satu menit.'}
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label>
              Alamat email
              <span className="input-with-icon">
                <Mail size={16} />
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={update('email')}
                  placeholder="nama@email.com"
                />
              </span>
            </label>

            <label>
              Password
              <span className="input-with-icon">
                <LockKeyhole size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  minLength={6}
                  value={form.password}
                  onChange={update('password')}
                  placeholder="Minimal 6 karakter"
                />
                <button
                  type="button"
                  className="input-action"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>

            {mode === 'register' && (
              <label>
                Konfirmasi password
                <span className="input-with-icon">
                  <LockKeyhole size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={form.confirmPassword}
                    onChange={update('confirmPassword')}
                    placeholder="Ulangi password"
                  />
                </span>
              </label>
            )}

            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}

            <button type="submit" className="button button-primary auth-submit" disabled={loading}>
              {loading ? 'Memproses...' : mode === 'login' ? 'Masuk ke akun' : 'Buat akun'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="auth-switch-hint">
            {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? 'Daftar sekarang' : 'Masuk di sini'}
            </button>
          </p>
        </div>

        <p className="auth-legal">
          Dengan melanjutkan, Anda bertanggung jawab menjaga kerahasiaan akun dan data usaha Anda.
        </p>
      </main>
    </div>
  );
}
