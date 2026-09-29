import client from './client';
import { AuthResponse } from '../types';

export async function registerRequest(email: string, password: string): Promise<AuthResponse> {
  const res = await client.post('/auth/register', { email: email.trim(), password });
  return res.data;
}

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  const res = await client.post('/auth/login', { email: email.trim(), password });
  return res.data;
}
