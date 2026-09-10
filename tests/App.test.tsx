import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';
import * as portfolioApi from '../src/api/portfolio';
import * as auth from '../src/features/auth/auth';
import { ApiError } from '../src/api/client';
import { report, user as account } from './fixtures';

vi.mock('../src/api/portfolio');
vi.mock('../src/features/auth/auth');

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(auth.getSession).mockResolvedValue(null);
  vi.mocked(auth.signIn).mockImplementation(async () => {
    vi.mocked(auth.getSession).mockResolvedValue(account);
    return account;
  });
  vi.mocked(auth.signUp).mockImplementation(async () => {
    vi.mocked(auth.getSession).mockResolvedValue(account);
    return account;
  });
  vi.mocked(auth.signOut).mockResolvedValue();
  vi.mocked(portfolioApi.getLatestReport).mockResolvedValue(null);
  vi.mocked(portfolioApi.analysePortfolio).mockResolvedValue(report);
});

async function openLogin(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole('heading', { name: 'See how concentrated your portfolio really is.' });
  await user.click(within(screen.getByRole('banner')).getByRole('button', { name: 'Log in' }));
  await screen.findByRole('heading', { name: 'Sign in' });
}

async function login() {
  const user = userEvent.setup();
  render(<App />);
  await openLogin(user);
  await user.type(screen.getByLabelText('Email'), 'demo@example.com');
  await user.type(screen.getByLabelText('Password'), 'placeholder');
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
  await screen.findByRole('heading', { name: 'Portfolio input' });
  return user;
}
async function fillPosition(
  user: ReturnType<typeof userEvent.setup>,
  index: number,
  ticker: string,
  allocation: string,
) {
  await user.type(screen.getByLabelText(`Asset symbol ${index}`), ticker);
  await user.type(screen.getByLabelText(`Allocation (%) ${index}`), allocation);
}

describe('portfolio flow', () => {
  it('opens sign-in and sign-up from the homepage header', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('heading', { name: 'See how concentrated your portfolio really is.' });
    const header = within(screen.getByRole('banner'));
    await user.click(header.getByRole('button', { name: 'Sign up' }));
    expect(await screen.findByRole('heading', { name: 'Create your account' })).toHaveFocus();
    await user.click(within(screen.getByRole('main')).getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toHaveFocus();
  });

  it('creates an account and starts the portfolio flow', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('heading', { name: 'See how concentrated your portfolio really is.' });
    await user.click(within(screen.getByRole('banner')).getByRole('button', { name: 'Sign up' }));
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Password'), 'a-secure-password');
    await user.type(screen.getByLabelText('Confirm password'), 'a-secure-password');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByRole('heading', { name: 'Portfolio input' })).toHaveFocus();
    expect(auth.signUp).toHaveBeenCalledWith('new@example.com', 'a-secure-password');
  });

  it('requires login inputs and passes credentials to the API', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openLogin(user);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(auth.signIn).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText('Email'), 'demo@example.com');
    await user.type(screen.getByLabelText('Password'), 'placeholder');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('heading', { name: 'Portfolio input' })).toHaveFocus();
    expect(auth.signIn).toHaveBeenCalledWith('demo@example.com', 'placeholder');
  });

  it('adds and removes positions while retaining other values', async () => {
    const user = await login();
    await fillPosition(user, 1, 'AVWC', '60');
    await user.click(screen.getByRole('button', { name: '+ Add position' }));
    await fillPosition(user, 2, 'AVWS', '40');
    await user.click(screen.getByRole('button', { name: 'Remove position 1' }));
    expect(screen.getByLabelText('Asset symbol 1')).toHaveValue('AVWS');
    expect(screen.getByLabelText('Allocation (%) 1')).toHaveValue(40);
    await waitFor(() => expect(screen.getByLabelText('Asset symbol 1')).toHaveFocus());
    expect(screen.getByRole('button', { name: 'Remove position 1' })).toBeDisabled();
  });

  it.each(['-1', '0', '101', '33.333'])('rejects invalid allocation %s', async (allocation) => {
    const user = await login();
    await fillPosition(user, 1, 'AVWC', allocation);
    await user.click(screen.getByRole('button', { name: 'Analyse portfolio' }));
    expect(screen.getByLabelText('Allocation (%) 1')).toHaveAttribute('aria-invalid', 'true');
    expect(portfolioApi.analysePortfolio).not.toHaveBeenCalled();
  });

  it('rejects an incomplete total', async () => {
    const user = await login();
    await fillPosition(user, 1, 'AVWC', '60');
    await user.click(screen.getByRole('button', { name: 'Analyse portfolio' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Allocations must total exactly 100%');
    expect(portfolioApi.analysePortfolio).not.toHaveBeenCalled();
  });

  it('shows validation for blank fields and duplicate symbols', async () => {
    const user = await login();
    await user.click(screen.getByRole('button', { name: 'Analyse portfolio' }));
    expect(screen.getByLabelText('Asset symbol 1')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Allocation (%) 1')).toHaveAttribute('aria-invalid', 'true');
    await fillPosition(user, 1, 'AVWC', '60');
    await user.click(screen.getByRole('button', { name: '+ Add position' }));
    await fillPosition(user, 2, 'avwc', '40');
    await user.click(screen.getByRole('button', { name: 'Analyse portfolio' }));
    expect(screen.getByText(/This asset is already included/)).toBeInTheDocument();
  });

  it('submits normalized inputs, shows a report, edits and signs out', async () => {
    const user = await login();
    await fillPosition(user, 1, 'avwc', '60');
    await user.click(screen.getByRole('button', { name: '+ Add position' }));
    await fillPosition(user, 2, 'AVWS', '40');
    await user.click(screen.getByRole('button', { name: 'Analyse portfolio' }));
    expect(await screen.findByRole('heading', { name: 'Portfolio report' })).toHaveFocus();
    expect(portfolioApi.analysePortfolio).toHaveBeenCalledWith({ positions: report.positions });
    expect(screen.getByText('52')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Edit portfolio' }));
    expect(screen.getByLabelText('Asset symbol 1')).toHaveValue('AVWC');
    expect(screen.getByLabelText('Allocation (%) 2')).toHaveValue(40);
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(
      await screen.findByRole('heading', {
        name: 'See how concentrated your portfolio really is.',
      }),
    ).toBeInTheDocument();
    expect(auth.signOut).toHaveBeenCalledOnce();
  });

  it('restores a saved report when the session is valid', async () => {
    vi.mocked(auth.getSession).mockResolvedValue(account);
    vi.mocked(portfolioApi.getLatestReport).mockResolvedValue(report);
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Portfolio report' })).toBeInTheDocument();
    expect(screen.getByText('52')).toBeInTheDocument();
  });

  it('offers retry when initial loading fails', async () => {
    vi.mocked(auth.getSession).mockRejectedValueOnce(new Error('network'));
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('heading', {
        name: 'See how concentrated your portfolio really is.',
      }),
    ).toBeInTheDocument();
  });

  it('limits the portfolio to 20 positions', async () => {
    const user = await login();
    for (let i = 1; i < 20; i++)
      await user.click(screen.getByRole('button', { name: '+ Add position' }));
    expect(screen.getAllByRole('spinbutton')).toHaveLength(20);
    expect(screen.getByRole('button', { name: '+ Add position' })).toBeDisabled();
  });

  it('locks pending submission, retains inputs on failure and allows retry', async () => {
    let rejectRequest!: (reason: Error) => void;
    vi.mocked(portfolioApi.analysePortfolio).mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectRequest = reject;
        }),
    );
    const user = await login();
    await fillPosition(user, 1, 'AVWC', '100');
    await user.click(screen.getByRole('button', { name: 'Analyse portfolio' }));
    expect(screen.getByRole('button', { name: 'Analysing…' })).toBeDisabled();
    rejectRequest(new Error('private details'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to save the report');
    expect(screen.queryByText('private details')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Asset symbol 1')).toHaveValue('AVWC');
    await user.click(screen.getByRole('button', { name: 'Analyse portfolio' }));
    expect(await screen.findByRole('heading', { name: 'Portfolio report' })).toBeInTheDocument();
  });

  it('shows incorrect credentials without exposing server details', async () => {
    vi.mocked(auth.signIn).mockRejectedValueOnce(new ApiError(401));
    const user = userEvent.setup();
    render(<App />);
    await openLogin(user);
    await user.type(screen.getByLabelText('Email'), 'demo@example.com');
    await user.type(screen.getByLabelText('Password'), 'placeholder');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect');
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
  });

  it('keeps the current screen when sign-out fails', async () => {
    const user = await login();
    vi.mocked(auth.signOut).mockRejectedValueOnce(new Error('network'));
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to sign out');
    expect(screen.getByRole('heading', { name: 'Portfolio input' })).toBeInTheDocument();
  });
});
