import { useEffect, useRef, useState } from 'react';
import { getSession, signOut, type User } from './features/auth/auth';
import { getLatestReport } from './api/portfolio';
import { AuthForm, type AuthView } from './features/auth/AuthForm';
import { Home } from './features/home/Home';
import { PortfolioInput } from './features/portfolio/PortfolioInput';
import { PortfolioReport } from './features/portfolio/PortfolioReport';
import type { PortfolioAnalysisResponse, PortfolioPosition } from './features/portfolio/types';
import { AppLayout } from './components/AppLayout';
import './App.css';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [report, setReport] = useState<PortfolioAnalysisResponse | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [reload, setReload] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<'home' | AuthView>('home');
  const main = useRef<HTMLElement>(null);
  const step = user ? (report ? 2 : 1) : null;

  useEffect(() => {
    const controller = new AbortController();
    async function restore() {
      try {
        const session = await getSession(controller.signal);
        const saved = session ? await getLatestReport(controller.signal) : null;
        if (controller.signal.aborted) return;
        setUser(session);
        setReport(saved);
        setPositions(saved?.positions ?? []);
        setStatus('ready');
      } catch {
        if (!controller.signal.aborted) setStatus('error');
      }
    }
    void restore();
    return () => controller.abort();
  }, [reload]);

  useEffect(() => {
    const page = user
      ? report
        ? 'Portfolio report'
        : 'Portfolio'
      : view === 'home'
        ? 'Portfolio Rated'
        : view === 'signup'
          ? 'Create account'
          : 'Sign in';
    document.title = page === 'Portfolio Rated' ? page : `${page} · Portfolio Rated`;
    main.current?.querySelector('h1')?.focus();
  }, [report, status, user, view]);

  function retry() {
    setStatus('loading');
    setReload((value) => value + 1);
  }

  async function handleSignOut() {
    setSigningOut(true);
    setError('');
    try {
      await signOut();
      setUser(null);
      setPositions([]);
      setReport(null);
      setView('home');
    } catch {
      setError('Unable to sign out. Please try again.');
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <AppLayout
      mainRef={main}
      onNavigate={(nextView) => {
        if (!user) setView(nextView);
      }}
      onSignOut={handleSignOut}
      signingOut={signingOut}
      step={step}
      user={user}
    >
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {status === 'loading' ? (
        <p role="status">Loading…</p>
      ) : status === 'error' ? (
        <section>
          <h1 tabIndex={-1}>Unable to load your portfolio</h1>
          <p className="intro">Please check your connection and try again.</p>
          <button className="primary" onClick={retry}>
            Try again
          </button>
        </section>
      ) : !user && view === 'home' ? (
        <Home onLogin={() => setView('login')} onSignUp={() => setView('signup')} />
      ) : !user ? (
        <AuthForm
          key={view}
          mode={view === 'signup' ? 'signup' : 'login'}
          onAuthenticated={retry}
          onChangeMode={setView}
        />
      ) : report ? (
        <PortfolioReport report={report} onEdit={() => setReport(null)} />
      ) : (
        <PortfolioInput
          initialPositions={positions}
          onAnalysed={(submitted, result) => {
            setPositions(submitted);
            setReport(result);
          }}
        />
      )}
    </AppLayout>
  );
}
export default App;
