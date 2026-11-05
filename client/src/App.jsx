import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Leaf } from 'lucide-react';
import { api, clearToken, getToken, setToken } from './api';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import { Toast } from './components/ui';
import AuthPage from './pages/AuthPage';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const PlansPage = lazy(() => import('./pages/PlansPage'));
const AnalysisPage = lazy(() => import('./pages/AnalysisPage'));
const QualityPage = lazy(() => import('./pages/QualityPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));

const ROUTES = ['dashboard', 'plans', 'analysis', 'quality', 'account'];

const PAGE_META = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Ringkasan performa dan proyeksi usaha tani Anda.',
  },
  plans: {
    title: 'Rencana Tanam',
    subtitle: 'Kelola jadwal, biaya, dan proyeksi keuangan setiap rencana.',
  },
  analysis: {
    title: 'Analisis Usaha',
    subtitle: 'Bandingkan margin, ROI, dan harga impas antar komoditas.',
  },
  quality: {
    title: 'Kualitas Data',
    subtitle: 'Pastikan data yang Anda gunakan lengkap dan dapat dipercaya.',
  },
  account: {
    title: 'Akun & Keamanan',
    subtitle: 'Kelola profil, password, dan laporan data usaha Anda.',
  },
};

function readRoute() {
  const hash = window.location.hash.replace('#', '');
  return ROUTES.includes(hash) ? hash : 'dashboard';
}

function BootScreen() {
  return (
    <div className="boot-screen">
      <span className="brand-mark">
        <Leaf size={24} />
      </span>
      <div>
        <strong>AgriInsight</strong>
        <span>Menyiapkan dashboard...</span>
      </div>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="page-stack">
      <div className="skeleton skeleton-panel" />
      <div className="skeleton skeleton-table" />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [plans, setPlans] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [route, setRoute] = useState(readRoute);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connection, setConnection] = useState({ connected: false, label: 'Memeriksa koneksi' });
  const [pendingCreate, setPendingCreate] = useState(false);

  const notify = useCallback((type, message) => {
    setToast({ type, message, id: Date.now() });
  }, []);

  const closeToast = useCallback(() => setToast(null), []);

  const navigate = useCallback((nextRoute) => {
    if (!ROUTES.includes(nextRoute)) return;
    if (window.location.hash !== `#${nextRoute}`) window.location.hash = nextRoute;
    setRoute(nextRoute);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handleHash = () => setRoute(readRoute());
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    api
      .health()
      .then((result) =>
        setConnection(
          result.database === 'connected'
            ? { connected: true, label: 'Backend & database terhubung' }
            : { connected: false, label: 'Database belum terhubung' }
        )
      )
      .catch(() => setConnection({ connected: false, label: 'Backend belum terhubung' }));
  }, []);

  useEffect(() => {
    if (!getToken()) {
      setBooting(false);
      return;
    }
    let active = true;
    api
      .me()
      .then(({ user: currentUser }) => {
        if (active) setUser(currentUser);
      })
      .catch(() => clearToken())
      .finally(() => {
        if (active) setBooting(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const loadData = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      try {
        const [nextPlans, nextSummary] = await Promise.all([api.listPlans(), api.summary()]);
        setPlans(nextPlans);
        setSummary(nextSummary);
      } catch (error) {
        if (error.status === 401) {
          clearToken();
          setUser(null);
          setPlans([]);
          setSummary(null);
        } else {
          notify('error', error.message || 'Gagal memuat data.');
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [notify]
  );

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  function handleAuth(result) {
    setToken(result.token);
    setUser(result.user);
    navigate('dashboard');
    notify('success', 'Berhasil masuk ke AgriInsight.');
  }

  function handleLogout() {
    clearToken();
    setUser(null);
    setPlans([]);
    setSummary(null);
    setToast(null);
    setRoute('dashboard');
    window.location.hash = 'dashboard';
  }

  async function withAuth(handler) {
    try {
      return await handler();
    } catch (error) {
      if (error.status === 401) {
        handleLogout();
        notify('error', 'Sesi berakhir. Silakan masuk kembali.');
        return null;
      }
      throw error;
    }
  }

  async function createPlan(payload) {
    return withAuth(async () => {
      await api.createPlan(payload);
      await loadData({ silent: true });
      notify('success', 'Rencana tanam berhasil disimpan.');
      return true;
    });
  }

  async function updatePlan(id, payload) {
    return withAuth(async () => {
      await api.updatePlan(id, payload);
      await loadData({ silent: true });
      notify('success', 'Rencana tanam berhasil diperbarui.');
      return true;
    });
  }

  async function deletePlan(id) {
    return withAuth(async () => {
      await api.deletePlan(id);
      await loadData({ silent: true });
      notify('success', 'Rencana tanam berhasil dihapus.');
      return true;
    });
  }

  function openCreatePlan() {
    navigate('plans');
    setPendingCreate(true);
  }

  if (booting) return <BootScreen />;

  if (!user) return <AuthPage onAuth={handleAuth} />;

  const meta = PAGE_META[route];
  const qualityScore = summary?.quality?.score || 0;

  return (
    <div className="app-shell">
      <Sidebar
        route={route}
        open={sidebarOpen}
        onNavigate={navigate}
        onClose={() => setSidebarOpen(false)}
        user={user}
        connected={connection.connected}
        connectionLabel={connection.label}
        planCount={plans.length}
        qualityScore={qualityScore}
      />

      <main className="main-content">
        <Topbar
          title={meta.title}
          subtitle={meta.subtitle}
          onMenu={() => setSidebarOpen(true)}
          onAddPlan={openCreatePlan}
          user={user}
          onLogout={handleLogout}
        />

        <Suspense fallback={<PageLoader />}>
          {route === 'dashboard' && (
            <DashboardPage
              summary={summary}
              plans={plans}
              loading={loading}
              onNavigate={navigate}
              onAddPlan={openCreatePlan}
            />
          )}
          {route === 'plans' && (
            <PlansPage
              plans={plans}
              loading={loading}
              onCreate={createPlan}
              onUpdate={updatePlan}
              onDelete={deletePlan}
              notify={notify}
              pendingCreate={pendingCreate}
              onPendingConsumed={() => setPendingCreate(false)}
            />
          )}
          {route === 'analysis' && (
            <AnalysisPage summary={summary} loading={loading} onAddPlan={openCreatePlan} />
          )}
          {route === 'quality' && (
            <QualityPage
              summary={summary}
              plans={plans}
              onNavigate={navigate}
              onAddPlan={openCreatePlan}
            />
          )}
          {route === 'account' && (
            <AccountPage
              user={user}
              summary={summary}
              plans={plans}
              onLogout={handleLogout}
              notify={notify}
              onNavigate={navigate}
            />
          )}
        </Suspense>

        <footer className="footer">
          <strong>AgriInsight</strong>
          <span>Platform analisis bisnis dan data pertanian.</span>
          <span>
            Angka merupakan estimasi berdasarkan input pengguna. Validasi keputusan dengan data
            lapangan dan tenaga ahli.
          </span>
        </footer>
      </main>

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
