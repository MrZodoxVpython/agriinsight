import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Plus,
  Target,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import StatCard from '../components/StatCard';
import { EmptyState } from '../components/ui';
import { compactRupiah, number, percent, rupiah } from '../lib/format';

const tooltipStyle = {
  contentStyle: {
    borderRadius: 12,
    border: '1px solid #e2e9e1',
    boxShadow: '0 12px 30px rgba(20, 52, 38, 0.12)',
    fontSize: 12,
  },
  formatter: (value) => [rupiah(value), ''],
};

export default function AnalysisPage({ summary, loading, onAddPlan }) {
  if (loading && !summary) {
    return (
      <div className="page-stack">
        <div className="stats-grid">
          {[0, 1, 2, 3].map((item) => <div key={item} className="skeleton skeleton-card" />)}
        </div>
        <div className="skeleton skeleton-panel" />
      </div>
    );
  }

  if (!summary || summary.plan_count === 0) {
    return (
      <div className="panel">
        <EmptyState
          icon={BarChart3}
          title="Analisis belum bisa dibuat"
          description="Tambahkan minimal satu rencana tanam agar AgriInsight dapat menghitung omzet, biaya, margin, ROI, dan harga impas."
          action={
            <button type="button" className="button button-primary" onClick={onAddPlan}>
              <Plus size={15} /> Tambah rencana
            </button>
          }
        />
      </div>
    );
  }

  const commodities = summary.by_commodity || [];
  const best = commodities[0];
  const risky = commodities.filter(
    (item) => item.average_price > 0 && item.average_price < item.break_even_price
  );
  const bestRoi = [...commodities].sort((a, b) => (b.roi_percent ?? -Infinity) - (a.roi_percent ?? -Infinity))[0];
  const chartData = [...commodities].sort((a, b) => b.estimated_revenue - a.estimated_revenue);
  const marginData = [...commodities].sort(
    (a, b) => b.estimated_gross_margin - a.estimated_gross_margin
  );

  return (
    <div className="page-stack">
      <section className="stats-grid">
        <StatCard
          label="Estimasi omzet"
          value={compactRupiah(summary.estimated_revenue)}
          note={`${number(summary.estimated_yield_kg)} kg hasil panen`}
          icon="wallet"
        />
        <StatCard
          label="Total biaya produksi"
          value={compactRupiah(summary.estimated_cost)}
          note={`${percent(summary.estimated_cost > 0 ? (summary.estimated_cost / summary.estimated_revenue) * 100 : 0)} dari omzet`}
          icon="activity"
        />
        <StatCard
          label="Estimasi margin"
          value={compactRupiah(summary.estimated_gross_margin)}
          note={`${percent(summary.margin_percent)} margin bersih`}
          trend={summary.estimated_gross_margin >= 0 ? 'Menguntungkan' : 'Merugi'}
          trendTone={summary.estimated_gross_margin >= 0 ? 'up' : 'down'}
          icon="trending"
        />
        <StatCard
          label="Return on investment"
          value={summary.roi_percent == null ? '—' : percent(summary.roi_percent)}
          note={`Harga impas ${rupiah(summary.break_even_price)}/kg`}
          icon="sprout"
        />
      </section>

      <section className="analysis-insights">
        <article className="analysis-callout callout-success">
          <span><TrendingUp size={18} /></span>
          <div>
            <strong>Kontribusi margin terbesar</strong>
            <p>
              {best.commodity} menyumbang margin {rupiah(best.estimated_gross_margin)} dari{' '}
              {best.plan_count} rencana.
            </p>
          </div>
        </article>
        <article className="analysis-callout callout-info">
          <span><Target size={18} /></span>
          <div>
            <strong>ROI terbaik</strong>
            <p>
              {bestRoi?.commodity || '—'} dengan ROI{' '}
              {bestRoi?.roi_percent == null ? 'belum tersedia' : percent(bestRoi.roi_percent)}.
            </p>
          </div>
        </article>
        <article className={`analysis-callout ${risky.length ? 'callout-danger' : 'callout-success'}`}>
          <span>{risky.length ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}</span>
          <div>
            <strong>{risky.length ? 'Risiko harga jual' : 'Harga jual aman'}</strong>
            <p>
              {risky.length
                ? `${risky.map((item) => item.commodity).join(', ')} memiliki harga jual di bawah harga impas.`
                : 'Semua komoditas memiliki target harga di atas harga impas.'}
            </p>
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">PERBANDINGAN KOMODITAS</span>
              <h3>Omzet vs biaya produksi</h3>
              <p className="subheading">Nilai rupiah berdasarkan estimasi hasil dan harga input Anda.</p>
            </div>
            <span className="panel-icon"><BarChart3 size={18} /></span>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 14, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8eee6" />
                <XAxis dataKey="commodity" axisLine={false} tickLine={false} tick={{ fill: '#829087', fontSize: 11 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#829087', fontSize: 11 }}
                  tickFormatter={compactRupiah}
                  width={78}
                />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="estimated_revenue" name="Omzet" fill="#2f7652" radius={[6, 6, 0, 0]} maxBarSize={30} />
                <Bar dataKey="estimated_cost" name="Biaya" fill="#d9a441" radius={[6, 6, 0, 0]} maxBarSize={30} />
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
              <BarChart data={marginData} layout="vertical" margin={{ top: 8, right: 20, left: 8, bottom: 0 }}>
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
                <Bar dataKey="estimated_gross_margin" name="Margin" radius={[0, 6, 6, 0]} maxBarSize={22}>
                  {marginData.map((item) => (
                    <Cell key={item.commodity} fill={item.estimated_gross_margin >= 0 ? '#2f7652' : '#c05545'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">RANKING</span>
            <h3>Rincian kelayakan per komoditas</h3>
            <p className="subheading">
              Harga impas = total biaya produksi dibagi estimasi hasil panen.
            </p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Komoditas</th>
                <th>Rencana</th>
                <th>Luas</th>
                <th>Hasil</th>
                <th>Harga rata-rata</th>
                <th>Harga impas</th>
                <th>Omzet</th>
                <th>Margin</th>
                <th>Margin %</th>
                <th>ROI</th>
              </tr>
            </thead>
            <tbody>
              {commodities.map((item) => {
                const belowBreakEven = item.average_price > 0 && item.average_price < item.break_even_price;
                return (
                  <tr key={item.commodity}>
                    <td><strong>{item.commodity}</strong></td>
                    <td>{item.plan_count}</td>
                    <td>{number(item.total_area_ha, 2)} ha</td>
                    <td>{number(item.estimated_yield_kg)} kg</td>
                    <td>{rupiah(item.average_price)}/kg</td>
                    <td>
                      <span className={belowBreakEven ? 'text-negative' : 'text-positive'}>
                        {rupiah(item.break_even_price)}/kg
                      </span>
                    </td>
                    <td>{rupiah(item.estimated_revenue)}</td>
                    <td className={item.estimated_gross_margin >= 0 ? 'text-positive' : 'text-negative'}>
                      {rupiah(item.estimated_gross_margin)}
                    </td>
                    <td>{percent(item.margin_percent)}</td>
                    <td>{item.roi_percent == null ? '—' : percent(item.roi_percent)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="chart-note">
          Semua angka adalah estimasi berdasarkan input Anda, bukan prediksi hasil aktual. Validasi
          dengan data lapangan dan harga pasar setempat.
        </p>
      </section>

      <section className="panel analysis-footer-note">
        <div>
          <Target size={20} />
          <div>
            <strong>Tips meningkatkan akurasi analisis</strong>
            <p>
              Perbarui hasil panen aktual, biaya riil, dan harga jual setelah musim selesai. Lengkapi
              tanggal tanam serta panen agar proyeksi bulanan lebih tepat.
            </p>
          </div>
        </div>
        <span className="analysis-note-arrow"><ArrowRight size={18} /></span>
      </section>
    </div>
  );
}
