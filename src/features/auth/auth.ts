import { z } from 'zod';
import { ApiError, request } from '../../api/client';

const userSchema = z.object({ id: z.uuid(), email: z.email() });
export type User = z.infer<typeof userSchema>;

export async function signIn(email: string, password: string): Promise<User> {
  return userSchema.parse(
    await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  );
}
export async function getSession(signal?: AbortSignal): Promise<User | null> {
  try {
    return userSchema.parse(await request('/auth/session', { signal }));
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}
export async function signOut(): Promise<void> {
  await request('/auth/logout', { method: 'POST' });
}
