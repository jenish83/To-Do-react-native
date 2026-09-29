import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { loginRequest, registerRequest } from '../api/authApi';
import { setAuthToken, setUnauthorizedHandler } from '../api/client';

const TOKEN_KEY = 'todo_token';
const USER_KEY = 'todo_user';

interface AuthContextValue {
  user: User | null;
  loading: boolean; // true while we check for a saved login on app start
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    await AsyncStorage.removeMany([TOKEN_KEY, USER_KEY]);
  }, []);

  // On app start: restore the saved session (so the user stays logged in)
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getMany([TOKEN_KEY, USER_KEY]);
        const token = saved[TOKEN_KEY];
        const savedUser = saved[USER_KEY];
        if (token && savedUser) {
          try {
            const parsed = JSON.parse(savedUser) as User;
            if (!parsed?.id || !parsed?.email) throw new Error('Invalid saved session');
            setAuthToken(token);
            setUser(parsed);
          } catch {
            // A broken saved session should not block the login screen.
            setAuthToken(null);
            setUser(null);
            await AsyncStorage.removeMany([TOKEN_KEY, USER_KEY]);
          }
        }
      } catch {
        // Storage could not be read. Show the login screen without deleting a saved session.
      } finally {
        setLoading(false);
      }
    })();
    setUnauthorizedHandler(logout); // auto-logout when the token expires
  }, [logout]);

  // Saves token + user after a successful login/register
  const saveSession = async (token: string, u: User) => {
    setAuthToken(token);
    await AsyncStorage.setMany({
      [TOKEN_KEY]: token,
      [USER_KEY]: JSON.stringify(u),
    });
      setUser(u);
  };

  const login = async (email: string, password: string) => {
    const data = await loginRequest(email, password);
    await saveSession(data.token, data.user);
  };

  const register = async (email: string, password: string) => {
    const data = await registerRequest(email, password);
    await saveSession(data.token, data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook so screens can simply call useAuth()
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
