import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setAccessToken, ApiError } from './api';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Attorney' | 'Paralegal' | 'Client';
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Try to restore session on mount via refresh token cookie
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setAccessToken(data.accessToken);
          // Decode JWT payload to get user info
          const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
          // Fetch full user profile
          const profile = await api.get(`/auth/me`).catch(() => null);
          if (profile) {
            setUser(profile);
          } else {
            // Fallback to JWT payload
            setUser({ id: payload.userId, email: '', name: '', role: payload.role });
          }
        }
      } catch {
        // No valid session — stay logged out
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, role: string) => {
    const data = await api.post('/auth/register', { email, password, name, role });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Logout even if server call fails
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
