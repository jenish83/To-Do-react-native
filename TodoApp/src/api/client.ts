import axios from 'axios';
import { API_URL } from '../config';

// One axios instance used by all API calls.
const client = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

// AuthContext calls this after login / logout
export function setAuthToken(token: string | null) {
  authToken = token;
}

// AuthContext registers a function that logs the user out when a token is rejected
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

// Attach "Authorization: Bearer <token>" to every request
client.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
  return config;
});

// If the server says 401 on a protected call (expired token), log out.
// Login/register also return 401 for wrong credentials, so we skip the auth routes.
client.interceptors.response.use(
  (res) => res,
  (error) => {
    const isAuthRoute = error.config?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && !isAuthRoute && onUnauthorized) onUnauthorized();
    return Promise.reject(error);
  },
);

export default client;
