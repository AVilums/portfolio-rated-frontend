import { afterEach, describe, expect, it, vi } from 'vitest';
import { portfolioSchema } from '../src/features/portfolio/schemas';
import { analysePortfolio, getLatestReport } from '../src/api/portfolio';
import { getSession, signIn, signOut } from '../src/features/auth/auth';
import { ApiError } from '../src/api/client';
import { report, user } from './fixtures';

afterEach(() => vi.unstubAllGlobals());
describe('API boundary', () => {
  it('validates input before calling fetch', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    await expect(
      analysePortfolio({ positions: [{ ticker: 'AVWC', allocation: 90, average_price: 10 }] }),
    ).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
  it('sends normalized data and the CSRF header using same-origin credentials', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(report)));
    vi.stubGlobal('fetch', fetch);
    expect(
      await analysePortfolio({
        positions: [{ ticker: 'qqq', allocation: 100, average_price: 500 }],
      }),
    ).toEqual(report);
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/portfolio/analyse',
      expect.objectContaining({
        method: 'POST',
        credentials: 'same-origin',
        body: JSON.stringify({
          positions: [{ ticker: 'QQQ', allocation: 100, average_price: 500 }],
        }),
        headers: expect.objectContaining({ 'X-Requested-With': 'PortfolioRated' }),
      }),
    );
  });
  it('rejects malformed responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ rating: 82 }))));
    await expect(getLatestReport()).rejects.toThrow();
  });
  it('returns no session for 401 and propagates server failure', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response('private details', { status: 503 }));
    vi.stubGlobal('fetch', fetch);
    expect(await getSession()).toBeNull();
    await expect(getSession()).rejects.toBeInstanceOf(ApiError);
  });
  it('signs in, validates the user response and handles empty logout response', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(user)))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetch);
    expect(await signIn(user.email, 'password')).toEqual(user);
    await expect(signOut()).resolves.toBeUndefined();
  });
});
describe('portfolio validation', () => {
  it('accepts exact decimal totals and normalizes symbols', () => {
    const result = portfolioSchema.parse({
      positions: [
        { ticker: ' qqq ', allocation: 33.33, average_price: 100 },
        { ticker: 'VTI', allocation: 33.33, average_price: 200 },
        { ticker: 'VXUS', allocation: 33.34, average_price: 50 },
      ],
    });
    expect(result.positions[0].ticker).toBe('QQQ');
  });
  it.each([NaN, Infinity, -Infinity, 99.999, 0])(
    'rejects invalid numeric input %s',
    (allocation) => {
      expect(
        portfolioSchema.safeParse({
          positions: [{ ticker: 'QQQ', allocation, average_price: 100 }],
        }).success,
      ).toBe(false);
    },
  );
  it.each([NaN, Infinity, -1, 0, 1.123456789])(
    'rejects invalid average price %s',
    (average_price) => {
      expect(
        portfolioSchema.safeParse({
          positions: [{ ticker: 'QQQ', allocation: 100, average_price }],
        }).success,
      ).toBe(false);
    },
  );
});
