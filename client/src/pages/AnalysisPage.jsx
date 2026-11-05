import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Gauge,
  Layers,
  Percent,
  Plus,
  RotateCcw,
  Scale,
  Search,
  ShieldCheck,
  Sprout,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import StatCard from '../components/StatCard';
import { EmptyState, StatusBadge } from '../components/ui';
import { ANALYSIS_SCOPES, analyzePlans } from '../lib/analysis';
import { compactRupiah, formatDate, number, percent, rupiah } from '../lib/format';

const tooltipStyle = {
  contentStyle: {
    borderRadius: 12,
    border: '1px solid #e2e9e1',
    boxShadow: '0 12px 30px rgba(20, 52, 38, 0.12)',
    fontSize: 12,
  },
  formatter: (value, name) => [rupiah(value), name],
};

function riskNarrative(risk) {
  if (risk.tone === 'high') {
    return 'Struktur usaha rentan terhadap perubahan harga, hasil panen, atau biaya, atau terlalu bergantung pada satu komoditas. Prioritaskan efisiensi dan kepastian harga jual.';
  }
  if (risk.tone === 'medium') {
    return 'Usaha masih menguntungkan, tetapi bantalan harga atau diversifikasi pendapatan belum lebar. Pantau harga, biaya, dan komposisi komoditas secara berkala.';
  }
  return 'Margin, harga, dan biaya berada pada batas yang sehat berdasarkan input saat ini.';
}

function RiskBadge({ risk }) {
  return (
    <span className={`risk-chip risk-chip-${risk.tone}`}>
      Risiko {risk.level} · {risk.score}
    </span>
  );
}

function BufferCard({ label, value, note, tone = 'neutral' }) {
  return (
    <div className={`buffer-card buffer-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function EconTile({ icon: Icon, label, value, note }) {
  return (
    <div className="econ-tile">
      <span className="econ-tile-icon">
        <Icon size={16} />
      </span>
      <div>
        <span className="econ-tile-label">{label}</span>
        <strong>{value}</strong>
        {note && <small>{note}</small>}
      </div>
    </div>
  );
}

function FindingItem({ tone, title, text }) {
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'info' ? Activity : AlertTriangle;
  return (
    <div className={`finding-item finding-${tone}`}>
      <span className="finding-icon">
        <Icon size={16} />
      </span>
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="page-stack">
      <div className="stats-grid">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="skeleton skeleton-card" />
        ))}
      </div>
      <div className="skeleton skeleton-panel" />
    </div>
  );
}

export default function AnalysisPage({ plans, loading, onAddPlan }) {
  const [scope, setScope] = useState('all');
  const [commodity, setCommodity] = useState('all');

  const commodityOptions = useMemo(
    () => [...new Set((plans || []).map((plan) => plan.commodity))].sort((a, b) => a.localeCompare(b)),
    [plans]
  );

  const analysis = useMemo(
    () => analyzePlans(plans || [], { scope, commodity }),
    [plans, scope, commodity]
  );

  if (loading && !plans?.length) return <AnalysisSkeleton />;

  if (!plans || plans.length === 0) {
    return (
      <div className="panel">
        <EmptyState
          icon={BarChart3}
          title="Analisis belum bisa dibuat"
          description="Tambahkan minimal satu rencana tanam agar AgriInsight dapat menghitung omzet, biaya, margin, ROI, harga impas, sensitivitas, dan risiko usaha."
          action={
            <button type="button" className="button button-primary" onClick={onAddPlan}>
              <Plus size={15} /> Tambah rencana
            </button>
          }
        />
      </div>
    );
  }

  const totals = analysis.totals;
  const hasData = analysis.count > 0;
  const commodityRows = analysis.byCommodity;
  const planRows = analysis.economics;

  const priceData = analysis.sensitivity.price;
  const costData = analysis.sensitivity.cost;
  const yieldData = analysis.sensitivity.yield;
  const monthData = analysis.byMonth;
  const portfolio = analysis.portfolio;

  const filtersActive = scope !== 'all' || commodity !== 'all';

  return (
    <div className="page-stack">
      <section className="analysis-toolbar panel">
        <div className="analysis-toolbar-main">
          <div className="analysis-scope">
            <span className="eyebrow">CAKUPAN ANALISIS</span>
            <div className="segmented" role="group" aria-label="Cakupan analisis">
              {ANALYSIS_SCOPES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={scope === option.value ? 'active' : ''}
                  onClick={() => setScope(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <label className="filter-select analysis-commodity-filter">
            <span>Komoditas</span>
            <select value={commodity} onChange={(event) => setCommodity(event.target.value)}>
              <option value="all">Semua komoditas</option>
              {commodityOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <div className="analysis-toolbar-meta">
            <span>
              <Layers size={14} /> {analysis.count} rencana
            </span>
            <span>{number(hasData ? totals.area : 0, 2)} ha</span>
            <span className={`confidence-chip confidence-${analysis.confidence.tone}`}>
              Keyakinan data {analysis.confidence.score}% · {analysis.confidence.label}
            </span>
            {filtersActive && (
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setScope('all');
                  setCommodity('all');
                }}
              >
                <RotateCcw size={13} /> Reset filter
              </button>
            )}
          </div>
        </div>
      </section>

      {!hasData ? (
        <div className="panel">
          <EmptyState
            icon={Search}
            title="Tidak ada rencana pada filter ini"
            description="Cakupan atau komoditas yang dipilih belum memiliki rencana tanam. Ubah filter untuk melihat analisis lainnya."
            action={
              <button
                type="button"
                className="button button-ghost"
                onClick={() => {
                  setScope('all');
                  setCommodity('all');
                }}
              >
                <RotateCcw size={15} /> Reset filter
              </button>
            }
          />
        </div>
      ) : (
        <>
          <section className="stats-grid">
            <StatCard
              label="Estimasi omzet"
              value={compactRupiah(totals.revenue)}
              note={`${number(totals.yieldKg)} kg · ${number(totals.area, 2)} ha`}
              icon="wallet"
            />
            <StatCard
              label="Estimasi margin"
              value={compactRupiah(totals.margin)}
              note={`${percent(totals.marginPercent)} dari omzet`}
              trend={totals.margin >= 0 ? 'Menguntungkan' : 'Merugi'}
              trendTone={totals.margin >= 0 ? 'up' : 'down'}
              icon="trending"
            />
            <StatCard
              label="Return on investment"
              value={totals.roiPercent == null ? '—' : percent(totals.roiPercent)}
              note={`Biaya ${compactRupiah(totals.cost)}`}
              icon="sprout"
            />
            <StatCard
              label="Harga impas"
              value={`${rupiah(totals.breakEvenPrice)}/kg`}
              note={`Bantalan harga ${percent(totals.safetyMarginPercent)}`}
              icon="activity"
            />
          </section>

          <section className="analysis-health-grid">
            <article className="panel risk-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">KESEHATAN FINANSIAL</span>
                  <h3>Tingkat risiko usaha</h3>
                  <p className="subheading">
                    Gabungan bantalan harga, titik impas hasil, rasio biaya, rencana terburuk, dan
                    konsentrasi omzet.
                  </p>
                </div>
                <RiskBadge risk={totals.risk} />
              </div>

              <div className="risk-score-row">
                <div>
                  <strong>{totals.risk.score}</strong>
                  <span>/100</span>
                </div>
                <p>{riskNarrative(totals.risk)}</p>
              </div>

              <div className="risk-meter" aria-label={`Skor risiko ${totals.risk.score} dari 100`}>
                <span
                  className={`risk-meter-fill risk-meter-${totals.risk.tone}`}
                  style={{ width: `${Math.max(totals.risk.score, 2)}%` }}
                />
              </div>

              <div className="buffer-grid">
                <BufferCard
                  label="Harga boleh turun"
                  value={percent(totals.priceDropTolerancePercent)}
                  note="Sebelum margin habis"
                  tone={totals.priceDropTolerancePercent < 15 ? 'danger' : 'safe'}
                />
                <BufferCard
                  label="Biaya boleh naik"
                  value={totals.costIncreaseTolerancePercent == null ? '—' : percent(totals.costIncreaseTolerancePercent)}
                  note="Sebelum margin habis"
                  tone={
                    totals.costIncreaseTolerancePercent != null && totals.costIncreaseTolerancePercent < 20
                      ? 'danger'
                      : 'safe'
                  }
                />
                <BufferCard
                  label="Hasil boleh turun"
                  value={percent(totals.yieldDropTolerancePercent)}
                  note="Sebelum margin habis"
                  tone={totals.yieldDropTolerancePercent < 15 ? 'danger' : 'safe'}
                />
                <BufferCard
                  label="Titik impas hasil"
                  value={percent(totals.breakEvenYieldPercent)}
                  note="Dari estimasi panen"
                  tone={totals.breakEvenYieldPercent > 80 ? 'danger' : 'safe'}
                />
              </div>

              {totals.risk.drivers.length > 0 && (
                <div className="risk-drivers">
                  <span className="eyebrow">PENDORONG RISIKO</span>
                  <ul>
                    {totals.risk.drivers.map((driver) => (
                      <li key={driver.key}>
                        <AlertTriangle size={13} />
                        <span>{driver.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>

            <article className="panel portfolio-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">PORTOFOLIO</span>
                  <h3>Konsentrasi pendapatan</h3>
                  <p className="subheading">Seberapa bergantung omzet pada satu komoditas.</p>
                </div>
                <span className="panel-icon">
                  <Layers size={18} />
                </span>
              </div>

              <div className="portfolio-hero">
                <div>
                  <span>Indeks HHI</span>
                  <strong>{number(portfolio.hhi)}</strong>
                  <small>/ 10.000</small>
                </div>
                <span className={`risk-chip risk-chip-${portfolio.tone}`}>{portfolio.label}</span>
              </div>

              <div className="portfolio-stats">
                <div>
                  <span>Komoditas efektif</span>
                  <strong>{number(portfolio.effectiveCommodities, 1)}</strong>
                </div>
                <div>
                  <span>Pangsa terbesar</span>
                  <strong>{percent(portfolio.top?.revenueSharePercent || 0)}</strong>
                </div>
                <div>
                  <span>Komoditas</span>
                  <strong>{commodityRows.length}</strong>
                </div>
              </div>

              <div className="portfolio-list">
                {portfolio.shares.slice(0, 5).map((share) => (
                  <div key={share.commodity} className="portfolio-row">
                    <div className="portfolio-row-head">
                      <strong>{share.commodity}</strong>
                      <span>{percent(share.revenueSharePercent)}</span>
                    </div>
                    <div className="portfolio-track">
                      <span style={{ width: `${Math.max(share.revenueSharePercent, 2)}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <p className="chart-note">
                HHI &lt; 1.500 tergolong terdiversifikasi; di atas 2.500 berarti omzet sangat bergantung
                pada sedikit komoditas.
              </p>
            </article>
          </section>

          <section className="panel findings-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">TEMUAN OTOMATIS</span>
                <h3>Risiko dan rekomendasi utama</h3>
                <p className="subheading">
                  Diurutkan berdasarkan dampak terhadap margin dan keberlanjutan usaha.
                </p>
              </div>
              <span className="panel-icon">
                <ShieldCheck size={18} />
              </span>
            </div>
            <div className="finding-list">
              {analysis.findings.map((finding) => (
                <FindingItem key={finding.title} {...finding} />
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">UNIT ECONOMICS</span>
                <h3>Efisiensi per hektar dan per kilogram</h3>
                <p className="subheading">
                  Membandingkan nilai produksi terhadap luas lahan dan volume hasil panen.
                </p>
              </div>
              <span className="panel-icon">
                <Scale size={18} />
              </span>
            </div>

            <div className="econ-grid">
              <EconTile
                icon={Sprout}
                label="Hasil per hektar"
                value={`${number(totals.yieldPerHa)} kg/ha`}
                note={`Rata-rata ${number(totals.area > 0 ? totals.yieldKg / totals.area : 0)} kg/ha`}
              />
              <EconTile
                icon={Wallet}
                label="Omzet per hektar"
                value={compactRupiah(totals.revenuePerHa)}
                note="Pendapatan kotor per ha"
              />
              <EconTile
                icon={Activity}
                label="Biaya per hektar"
                value={compactRupiah(totals.costPerHa)}
                note="Biaya produksi per ha"
              />
              <EconTile
                icon={TrendingUp}
                label="Margin per hektar"
                value={compactRupiah(totals.marginPerHa)}
                note="Laba kotor per ha"
              />
              <EconTile
                icon={CircleDollarSign}
                label="Biaya per kilogram"
                value={`${rupiah(totals.costPerKg)}/kg`}
                note="Harga impas per kg"
              />
              <EconTile
                icon={Percent}
                label="Margin per kilogram"
                value={`${rupiah(totals.marginPerKg)}/kg`}
                note="Selisih harga jual dan impas"
              />
              <EconTile
                icon={Target}
                label="Titik impas hasil"
                value={`${number(totals.breakEvenYieldKg)} kg`}
                note={`${percent(totals.breakEvenYieldPercent)} dari estimasi`}
              />
              <EconTile
                icon={Gauge}
                label="Rasio biaya"
                value={percent(totals.costRatioPercent)}
                note="Porsi omzet untuk biaya"
              />
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">SKENARIO</span>
                <h3>Proyeksi pesimis, realistis, dan optimis</h3>
                <p className="subheading">
                  Menguji dampak perubahan harga, hasil panen, dan biaya secara bersamaan.
                </p>
              </div>
              <span className="panel-icon">
                <Gauge size={18} />
              </span>
            </div>

            <div className="scenario-grid">
              {analysis.scenarios.map((scenario) => (
                <article
                  key={scenario.key}
                  className={`scenario-card scenario-${scenario.tone}${scenario.key === 'base' ? ' is-base' : ''}`}
                >
                  <div className="scenario-head">
                    <div>
                      <strong>{scenario.label}</strong>
                      <p>{scenario.description}</p>
                    </div>
                    <span className={`badge ${scenario.profitable ? 'badge-success' : 'badge-danger'}`}>
                      {scenario.profitable ? 'Untung' : 'Rugi'}
                    </span>
                  </div>
                  <span className="scenario-label">Estimasi margin</span>
                  <strong className={`scenario-margin ${scenario.margin >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {compactRupiah(scenario.margin)}
                  </strong>
                  <span className="scenario-sub">{percent(scenario.marginPercent)} dari omzet</span>
                  <div className="scenario-metrics">
                    <div>
                      <span>Omzet</span>
                      <strong>{compactRupiah(scenario.revenue)}</strong>
                    </div>
                    <div>
                      <span>Biaya</span>
                      <strong>{compactRupiah(scenario.cost)}</strong>
                    </div>
                    <div>
                      <span>ROI</span>
                      <strong>{scenario.roiPercent == null ? '—' : percent(scenario.roiPercent)}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <p className="chart-note">
              Skenario diterapkan seragam pada seluruh rencana dalam cakupan ini. Angka bersifat simulasi,
              bukan prediksi pasar.
            </p>
          </section>

          <section className="dashboard-grid">
            <article className="panel chart-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">SENSITIVITAS HARGA</span>
                  <h3>Margin terhadap perubahan harga jual</h3>
                  <p className="subheading">
                    Hasil panen dan biaya dianggap tetap. Garis nol adalah batas rugi.
                  </p>
                </div>
              </div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceData} margin={{ top: 16, right: 14, left: -8, bottom: 0 }}>
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
                      tickFormatter={compactRupiah}
                      width={82}
                    />
                    <Tooltip {...tooltipStyle} />
                    <ReferenceLine y={0} stroke="#b5483b" strokeDasharray="4 4" />
                    <Line
                      type="monotone"
                      dataKey="margin"
                      name="Margin"
                      stroke="#2f7652"
                      strokeWidth={2.5}
                      dot={{ r: 3.5, fill: '#2f7652' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="chart-note">
                Harga impas {rupiah(totals.breakEvenPrice)}/kg. Margin habis jika harga turun sekitar{' '}
                {percent(totals.safetyMarginPercent)} dari harga rata-rata saat ini.
              </p>
            </article>

            <article className="panel chart-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">SENSITIVITAS BIAYA</span>
                  <h3>Margin terhadap perubahan biaya produksi</h3>
                  <p className="subheading">
                    Harga jual dan hasil panen dianggap tetap.
                  </p>
                </div>
              </div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costData} margin={{ top: 16, right: 8, left: -8, bottom: 0 }}>
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
                      tickFormatter={compactRupiah}
                      width={82}
                    />
                    <Tooltip {...tooltipStyle} />
                    <ReferenceLine y={0} stroke="#b5483b" strokeDasharray="4 4" />
                    <Bar dataKey="margin" name="Margin" radius={[6, 6, 0, 0]} maxBarSize={38}>
                      {costData.map((row) => (
                        <Cell key={row.label} fill={row.margin >= 0 ? '#d9a441' : '#c05545'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="chart-note">
                Biaya dapat naik hingga{' '}
                {totals.costIncreaseTolerancePercent == null
                  ? 'tidak terbatas'
                  : percent(totals.costIncreaseTolerancePercent)}{' '}
                sebelum margin menjadi nol.
              </p>
            </article>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">SENSITIVITAS HASIL</span>
                <h3>Dampak penurunan hasil panen</h3>
                <p className="subheading">
                  Menguji ketahanan margin jika produktivitas di bawah estimasi.
                </p>
              </div>
              <span className="panel-icon">
                <Sprout size={18} />
              </span>
            </div>

            <div className="sensitivity-strip">
              {yieldData.map((row) => (
                <div
                  key={row.label}
                  className={`sensitivity-card${row.profitable ? '' : ' is-negative'}${row.step === 0 ? ' is-current' : ''}`}
                >
                  <span>{row.label}</span>
                  <strong className={row.margin >= 0 ? 'text-positive' : 'text-negative'}>
                    {compactRupiah(row.margin)}
                  </strong>
                  <small>{number(row.yieldKg)} kg hasil</small>
                  <small>{percent(row.marginPercent)} margin</small>
                </div>
              ))}
            </div>
            <p className="chart-note">
              Batas aman: hasil panen tidak boleh turun lebih dari{' '}
              {percent(totals.yieldDropTolerancePercent)} dari estimasi agar margin tetap positif.
            </p>
          </section>

          <section className="dashboard-grid">
            <article className="panel chart-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">PERBANDINGAN KOMODITAS</span>
                  <h3>Omzet vs biaya produksi</h3>
                  <p className="subheading">Nilai rupiah berdasarkan estimasi hasil dan harga input Anda.</p>
                </div>
                <span className="panel-icon">
                  <BarChart3 size={18} />
                </span>
              </div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[...commodityRows].sort((a, b) => b.revenue - a.revenue)}
                    margin={{ top: 14, right: 8, left: -8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8eee6" />
                    <XAxis
                      dataKey="commodity"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#829087', fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#829087', fontSize: 11 }}
                      tickFormatter={compactRupiah}
                      width={78}
                    />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="revenue" name="Omzet" fill="#2f7652" radius={[6, 6, 0, 0]} maxBarSize={30} />
                    <Bar dataKey="cost" name="Biaya" fill="#d9a441" radius={[6, 6, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-legend">
                <span><i className="dot dot-green" /> Omzet</span>
                <span><i className="dot dot-gold" /> Biaya produksi</span>
              </div>
            </article>

            <article className="panel chart-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">PROFITABILITAS</span>
                  <h3>Margin per komoditas</h3>
                  <p className="subheading">Selisih omzet dikurangi biaya produksi.</p>
                </div>
              </div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[...commodityRows].sort((a, b) => b.margin - a.margin)}
                    layout="vertical"
                    margin={{ top: 8, right: 20, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e8eee6" />
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#829087', fontSize: 11 }}
                      tickFormatter={compactRupiah}
                    />
                    <YAxis
                      type="category"
                      dataKey="commodity"
                      axisLine={false}
                      tickLine={false}
                      width={88}
                      tick={{ fill: '#4f6658', fontSize: 11 }}
                    />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="margin" name="Margin" radius={[0, 6, 6, 0]} maxBarSize={22}>
                      {[...commodityRows]
                        .sort((a, b) => b.margin - a.margin)
                        .map((item) => (
                          <Cell key={item.commodity} fill={item.margin >= 0 ? '#2f7652' : '#c05545'} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </section>

          <section className="panel chart-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">PROYEKSI BULANAN</span>
                <h3>Margin dan akumulasi margin per bulan panen</h3>
                <p className="subheading">
                  Berdasarkan estimasi tanggal panen. Rencana tanpa tanggal panen memakai tanggal tanam.
                </p>
              </div>
              <span className="panel-icon">
                <Activity size={18} />
              </span>
            </div>

            {monthData.length > 0 ? (
              <>
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthData} margin={{ top: 16, right: 10, left: -8, bottom: 0 }}>
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
                        tickFormatter={compactRupiah}
                        width={80}
                      />
                      <Tooltip {...tooltipStyle} />
                      <ReferenceLine y={0} stroke="#b5483b" strokeDasharray="4 4" />
                      <Bar dataKey="margin" name="Margin bulanan" fill="#d9a441" radius={[6, 6, 0, 0]} maxBarSize={34} />
                      <Line
                        type="monotone"
                        dataKey="cumulativeMargin"
                        name="Akumulasi margin"
                        stroke="#2f7652"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-legend">
                  <span><i className="dot dot-gold" /> Margin bulanan</span>
                  <span><i className="dot dot-green" /> Akumulasi margin</span>
                </div>
              </>
            ) : (
              <EmptyState
                icon={Activity}
                title="Belum ada proyeksi bulanan"
                description="Lengkapi tanggal tanam atau panen pada rencana tanam."
                compact
              />
            )}
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">RANKING KOMODITAS</span>
                <h3>Rincian kelayakan dan efisiensi</h3>
                <p className="subheading">
                  Harga impas = biaya produksi dibagi estimasi hasil. Bantalan harga = selisih harga
                  terhadap titik impas.
                </p>
              </div>
            </div>
            <div className="table-wrap">
              <table className="analysis-table">
                <thead>
                  <tr>
                    <th>Komoditas</th>
                    <th>Rencana</th>
                    <th>Luas</th>
                    <th>Hasil</th>
                    <th>Hasil/ha</th>
                    <th>Harga avg</th>
                    <th>Harga impas</th>
                    <th>Bantalan</th>
                    <th>Omzet</th>
                    <th>Biaya</th>
                    <th>Margin</th>
                    <th>Margin %</th>
                    <th>ROI</th>
                    <th>Risiko</th>
                  </tr>
                </thead>
                <tbody>
                  {commodityRows.map((item) => (
                    <tr key={item.commodity}>
                      <td>
                        <strong>{item.commodity}</strong>
                        <small>{percent(item.revenueSharePercent)} omzet</small>
                      </td>
                      <td>{item.planCount}</td>
                      <td>{number(item.area, 2)} ha</td>
                      <td>{number(item.yieldKg)} kg</td>
                      <td>{number(item.yieldPerHa)} kg</td>
                      <td>{rupiah(item.averagePrice)}/kg</td>
                      <td>
                        <span className={item.averagePrice < item.breakEvenPrice ? 'text-negative' : 'text-positive'}>
                          {rupiah(item.breakEvenPrice)}/kg
                        </span>
                      </td>
                      <td>
                        <span className={item.safetyMarginPercent < 0 ? 'text-negative' : 'text-positive'}>
                          {percent(item.safetyMarginPercent)}
                        </span>
                      </td>
                      <td>{rupiah(item.revenue)}</td>
                      <td>{rupiah(item.cost)}</td>
                      <td className={item.margin >= 0 ? 'text-positive' : 'text-negative'}>
                        {rupiah(item.margin)}
                      </td>
                      <td>{percent(item.marginPercent)}</td>
                      <td>{item.roiPercent == null ? '—' : percent(item.roiPercent)}</td>
                      <td><span className={`risk-chip risk-chip-${item.risk.tone}`}>{item.risk.level}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">PER RENCANA</span>
                <h3>Detail ekonomi setiap rencana tanam</h3>
                <p className="subheading">
                  Diurutkan dari margin tertinggi. Gunakan tabel ini untuk menemukan rencana yang perlu
                  dievaluasi.
                </p>
              </div>
              <span className="panel-icon">
                <Layers size={18} />
              </span>
            </div>
            <div className="table-wrap">
              <table className="analysis-table">
                <thead>
                  <tr>
                    <th>Komoditas</th>
                    <th>Lokasi</th>
                    <th>Status</th>
                    <th>Luas</th>
                    <th>Hasil</th>
                    <th>Harga</th>
                    <th>Harga impas</th>
                    <th>Margin</th>
                    <th>Margin %</th>
                    <th>ROI</th>
                    <th>Panen</th>
                    <th>Risiko</th>
                  </tr>
                </thead>
                <tbody>
                  {[...planRows]
                    .sort((a, b) => b.margin - a.margin)
                    .map((plan) => (
                      <tr key={plan.id}>
                        <td><strong>{plan.commodity}</strong></td>
                        <td>{plan.location}</td>
                        <td><StatusBadge status={plan.status} /></td>
                        <td>{number(plan.area, 2)} ha</td>
                        <td>{number(plan.yieldKg)} kg</td>
                        <td>{rupiah(plan.averagePrice)}/kg</td>
                        <td>
                          <span className={plan.averagePrice < plan.breakEvenPrice ? 'text-negative' : 'text-positive'}>
                            {rupiah(plan.breakEvenPrice)}/kg
                          </span>
                        </td>
                        <td className={plan.margin >= 0 ? 'text-positive' : 'text-negative'}>
                          {rupiah(plan.margin)}
                        </td>
                        <td>{percent(plan.marginPercent)}</td>
                        <td>{plan.roiPercent == null ? '—' : percent(plan.roiPercent)}</td>
                        <td>{formatDate(plan.expected_harvest_date)}</td>
                        <td><span className={`risk-chip risk-chip-${plan.risk.tone}`}>{plan.risk.level}</span></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel methodology-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">METODOLOGI</span>
                <h3>Rumus, asumsi, dan keterbatasan</h3>
                <p className="subheading">
                  Transparansi perhitungan agar keputusan usaha dapat diverifikasi.
                </p>
              </div>
              <span className="panel-icon">
                <ShieldCheck size={18} />
              </span>
            </div>

            <div className="methodology-grid">
              <div>
                <strong>Rumus utama</strong>
                <ul>
                  <li>Omzet = estimasi hasil × harga jual</li>
                  <li>Margin = omzet − biaya produksi</li>
                  <li>Margin % = margin ÷ omzet</li>
                  <li>ROI = margin ÷ biaya produksi</li>
                  <li>Harga impas = biaya produksi ÷ estimasi hasil</li>
                  <li>Titik impas hasil = biaya produksi ÷ harga jual</li>
                  <li>Bantalan harga = (harga − harga impas) ÷ harga</li>
                  <li>Skor risiko = 45% risiko tertimbang omzet + 30% rencana terburuk + 25% konsentrasi</li>
                </ul>
              </div>
              <div>
                <strong>Asumsi simulasi</strong>
                <ul>
                  <li>Pesimis: harga −10%, hasil −10%, biaya +10%</li>
                  <li>Realistis: sesuai input saat ini</li>
                  <li>Optimis: harga +10%, hasil +5%, biaya −5%</li>
                  <li>Faktor diterapkan seragam pada semua rencana</li>
                  <li>Biaya dianggap tetap saat hasil panen berubah</li>
                </ul>
              </div>
              <div>
                <strong>Keterbatasan</strong>
                <ul>
                  <li>Belum memasukkan pajak, bunga pinjaman, dan biaya penyusutan</li>
                  <li>Belum terhubung harga pasar aktual dan data cuaca</li>
                  <li>Hasil aktual dapat berbeda karena hama, cuaca, dan mutu panen</li>
                  <li>Gunakan analisis ini sebagai alat bantu, bukan satu-satunya dasar keputusan</li>
                </ul>
              </div>
            </div>

            <div className="methodology-confidence">
              <div>
                <span>Keyakinan data saat ini</span>
                <strong>{analysis.confidence.score}%</strong>
                <span className={`confidence-chip confidence-${analysis.confidence.tone}`}>
                  {analysis.confidence.label}
                </span>
              </div>
              <p>
                Dihitung dari kelengkapan 8 field pada {analysis.count} rencana dalam cakupan ini.
                Semakin lengkap data, semakin dapat diandalkan analisisnya.
              </p>
            </div>
          </section>

          <section className="panel analysis-footer-note">
            <div>
              <Target size={20} />
              <div>
                <strong>Tingkatkan akurasi analisis</strong>
                <p>
                  Perbarui hasil panen aktual, biaya riil, dan harga jual setelah musim selesai. Lengkapi
                  tanggal tanam serta panen agar proyeksi bulanan dan sensitivitas lebih tepat.
                </p>
              </div>
            </div>
            <span className="analysis-note-arrow">
              <ArrowRight size={18} />
            </span>
          </section>
        </>
      )}
    </div>
  );
}
