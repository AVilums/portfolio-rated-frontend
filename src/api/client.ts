import { config } from '../config';

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(status === 401 ? 'Your session expired. Sign in again.' : 'Request failed.');
    this.status = status;
  }
}

export async function request(path: string, options: RequestInit = {}): Promise<unknown> {
  const response = await fetch(config.apiUrl + path, {
    ...options,
    credentials: 'same-origin',
    signal: options.signal
      ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)])
      : AbortSignal.timeout(15000),
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'PortfolioRated',
      ...options.headers,
    },
  });
  if (!response.ok) throw new ApiError(response.status);
  return response.status === 204 ? null : response.json();
}
