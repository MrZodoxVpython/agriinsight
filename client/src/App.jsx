import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, CloudSun, Database, Leaf, Menu, Sprout, TrendingUp, Wallet, Warehouse } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, clearToken, getToken, setToken } from './api';

const demoPrices = [
  { month: 'Jun', price: 28000 }, { month: 'Jul', price: 26500 }, { month: 'Agu', price: 31000 },
  { month: 'Sep', price: 29500 }, { month: 'Okt', price: 34000 }, { month: 'Nov', price: 32500 }
];
const initialMetrics = [
  { label: 'Komoditas dipantau', value: '12', note: 'Data contoh', icon: Sprout, trend: '+2' },
  { label: 'Catatan produksi', value: '248', note: 'Data contoh', icon: Warehouse, trend: '+8,4%' },
  { label: 'Harga rata-rata', value: 'Rp 32.500', note: 'Per kg · data contoh', icon: TrendingUp, trend: '+4,2%' },
  { label: 'Kelengkapan data', value: '68%', note: 'Simulasi dashboard', icon: Database, trend: '+6%' }
];

function StatCard({ item }) {
  const Icon = item.icon;
  return <article className="stat-card"><div className="stat-top"><span>{item.label}</span><span className="stat-icon"><Icon size={18}/></span></div><strong>{item.value}</strong><div className="stat-bottom"><span className="trend"><ArrowUpRight size={14}/>{item.trend}</span><span>{item.note}</span></div></article>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [authMessage, setAuthMessage] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ commodity: 'Cabai', location: '', planted_area_ha: '', planting_date: '', expected_harvest_date: '', estimated_yield_kg: '', production_cost: '', expected_price: '' });
  const [apiStatus, setApiStatus] = useState('Memeriksa koneksi');

  useEffect(() => {
    if (!getToken()) return;
    api.me()
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => { clearToken(); setUser(null); });
  }, []);

  useEffect(() => {
    api.health()
      .then((result) => setApiStatus(result.database === 'connected' ? 'Backend & database terhubung' : 'Database belum terhubung'))
      .catch(() => setApiStatus('Backend belum terhubung'));
  }, []);

  useEffect(() => { if (user) loadRecords(); else setRecords([]); }, [user]);

  async function loadRecords() {
    setLoading(true);
    try {
      setRecords(await api.listPlans());
    } catch (error) {
      if (error.status === 401) { clearToken(); setUser(null); }
      setAuthMessage(`Gagal memuat rencana: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleAuth(event) {
    event.preventDefault(); setAuthMessage('');
    try {
      const result = authMode === 'login'
        ? await api.login({ email, password })
        : await api.register({ email, password });
      setToken(result.token);
      setUser(result.user);
      setPassword('');
      setAuthMessage(authMode === 'login' ? 'Berhasil masuk.' : 'Akun berhasil dibuat.');
    } catch (error) {
      setAuthMessage(error.message);
    }
  }

  async function savePlan(event) {
    event.preventDefault();
    if (!user) return setAuthMessage('Silakan masuk terlebih dahulu.');
    const payload = {
      commodity: form.commodity, location: form.location.trim(),
      planted_area_ha: Number(form.planted_area_ha), planting_date: form.planting_date || null,
      expected_harvest_date: form.expected_harvest_date || null, estimated_yield_kg: Number(form.estimated_yield_kg),
      production_cost: Number(form.production_cost || 0), expected_price: Number(form.expected_price)
    };
    if (!payload.location || !payload.planted_area_ha || !payload.estimated_yield_kg || !payload.expected_price || Number.isNaN(payload.production_cost)) {
      setAuthMessage('Lengkapi lokasi, luas lahan, estimasi hasil, biaya, dan harga.'); return;
    }
    try {
      await api.createPlan(payload);
      setAuthMessage('Rencana tanam berhasil disimpan.'); setShowForm(false); setForm({ commodity: 'Cabai', location: '', planted_area_ha: '', planting_date: '', expected_harvest_date: '', estimated_yield_kg: '', production_cost: '', expected_price: '' }); loadRecords();
    } catch (error) {
      if (error.status === 401) { clearToken(); setUser(null); }
      setAuthMessage(error.message);
    }
  }

  const estimatedRevenue = useMemo(() => records.reduce((sum, row) => sum + (Number(row.estimated_yield_kg || 0) * Number(row.expected_price || 0)), 0), [records]);
  const metrics = initialMetrics.map((m, i) => i === 0 ? { ...m, value: user ? String(records.length) : '12' } : m);

  return <div className="app-shell">
    <aside className="sidebar"><a className="brand" href="#home"><span className="brand-mark"><Leaf size={20}/></span><span>Agri<span>Insight</span></span></a><div className="workspace-label">WORKSPACE</div><a className="side-link active" href="#home"><Activity size={17}/> Ringkasan</a><a className="side-link" href="#plans"><Sprout size={17}/> Rencana tanam</a><a className="side-link" href="#market"><TrendingUp size={17}/> Analisis pasar</a><a className="side-link" href="#data"><Database size={17}/> Kualitas data</a><div className="sidebar-bottom"><div className="status-dot"/><span>{apiStatus}</span></div></aside>
    <main className="main-content" id="home"><header className="topbar"><div><div className="eyebrow">AGRICULTURE BUSINESS INTELLIGENCE</div><h1>Dashboard pertanian</h1></div><div className="top-actions">{user ? <><span className="user-email">{user.email}</span><button className="button button-light" onClick={() => { clearToken(); setUser(null); setRecords([]); setAuthMessage(''); }}>Keluar</button></> : <a className="button button-primary" href="#account">Masuk / Daftar</a>}</div></header>
      <section className="welcome"><div><span className="welcome-tag">DATA-DRIVEN FARMING</span><h2>Keputusan yang lebih baik<br/>dimulai dari <em>data.</em></h2><p>Pahami risiko, hitung kelayakan, dan rencanakan produksi pertanian berdasarkan informasi yang dapat diperiksa.</p><a className="button button-gold" href="#plans">Kelola rencana tanam <ArrowDownRight size={16}/></a></div><div className="welcome-art"><div className="sun"/><div className="hill hill-one"/><div className="hill hill-two"/><div className="field-lines"/></div></section>
      <section className="stats-grid">{metrics.map((item) => <StatCard key={item.label} item={item}/>)}</section>
      <section className="content-grid" id="market"><article className="panel chart-panel"><div className="panel-heading"><div><span className="eyebrow">MARKET OVERVIEW</span><h3>Tren harga komoditas</h3></div><span className="sample-label">DATA ILUSTRASI</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={demoPrices} margin={{ top: 12, right: 12, left: -14, bottom: 0 }}><defs><linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2c7751" stopOpacity={0.22}/><stop offset="95%" stopColor="#2c7751" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8eee6"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#829087', fontSize: 12 }}/><YAxis axisLine={false} tickLine={false} tick={{ fill: '#829087', fontSize: 11 }} tickFormatter={v => `${v/1000}k`}/><Tooltip formatter={v => [`Rp ${Number(v).toLocaleString('id-ID')}/kg`, 'Harga']}/><Area type="monotone" dataKey="price" stroke="#2c7751" strokeWidth={3} fill="url(#priceFill)"/></AreaChart></ResponsiveContainer></div><p className="chart-note">Grafik menggunakan data ilustrasi. Hubungkan sumber harga resmi atau input pasar untuk analisis aktual.</p></article>
      <article className="panel insight-panel"><div className="panel-heading"><div><span className="eyebrow">DECISION SUPPORT</span><h3>Prioritas analisis</h3></div><CloudSun size={21}/></div><div className="insight-item"><span className="insight-number">01</span><div><strong>Validasi pasar</strong><p>Pastikan calon pembeli, kisaran harga, dan standar mutu sebelum menentukan volume tanam.</p></div></div><div className="insight-item"><span className="insight-number">02</span><div><strong>Ukur biaya produksi</strong><p>Catat input, tenaga kerja, sewa, air, panen, dan distribusi untuk menghitung margin.</p></div></div><div className="insight-item"><span className="insight-number">03</span><div><strong>Periksa risiko iklim</strong><p>Gunakan data cuaca dan kondisi lahan yang sesuai dengan lokasi budidaya.</p></div></div></article></section>
      <section className="panel plans-panel" id="plans"><div className="panel-heading"><div><span className="eyebrow">FARM PLANNING</span><h3>Rencana tanam terbaru</h3><p className="subheading">Simpan rencana dan estimasi usaha Anda di Supabase.</p></div><button className="button button-primary" onClick={() => setShowForm(v => !v)}>{showForm ? 'Tutup formulir' : '+ Tambah rencana'}</button></div>
        {showForm && <form className="plan-form" onSubmit={savePlan}><label>Komoditas<select value={form.commodity} onChange={e => setForm({...form, commodity:e.target.value})}><option>Cabai</option><option>Padi</option><option>Jagung</option><option>Tomat</option><option>Bawang merah</option><option>Sayuran</option><option>Lainnya</option></select></label><label>Lokasi lahan<input value={form.location} onChange={e => setForm({...form, location:e.target.value})} placeholder="Desa, kecamatan, kabupaten"/></label><label>Luas lahan (ha)<input type="number" min="0.01" step="0.01" value={form.planted_area_ha} onChange={e => setForm({...form, planted_area_ha:e.target.value})}/></label><label>Tanggal tanam<input type="date" value={form.planting_date} onChange={e => setForm({...form, planting_date:e.target.value})}/></label><label>Estimasi panen (tanggal)<input type="date" value={form.expected_harvest_date} onChange={e => setForm({...form, expected_harvest_date:e.target.value})}/></label><label>Estimasi hasil (kg)<input type="number" min="1" value={form.estimated_yield_kg} onChange={e => setForm({...form, estimated_yield_kg:e.target.value})}/></label><label>Biaya produksi (Rp)<input type="number" min="1" value={form.production_cost} onChange={e => setForm({...form, production_cost:e.target.value})}/></label><label>Target harga jual (Rp/kg)<input type="number" min="1" value={form.expected_price} onChange={e => setForm({...form, expected_price:e.target.value})}/></label><button className="button button-primary" type="submit">Simpan ke database</button></form>}
        {authMessage && <div className="notice" role="status">{authMessage}</div>}
        {!user ? <div className="empty-state"><Database size={25}/><strong>Masuk untuk menyimpan data</strong><p>Rencana tanam akan disimpan pada akun Anda, bukan hanya di browser.</p></div> : loading ? <p className="muted">Memuat data...</p> : records.length ? <div className="table-wrap"><table><thead><tr><th>Komoditas</th><th>Lokasi</th><th>Luas</th><th>Estimasi hasil</th><th>Potensi omzet*</th></tr></thead><tbody>{records.map(row => <tr key={row.id}><td><strong>{row.commodity}</strong></td><td>{row.location}</td><td>{row.planted_area_ha} ha</td><td>{Number(row.estimated_yield_kg).toLocaleString('id-ID')} kg</td><td>Rp {(Number(row.estimated_yield_kg)*Number(row.expected_price)).toLocaleString('id-ID')}</td></tr>)}</tbody></table><p className="chart-note">*Omzet kotor indikatif, belum dikurangi biaya dan susut. Total estimasi omzet tersimpan: Rp {estimatedRevenue.toLocaleString('id-ID')}.</p></div> : <div className="empty-state"><Sprout size={25}/><strong>Belum ada rencana tanam</strong><p>Tambahkan rencana pertama untuk mulai membangun riwayat data usaha.</p></div>}
      </section>
      <section className="bottom-grid" id="data"><article className="panel data-panel"><div className="panel-heading"><div><span className="eyebrow">DATA QUALITY</span><h3>Data yang perlu dikumpulkan</h3></div><Database size={20}/></div><div className="data-tags"><span>Cuaca & iklim</span><span>pH dan nutrisi tanah</span><span>Produksi per musim</span><span>Harga pasar</span><span>Biaya input</span><span>Permintaan pembeli</span><span>Susut pascapanen</span><span>Biaya logistik</span></div></article><article className="panel account-panel" id="account"><div className="panel-heading"><div><span className="eyebrow">ACCOUNT</span><h3>{user ? 'Akun aktif' : 'Mulai gunakan AgriInsight'}</h3></div><Wallet size={20}/></div>{user ? <p className="muted">Anda masuk sebagai {user.email}. Data rencana tanam tersimpan pada akun ini.</p> : <form className="auth-form" onSubmit={handleAuth}><div className="auth-switch"><button type="button" className={authMode==='login'?'selected':''} onClick={()=>setAuthMode('login')}>Masuk</button><button type="button" className={authMode==='signup'?'selected':''} onClick={()=>setAuthMode('signup')}>Daftar</button></div><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="nama@email.com"/></label><label>Password<input type="password" required minLength="6" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimal 6 karakter"/></label><button className="button button-primary" type="submit">{authMode==='login'?'Masuk ke akun':'Buat akun'}</button></form>}</article></section>
      <footer className="footer"><strong>AgriInsight</strong><span>Platform analisis bisnis dan data pertanian.</span><span>Angka contoh diberi label ilustrasi. Validasi keputusan dengan data lokal dan tenaga ahli.</span></footer>
    </main>
  </div>;
}
