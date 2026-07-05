import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { loginUser, registerUser } from '../api/auth';

const AUTH_STORAGE_KEY = 'careerfit_auth';

function loadStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { token: null, user: null };

    const parsed = JSON.parse(raw);
    if (parsed?.token && parsed?.user?.id) {
      return { token: parsed.token, user: parsed.user };
    }
  } catch {
    // Ignore corrupt storage.
  }

  return { token: null, user: null };
}

function saveAuth(token, user) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user }));
}

function clearStoredAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const stored = loadStoredAuth();
  const [token, setToken] = useState(stored.token);
  const [user, setUser] = useState(stored.user);

  const login = useCallback(async (email, password) => {
    const data = await loginUser({ email, password });
    setToken(data.token);
    setUser(data.user);
    saveAuth(data.token, data.user);
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const data = await registerUser({ name, email, password });
    setToken(data.token);
    setUser(data.user);
    saveAuth(data.token, data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    clearStoredAuth();
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
    }),
    [token, user, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
