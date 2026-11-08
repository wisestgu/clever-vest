import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { Shell } from './components/Shell';
import { Welcome } from './pages/Welcome';
import { Home } from './pages/Home';
import { Fund } from './pages/Fund';
import { Withdraw } from './pages/Withdraw';
import { Discover } from './pages/Discover';
import { CollectionPage } from './pages/Collection';
import { StockPage } from './pages/Stock';
import { Learn } from './pages/Learn';
import { Lesson } from './pages/Lesson';
import { ActivityPage } from './pages/Activity';
import { Account } from './pages/Account';

function ScrollTop() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const userId = user?.id;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, userId]);
  return null;
}

function Gate() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="boot" aria-busy="true" />;
  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Welcome />} />
      </Routes>
    );
  }
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Home />} />
        <Route path="fund" element={<Fund />} />
        <Route path="withdraw" element={<Withdraw />} />
        <Route path="discover" element={<Discover />} />
        <Route path="discover/:id" element={<CollectionPage />} />
        <Route path="stocks/:symbol" element={<StockPage />} />
        <Route path="learn" element={<Learn />} />
        <Route path="learn/:id" element={<Lesson />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="account" element={<Account />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollTop />
        <Gate />
      </AuthProvider>
    </BrowserRouter>
  );
}
