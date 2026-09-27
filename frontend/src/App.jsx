import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { AdminProvider } from './lib/adminContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Codes from './pages/Codes';
import Weapons from './pages/Weapons';
import WeaponDetail from './pages/WeaponDetail';
import Sensitivity from './pages/Sensitivity';
import Hud from './pages/Hud';
import Guides from './pages/Guides';
import GuideDetail from './pages/GuideDetail';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Tournaments from './pages/Tournaments';

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function WakeUpBanner() {
  const [slow, setSlow] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 2000);
    const base = import.meta.env.VITE_API_URL ?? '';
    fetch(`${base}/api/health`)
      .then(() => { setReady(true); setSlow(false); })
      .catch(() => { setReady(true); setSlow(false); })
      .finally(() => clearTimeout(timer));
    return () => clearTimeout(timer);
  }, []);

  if (!slow || ready) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-cod-surface border border-cod-accent/40 text-cod-muted text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-cod-accent animate-pulse shrink-0" />
      Server is waking up — first load may take ~30s on free tier
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <p className="text-5xl font-extrabold text-cod-accent">404</p>
      <p className="text-cod-muted">Page not found.</p>
      <a href="/" className="btn-primary">Go Home</a>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AdminProvider>
        <BrowserRouter>
          <Navbar />
          <WakeUpBanner />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/codes" element={<Codes />} />
              <Route path="/weapons" element={<Weapons />} />
              <Route path="/weapons/:slug" element={<WeaponDetail />} />
              <Route path="/sensitivity" element={<Sensitivity />} />
              <Route path="/hud" element={<Hud />} />
              <Route path="/guides" element={<Guides />} />
              <Route path="/guides/:slug" element={<GuideDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/tournaments" element={<Tournaments />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </BrowserRouter>
      </AdminProvider>
    </QueryClientProvider>
  );
}
