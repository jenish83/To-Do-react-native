import client from './client';
import { AuthResponse } from '../types';
import { validateEmailDomain } from '../utils/validation';

async function rejectFakeDomain(email: string) {
  const message = await validateEmailDomain(email);
  if (message) throw new Error(message);
}

export async function registerRequest(email: string, password: string): Promise<AuthResponse> {
  await rejectFakeDomain(email);
  const res = await client.post('/auth/register', { email: email.trim(), password });
  return res.data;
}

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  await rejectFakeDomain(email);
  const res = await client.post('/auth/login', { email: email.trim(), password });
  return res.data;
}
