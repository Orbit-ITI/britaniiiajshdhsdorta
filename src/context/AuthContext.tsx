import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setToken, clearToken, getToken } from '../lib/api';
import { UserProfile } from '../lib/types';

interface AuthContextValue {
  user: { uid: string; nickname: string; role: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (nickname: string, password: string) => Promise<void>;
  register: (nickname: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Decode JWT payload without any library — instant, no network
function decodeJWT(token: string): { uid: string; nickname: string; role: string; exp: number } | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    // Check expiry
    if (decoded.exp && decoded.exp * 1000 < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<{ uid: string; nickname: string; role: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const applyProfile = (p: UserProfile) => {
    setProfile(p);
    setUser({ uid: p.uid, nickname: p.nickname, role: p.role });
  };

  const fetchProfile = useCallback(async (): Promise<void> => {
    try {
      const p = await api.get<UserProfile>('/auth/me');
      applyProfile(p);
    } catch {
      clearToken();
      setUser(null);
      setProfile(null);
    }
  }, []);

  // ── On mount: instant restore from JWT, then validate in background ──
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    // 1. Instantly decode JWT — no network, no delay
    const decoded = decodeJWT(token);
    if (!decoded) {
      clearToken();
      setLoading(false);
      return;
    }

    // 2. Restore user immediately from token payload
    setUser({ uid: decoded.uid, nickname: decoded.nickname, role: decoded.role });
    setLoading(false); // ← render app NOW, don't wait for server

    // 3. Fetch full profile from server in background (updates role/passport/etc.)
    fetchProfile();
  }, [fetchProfile]);

  // Poll full profile every 15s while logged in
  useEffect(() => {
    if (!user) return;
    const id = setInterval(fetchProfile, 15_000);
    return () => clearInterval(id);
  }, [user, fetchProfile]);

  const login = async (nickname: string, password: string) => {
    const { token, profile: p } = await api.post<{ token: string; profile: UserProfile }>(
      '/auth/login', { nickname, password }
    );
    setToken(token);
    applyProfile(p);
  };

  const register = async (nickname: string, password: string) => {
    const { token, profile: p } = await api.post<{ token: string; profile: UserProfile }>(
      '/auth/register', { nickname, password }
    );
    setToken(token);
    applyProfile(p);
  };

  const logout = async () => {
    clearToken();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout, refreshProfile: fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
