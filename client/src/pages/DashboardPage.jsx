import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Lightbulb,
  Plus,
  ShieldAlert,
  Sprout,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import StatCard from '../components/StatCard';
import { EmptyState, ProgressBar, StatusBadge } from '../components/ui';
import { compactRupiah, formatDate, number, percent, rupiah } from '../lib/format';
import { planMetrics } from '../lib/plans';

const chartTooltip = {
  contentStyle: {
    borderRadius: 12,
    border: '1px solid #e2e9e1',
    boxShadow: '0 12px 30px rgba(20, 52, 38, 0.12)',
    fontSize: 12,
  },
  formatter: (value) => [rupiah(value), ''],
};

function buildInsights(summary, plans) {
  const insights = [];
  if (!summary) return insights;

  const top = summary.by_commodity?.[0];
  if (top) {
    insights.push({
      tone: 'success',
      icon: TrendingUp,
      title: `${top.commodity} paling potensial`,
      text: `Estimasi margin ${rupiah(top.estimated_gross_margin)} dari ${top.plan_count} rencana.`,
    });
  }

  const risky = (summary.by_commodity || []).filter(
    (item) => item.average_price > 0 && item.average_price < item.break_even_price
  );
  if (risky.length > 0) {
    insights.push({
      tone: 'danger',
      icon: ShieldAlert,
      title: 'Harga jual di bawah titik impas',
      text: `${risky.map((item) => item.commodity).join(', ')} perlu evaluasi harga atau biaya produksi.`,
    });
  }

  const missing = summary.quality?.plans?.filter((plan) => plan.missing.length > 0).length || 0;
  if (missing > 0) {
    insights.push({
      tone: 'warning',
      icon: ClipboardList,
      title: `${missing} rencana belum lengkap`,
      text: 'Lengkapi tanggal, biaya, dan harga agar analisis lebih akurat.',
    });
  }

  const now = new Date();
  const soon = plans.filter((plan) => {
    if (!plan.expected_harvest_date) return false;
    const date = new Date(plan.expected_harvest_date);
    const days = (date - now) / 86_400_000;
    return days >= 0 && days <= 60;
  });
  if (soon.length > 0) {
    insights.push({
      tone: 'info',
      icon: CalendarClock,
      title: `${soon.length} panen dalam 60 hari`,
      text: `Terdekat: ${soon[0].commodity} di ${soon[0].location}.`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      tone: 'info',
      icon: Lightbulb,
      title: 'Mulai dari satu rencana tanam',
      text: 'Setelah data pertama masuk, wawasan otomatis akan muncul di sini.',
    });
  }

  return insights.slice(0, 4);
}

function DashboardSkeleton() {
  return (
    <div className="page-stack">
      <div className="skeleton skeleton-hero" />
      <div className="stats-grid">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="skeleton skeleton-card" />
        ))}
      </div>
      <div className="dashboard-grid">
        <div className="skeleton skeleton-panel" />
        <div className="skeleton skeleton-panel" />
      </div>
    </div>
  );
}

export default function DashboardPage({ summary, plans, loading, onNavigate, onAddPlan }) {
  if (loading && !summary) return <DashboardSkeleton />;

  if (!summary) {
    return (
      <div className="panel">
        <EmptyState
          icon={BarChart3}
          title="Ringkasan belum tersedia"
          description="Terjadi masalah saat memuat data. Coba muat ulang halaman."
        />
      </div>
    );
  }

  const activePlans = plans.filter((plan) => plan.status !== 'completed').length;
  const completed = plans.filter((plan) => plan.status === 'completed').length;
  const avgArea = summary.plan_count > 0 ? summary.total_area_ha / summary.plan_count : 0;
  const yieldPerHa = summary.total_area_ha > 0 ? summary.estimated_yield_kg / summary.total_area_ha : 0;
  const qualityScore = summary.quality?.score || 0;
  const insights = buildInsights(summary, plans);
  const recentPlans = plans.slice(0, 5);
  const chartData = (summary.by_month || []).map((month) => ({
    ...month,
    omzet: month.estimated_revenue,
    margin: Math.max(month.estimated_gross_margin, 0),
    biaya: month.estimated_cost,
  }));
  const maxCommodityRevenue = Math.max(
    ...(summary.by_commodity || []).map((item) => item.estimated_revenue),
    1
  );

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="hero-tag">RINGKASAN USAHA</span>
          <h2>
            {summary.plan_count > 0
              ? `Potensi margin ${compactRupiah(summary.estimated_gross_margin)} dari ${summary.plan_count} rencana tanam.`
              : 'Mulai bangun rencana tanam yang terukur.'}
          </h2>
          <p>
            {summary.plan_count > 0
              ? `${activePlans} rencana masih berjalan dan ${completed} sudah selesai. Semua angka dihitung dari data yang Anda input.`
              : 'Catat luas lahan, biaya produksi, dan target harga. AgriInsight akan menghitung omzet, margin, dan harga impas secara otomatis.'}
          </p>
          <div className="hero-actions">
            <button type="button" className="button button-gold" onClick={onAddPlan}>
              <Plus size={16} /> Tambah rencana
            </button>
            <button
              type="button"
              className="button button-hero-ghost"
              onClick={() => onNavigate(summary.plan_count > 0 ? 'analysis' : 'quality')}
            >
              {summary.plan_count > 0 ? 'Lihat analisis' : 'Pelajari data'} <ArrowRight size={16} />
            </button>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-sun" />
          <div className="hero-hill hero-hill-one" />
          <div className="hero-hill hero-hill-two" />
          <div className="hero-lines" />
        </div>
      </section>

      <section className="stats-grid">
        <StatCard
          label="Rencana tanam"
          value={number(summary.plan_count)}
          note={`${activePlans} masih berjalan`}
          trend={completed > 0 ? `${completed} selesai` : null}
          icon="sprout"
        />
        <StatCard
          label="Total luas lahan"
          value={`${number(summary.total_area_ha, 2)} ha`}
          note={`Rata-rata ${number(avgArea, 2)} ha/rencana`}
          icon="activity"
        />
        <StatCard
          label="Estimasi hasil panen"
          value={`${number(summary.estimated_yield_kg)} kg`}
          note={`${number(yieldPerHa)} kg/ha`}
          icon="trending"
        />
        <StatCard
          label="Estimasi omzet"
          value={compactRupiah(summary.estimated_revenue)}
          note={`Margin ${percent(summary.margin_percent)}`}
          trend={summary.estimated_gross_margin >= 0 ? 'Potensial' : 'Negatif'}
          trendTone={summary.estimated_gross_margin >= 0 ? 'up' : 'down'}
          icon="wallet"
        />
      </section>

      <section className="dashboard-grid">
        <article className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">PROYEKSI KEUANGAN</span>
              <h3>Omzet & margin per bulan panen</h3>
              <p className="subheading">
                Berdasarkan estimasi tanggal panen pada setiap rencana tanam.
              </p>
            </div>
            <span className="panel-icon">
              <BarChart3 size={18} />
            </span>
          </div>

          {chartData.length > 0 ? (
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 14, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8eee6" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#829087', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#829087', fontSize: 11 }}
                    tickFormatter={(value) => compactRupiah(value)}
                    width={78}
                  />
                  <Tooltip {...chartTooltip} />
                  <Bar dataKey="omzet" name="Omzet" fill="#2f7652" radius={[6, 6, 0, 0]} maxBarSize={34} />
                  <Bar dataKey="margin" name="Margin" fill="#e0b45f" radius={[6, 6, 0, 0]} maxBarSize={34} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="Belum ada data proyeksi"
              description="Tambahkan tanggal panen dan nilai ekonomi pada rencana tanam."
              compact
            />
          )}

          <div className="chart-legend">
            <span><i className="dot dot-green" /> Omzet</span>
            <span><i className="dot dot-gold" /> Margin</span>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">KOMPOSISI</span>
              <h3>Kontribusi komoditas</h3>
              <p className="subheading">Berdasarkan estimasi omzet tiap komoditas.</p>
            </div>
            <span className="panel-icon">
              <Sprout size={18} />
            </span>
          </div>

          {summary.by_commodity?.length ? (
            <div className="commodity-list">
              {summary.by_commodity.slice(0, 5).map((item) => (
                <div key={item.commodity} className="commodity-row">
                  <div className="commodity-row-head">
                    <strong>{item.commodity}</strong>
                    <span>{compactRupiah(item.estimated_revenue)}</span>
                  </div>
                  <div className="commodity-track">
                    <div
                      className="commodity-fill"
                      style={{ width: `${Math.max((item.estimated_revenue / maxCommodityRevenue) * 100, 3)}%` }}
                    />
                  </div>
                  <small>
                    {item.plan_count} rencana · {number(item.total_area_ha, 2)} ha · margin{' '}
                    {rupiah(item.estimated_gross_margin)}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Sprout}
              title="Belum ada komoditas"
              description="Data komoditas muncul setelah rencana tanam pertama dibuat."
              compact
            />
          )}
        </article>
      </section>

      <section className="dashboard-grid dashboard-grid-wide">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">RENCANA TERBARU</span>
              <h3>Aktivitas rencana tanam</h3>
            </div>
            <button type="button" className="text-button" onClick={() => onNavigate('plans')}>
              Lihat semua <ArrowRight size={14} />
            </button>
          </div>

          {recentPlans.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Komoditas</th>
                    <th>Lokasi</th>
                    <th>Luas</th>
                    <th>Estimasi omzet</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPlans.map((plan) => {
                    const metrics = planMetrics(plan);
                    return (
                      <tr key={plan.id}>
                        <td>
                          <strong>{plan.commodity}</strong>
                          <small>{formatDate(plan.expected_harvest_date)}</small>
                        </td>
                        <td>{plan.location}</td>
                        <td>{number(metrics.area, 2)} ha</td>
                        <td>{rupiah(metrics.revenue)}</td>
                        <td><StatusBadge status={plan.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Sprout}
              title="Belum ada rencana tanam"
              description="Tambahkan rencana pertama untuk mulai membangun riwayat data usaha."
              action={
                <button type="button" className="button button-primary" onClick={onAddPlan}>
                  <Plus size={15} /> Tambah rencana
                </button>
              }
            />
          )}
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">WAWASAN</span>
              <h3>Prioritas perhatian</h3>
            </div>
            <span className="panel-icon">
              <Lightbulb size={18} />
            </span>
          </div>
          <div className="insight-list">
            {insights.map(({ tone, icon: Icon, title, text }) => (
              <div key={title} className={`insight-item insight-${tone}`}>
                <span className="insight-icon">
                  <Icon size={17} />
                </span>
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-grid quality-bottom">
        <article className="panel quality-summary">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">KUALITAS DATA</span>
              <h3>Kelengkapan informasi usaha</h3>
              <p className="subheading">
                Data yang lengkap menghasilkan analisis margin dan risiko yang lebih akurat.
              </p>
            </div>
            <span className={`quality-score${qualityScore >= 80 ? ' is-good' : qualityScore >= 50 ? ' is-mid' : ''}`}>
              {qualityScore}%
            </span>
          </div>
          <ProgressBar value={qualityScore} label="Kelengkapan data" />
          <div className="quality-summary-footer">
            <span>
              {summary.quality?.filled_fields || 0} dari {summary.quality?.total_fields || 0} field terisi
            </span>
            <button type="button" className="text-button" onClick={() => onNavigate('quality')}>
              Perbaiki data <ArrowRight size={14} />
            </button>
          </div>
        </article>

        <article className="panel quick-actions-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">AKSI CEPAT</span>
              <h3>Kelola usaha Anda</h3>
            </div>
            <span className="panel-icon">
              <CheckCircle2 size={18} />
            </span>
          </div>
          <div className="quick-actions">
            <button type="button" className="quick-action" onClick={onAddPlan}>
              <span><Plus size={17} /></span>
              <div><strong>Tambah rencana</strong><small>Catat produksi baru</small></div>
              <ArrowRight size={15} />
            </button>
            <button type="button" className="quick-action" onClick={() => onNavigate('analysis')}>
              <span><BarChart3 size={17} /></span>
              <div><strong>Analisis usaha</strong><small>Bandingkan margin komoditas</small></div>
              <ArrowRight size={15} />
            </button>
            <button type="button" className="quick-action" onClick={() => onNavigate('account')}>
              <span><Wallet size={17} /></span>
              <div><strong>Unduh laporan</strong><small>Ekspor data ke CSV</small></div>
              <ArrowRight size={15} />
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}
