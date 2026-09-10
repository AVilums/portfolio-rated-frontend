import { useState } from 'react';
import { ApiError } from '../../api/client';
import { signIn, signUp } from './auth';

export type AuthView = 'login' | 'signup';

interface AuthFormProps {
  mode: AuthView;
  onAuthenticated: () => void;
  onChangeMode: (mode: AuthView) => void;
}

export function AuthForm({ mode, onAuthenticated, onChangeMode }: AuthFormProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const signingUp = mode === 'signup';

  return (
    <section className="login-panel">
      <p className="eyebrow">{signingUp ? 'Start your analysis' : 'Welcome back'}</p>
      <h1 tabIndex={-1}>{signingUp ? 'Create your account' : 'Sign in'}</h1>
      <p className="intro">
        {signingUp
          ? 'Create an account to save your portfolio reports.'
          : 'Sign in to continue to your portfolio.'}
      </p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (pending) return;
          const data = new FormData(event.currentTarget);
          const email = String(data.get('email')).trim();
          const password = String(data.get('password'));
          if (signingUp && password !== String(data.get('confirm-password'))) {
            setError('Passwords do not match.');
            return;
          }
          setPending(true);
          setError('');
          try {
            await (signingUp ? signUp : signIn)(email, password);
            onAuthenticated();
          } catch (error) {
            setError(
              error instanceof ApiError && error.status === 401
                ? 'Email or password is incorrect.'
                : error instanceof ApiError && error.status === 409
                  ? 'An account already exists for this email.'
                  : error instanceof ApiError && error.status === 429
                    ? 'Too many attempts. Try again in five minutes.'
                    : signingUp
                      ? 'Unable to create your account. Please try again.'
                      : 'Unable to sign in. Please try again.',
            );
            setPending(false);
          }
        }}
      >
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
          disabled={pending}
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={signingUp ? 'new-password' : 'current-password'}
          required
          minLength={signingUp ? 12 : 1}
          maxLength={128}
          disabled={pending}
        />
        {signingUp && (
          <>
            <label htmlFor="confirm-password">Confirm password</label>
            <input
              id="confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
              disabled={pending}
            />
          </>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="primary full-width" disabled={pending}>
          {pending
            ? signingUp
              ? 'Creating account…'
              : 'Signing in…'
            : signingUp
              ? 'Create account'
              : 'Sign in'}
        </button>
      </form>
      <p className="auth-switch small muted">
        {signingUp ? 'Already have an account?' : 'New to Portfolio Rated?'}{' '}
        <button
          type="button"
          className="text-button"
          onClick={() => onChangeMode(signingUp ? 'login' : 'signup')}
        >
          {signingUp ? 'Log in' : 'Sign up'}
        </button>
      </p>
    </section>
  );
}
