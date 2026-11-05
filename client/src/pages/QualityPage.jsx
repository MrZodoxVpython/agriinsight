import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  CloudSun,
  Database,
  Droplets,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Sprout,
} from 'lucide-react';
import { EmptyState, ProgressBar, StatusBadge } from '../components/ui';

const INTEGRATIONS = [
  {
    icon: Sprout,
    title: 'Data rencana tanam',
    text: 'Luas, komoditas, jadwal, hasil, dan biaya.',
    ready: true,
  },
  {
    icon: BarChart3,
    title: 'Analisis kelayakan usaha',
    text: 'Omzet, margin, ROI, dan harga impas otomatis.',
    ready: true,
  },
  {
    icon: Database,
    title: 'Ekspor laporan CSV',
    text: 'Unduh seluruh data rencana tanam.',
    ready: true,
  },
  {
    icon: ShoppingCart,
    title: 'Harga pasar aktual',
    text: 'Belum terhubung ke feed harga resmi.',
    ready: false,
  },
  {
    icon: CloudSun,
    title: 'Cuaca & iklim',
    text: 'Belum terhubung ke data prakiraan cuaca.',
    ready: false,
  },
  {
    icon: Droplets,
    title: 'Sensor tanah',
    text: 'Belum ada integrasi pH, kelembapan, atau nutrisi.',
    ready: false,
  },
];

export default function QualityPage({ summary, plans, onNavigate, onAddPlan }) {
  if (!summary) {
    return <div className="skeleton skeleton-panel" />;
  }

  const quality = summary.quality || { score: 0, plans: [], field_completion: [] };
  const incomplete = quality.plans.filter((plan) => plan.missing.length > 0);
  const complete = quality.plans.length - incomplete.length;
  const weakFields = quality.field_completion.filter((field) => field.percent < 100);

  if (plans.length === 0) {
    return (
      <div className="page-stack">
        <div className="panel">
          <EmptyState
            icon={ShieldCheck}
            title="Belum ada data untuk dinilai"
            description="Kualitas data dihitung dari kelengkapan informasi pada setiap rencana tanam. Tambahkan rencana pertama untuk memulai."
            action={
              <button type="button" className="button button-primary" onClick={onAddPlan}>
                <Plus size={15} /> Tambah rencana
              </button>
            }
          />
        </div>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">STATUS INTEGRASI</span>
              <h3>Sumber data yang tersedia</h3>
            </div>
          </div>
          <div className="integration-grid">
            {INTEGRATIONS.map(({ icon: Icon, title, text, ready }) => (
              <div key={title} className="integration-item">
                <span className={`integration-icon${ready ? ' is-ready' : ''}`}><Icon size={18} /></span>
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
                <span className={`badge ${ready ? 'badge-success' : 'badge-neutral'}`}>
                  {ready ? 'Tersedia' : 'Belum'}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="quality-hero panel">
        <div className="quality-ring" style={{ '--score': `${quality.score * 3.6}deg` }}>
          <div>
            <strong>{quality.score}%</strong>
            <span>skor data</span>
          </div>
        </div>
        <div className="quality-hero-copy">
          <span className="eyebrow">KUALITAS DATA</span>
          <h2>
            {quality.score >= 80
              ? 'Data Anda sudah sangat baik.'
              : quality.score >= 50
                ? 'Analisis Anda cukup baik, masih bisa ditingkatkan.'
                : 'Lengkapi data untuk analisis yang lebih akurat.'}
          </h2>
          <p>
            {quality.filled_fields} dari {quality.total_fields} field terisi.{' '}
            {complete} rencana sudah lengkap dan {incomplete.length} masih perlu dilengkapi.
          </p>
          <div className="quality-hero-stats">
            <span><CheckCircle2 size={15} /> {complete} lengkap</span>
            <span><AlertTriangle size={15} /> {incomplete.length} perlu perhatian</span>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">KELENGKAPAN FIELD</span>
              <h3>Bagian data yang perlu diperbaiki</h3>
              <p className="subheading">Persentase rencana yang memiliki data pada setiap field.</p>
            </div>
            <span className={`quality-score${quality.score >= 80 ? ' is-good' : quality.score >= 50 ? ' is-mid' : ''}`}>
              {quality.score}%
            </span>
          </div>
          <div className="field-list">
            {quality.field_completion.map((field) => (
              <div key={field.key} className="field-row">
                <div className="field-row-head">
                  <span>{field.label}</span>
                  <small>{field.filled}/{field.total} rencana</small>
                </div>
                <ProgressBar value={field.percent} tone={field.percent === 100 ? 'green' : field.percent >= 50 ? 'gold' : 'red'} />
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">REKOMENDASI</span>
              <h3>Langkah perbaikan</h3>
            </div>
            <span className="panel-icon"><ShieldCheck size={18} /></span>
          </div>
          <div className="recommendation-list">
            {weakFields.length === 0 ? (
              <div className="recommendation-item is-done">
                <CheckCircle2 size={17} />
                <div>
                  <strong>Semua field sudah lengkap</strong>
                  <p>Pertahankan kualitas data dengan memperbarui hasil panen dan biaya riil.</p>
                </div>
              </div>
            ) : (
              weakFields.slice(0, 5).map((field) => (
                <div key={field.key} className="recommendation-item">
                  <AlertTriangle size={17} />
                  <div>
                    <strong>Lengkapi {field.label.toLowerCase()}</strong>
                    <p>
                      {field.total - field.filled} dari {field.total} rencana belum memiliki data ini.
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <button type="button" className="button button-primary recommendation-action" onClick={() => onNavigate('plans')}>
            Kelola rencana tanam
          </button>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">PER RENCANA</span>
            <h3>Status kelengkapan setiap rencana</h3>
          </div>
          <span className="panel-icon"><Database size={18} /></span>
        </div>
        <div className="quality-plan-list">
          {quality.plans.map((item) => (
            <div key={item.id} className="quality-plan-row">
              <div className="quality-plan-main">
                <strong>{item.commodity}</strong>
                <StatusBadge status={item.status} />
              </div>
              <div className="quality-plan-bar">
                <ProgressBar value={item.score} tone={item.score === 100 ? 'green' : item.score >= 60 ? 'gold' : 'red'} />
              </div>
              <div className="quality-plan-missing">
                {item.missing.length === 0 ? (
                  <span className="badge badge-success">Lengkap</span>
                ) : (
                  item.missing.map((field) => <span key={field} className="missing-chip">{field}</span>)
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">STATUS INTEGRASI</span>
            <h3>Sumber data yang tersedia</h3>
            <p className="subheading">
              AgriInsight transparan tentang data yang sudah tersedia dan yang belum terintegrasi.
            </p>
          </div>
        </div>
        <div className="integration-grid">
          {INTEGRATIONS.map(({ icon: Icon, title, text, ready }) => (
            <div key={title} className="integration-item">
              <span className={`integration-icon${ready ? ' is-ready' : ''}`}><Icon size={18} /></span>
              <div>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
              <span className={`badge ${ready ? 'badge-success' : 'badge-neutral'}`}>
                {ready ? 'Tersedia' : 'Belum'}
              </span>
            </div>
          ))}
        </div>
        <p className="chart-note">
          Semua perhitungan saat ini menggunakan input manual Anda. Integrasi harga pasar dan cuaca
          memerlukan sumber data eksternal dan belum diaktifkan.
        </p>
      </section>
    </div>
  );
}
