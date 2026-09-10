import { useState } from 'react';
import { ApiError } from '../../api/client';
import { signIn } from './auth';

export function Login({ onSignIn }: { onSignIn: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  return (
    <section className="login-panel">
      <h1 tabIndex={-1}>Sign in</h1>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (pending) return;
          const data = new FormData(event.currentTarget);
          setPending(true);
          setError('');
          try {
            await signIn(String(data.get('email')).trim(), String(data.get('password')));
            onSignIn();
          } catch (error) {
            setError(
              error instanceof ApiError && error.status === 401
                ? 'Email or password is incorrect.'
                : error instanceof ApiError && error.status === 429
                  ? 'Too many attempts. Try again in five minutes.'
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
          autoComplete="current-password"
          required
          maxLength={128}
          disabled={pending}
        />
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="primary full-width" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </section>
  );
}
