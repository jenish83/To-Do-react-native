import axios from 'axios';

// True when the token was rejected. The app logs out on its own in that case.
export function isSessionExpired(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 401;
}

// Converts any error into a message we can show to the user.
export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    // Server replied with an error, e.g. { message: 'Invalid email or password' }
    if (err.response?.data?.message) return err.response.data.message;
    // No reply at all: server down, wrong IP, no internet
    if (!err.response) return 'Cannot reach the server. Check that the backend is running.';
  }
  return 'Something went wrong. Please try again.';
}
