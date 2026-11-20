import { useEffect, useState } from 'react';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PortfolioRenderer } from './components/PortfolioRenderer';
import { createDefaultPortfolioSnapshot } from './data/defaultPortfolioSeed';
import type { PortfolioSnapshot } from './types/cms';
import { fetchPublicSite } from './utils/apiClient';
import { resolveInitialThemeId } from './utils/themeResolver';

export default function App() {
  const [route, setRoute] = useState<'public' | 'admin'>(() =>
    typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
      ? 'admin'
      : 'public'
  );

  const [site, setSite] = useState<PortfolioSnapshot>(() => createDefaultPortfolioSnapshot());
  const [activeThemeId, setActiveThemeId] = useState<string>(() =>
    resolveInitialThemeId(createDefaultPortfolioSnapshot())
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onPopState = () => {
      setRoute(window.location.pathname.startsWith('/admin') ? 'admin' : 'public');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    fetchPublicSite()
      .then((loaded) => {
        setSite(loaded);
        setActiveThemeId(resolveInitialThemeId(loaded));
      })
      .catch((err) => {
        console.error('Failed to load published portfolio:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const navigateTo = (target: 'public' | 'admin') => {
    const nextPath = target === 'admin' ? '/admin' : '/';
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
    setRoute(target);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  if (route === 'admin') {
    return (
      <AdminDashboard
        onNavigatePublic={() => navigateTo('public')}
        onPublishedUpdated={(published) => {
          setSite(published);
          setActiveThemeId(resolveInitialThemeId(published));
        }}
      />
    );
  }

  return (
    <div className={loading ? 'opacity-95' : 'opacity-100 transition-opacity duration-200'}>
      <PortfolioRenderer
        snapshot={site}
        activeThemeId={activeThemeId}
        onSelectTheme={setActiveThemeId}
        onNavigateAdmin={() => navigateTo('admin')}
      />
    </div>
  );
}
