import type { ReactNode, RefObject } from 'react';
import type { User } from '../features/auth/auth';
import type { AuthView } from '../features/auth/AuthForm';

interface AppLayoutProps {
  children: ReactNode;
  mainRef: RefObject<HTMLElement | null>;
  onSignOut: () => void;
  onNavigate: (view: 'home' | AuthView) => void;
  signingOut: boolean;
  step: number | null;
  user: User | null;
}

const steps = ['Login', 'Portfolio', 'Report'];

export function AppLayout({
  children,
  mainRef,
  onNavigate,
  onSignOut,
  signingOut,
  step,
  user,
}: AppLayoutProps) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="app-header">
        <button className="brand" type="button" onClick={() => onNavigate('home')}>
          Portfolio <strong>Rated</strong>
          <span className="brand-dot" aria-hidden="true" />
        </button>
        {user && step !== null && (
          <nav className="progress-nav" aria-label="Progress">
            <ol className="steps">
              {steps.map((label, index) => (
                <li key={label} aria-current={step === index ? 'step' : undefined}>
                  <span className="step-number">0{index + 1}</span>
                  {label}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div className="header-actions">
          {user ? (
            <button className="quiet" disabled={signingOut} onClick={onSignOut}>
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          ) : (
            <>
              <button className="quiet" onClick={() => onNavigate('login')}>
                Log in
              </button>
              <button className="primary compact" onClick={() => onNavigate('signup')}>
                Sign up
              </button>
            </>
          )}
        </div>
      </header>
      <main id="main" ref={mainRef}>
        {children}
      </main>
    </div>
  );
}
