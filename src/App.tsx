import { useEffect, useRef, useState } from 'react';
import { getSession, signOut, type User } from './features/auth/auth';
import { getLatestReport } from './api/portfolio';
import { Login } from './features/auth/Login';
import { PortfolioInput } from './features/portfolio/PortfolioInput';
import { PortfolioReport } from './features/portfolio/PortfolioReport';
import type { PortfolioAnalysisResponse, PortfolioPosition } from './features/portfolio/types';
import './App.css';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [report, setReport] = useState<PortfolioAnalysisResponse | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [reload, setReload] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');
  const main = useRef<HTMLElement>(null);
  const step = !user ? 0 : report ? 2 : 1;

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
    document.title = `${['Sign in', 'Portfolio', 'Portfolio report'][step]} · Portfolio Rated`;
    main.current?.querySelector('h1')?.focus();
  }, [step, status]);

  function retry() {
    setStatus('loading');
    setReload((value) => value + 1);
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="app-header">
        <span className="brand">
          Portfolio <strong>Rated</strong>
          <span className="brand-dot" />
        </span>
        {user && (
          <button
            className="quiet"
            disabled={signingOut}
            onClick={async () => {
              setSigningOut(true);
              setError('');
              try {
                await signOut();
                setUser(null);
                setPositions([]);
                setReport(null);
              } catch {
                setError('Unable to sign out. Please try again.');
              } finally {
                setSigningOut(false);
              }
            }}
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        )}
      </header>
      <nav aria-label="Progress">
        <ol className="steps">
          {['Login', 'Portfolio', 'Report'].map((label, index) => (
            <li key={label} aria-current={step === index ? 'step' : undefined}>
              <span className="step-number">0{index + 1}</span>
              {label}
            </li>
          ))}
        </ol>
      </nav>
      <main id="main" ref={main}>
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
        ) : !user ? (
          <Login onSignIn={retry} />
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
      </main>
    </div>
  );
}
export default App;
