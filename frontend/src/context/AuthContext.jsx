import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import authService from '../services/authService';

const AuthContext = createContext();

// ─── Storage Helpers ────────────────────────────────────────────────────────
// On Capacitor native, localStorage works inside the WebView but can sometimes
// be unreliable across app restarts due to WKWebView/WebView clearing policies.
// We use @capacitor/preferences as a write-through layer for critical auth data.

const storageSet = async (key, value) => {
  // Always write to localStorage for immediate synchronous reads
  localStorage.setItem(key, value);
  // Also persist to native Preferences for reliable cross-session storage on iOS/Android
  if (Capacitor.isNativePlatform()) {
    try {
      await Preferences.set({ key, value });
    } catch (e) {}
  }
};

const storageGet = async (key) => {
  // Try native Preferences first (most reliable on iOS/Android across app restarts)
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await Preferences.get({ key });
      if (result && result.value !== null && result.value !== undefined) {
        // Sync back to localStorage so synchronous reads are also up-to-date
        localStorage.setItem(key, result.value);
        return result.value;
      }
    } catch (e) {}
  }
  // Fallback to localStorage (web, or if Preferences failed)
  return localStorage.getItem(key);
};

const storageRemove = async (key) => {
  localStorage.removeItem(key);
  if (Capacitor.isNativePlatform()) {
    try {
      await Preferences.remove({ key });
    } catch (e) {}
  }
};

// ─── AuthProvider ────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  // loading = true while we are restoring session from storage.
  // ProtectedRoute shows a spinner during this phase so it never prematurely
  // redirects to /login while auth state is still being loaded.
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  // ── Session Restoration on Mount ──────────────────────────────────────────
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const restoreSession = async () => {
      try {
        // Read from storage (native Preferences → localStorage fallback)
        const storedToken = await storageGet('chatify_token');
        const storedUserStr = await storageGet('chatify_user');

        if (!storedToken) {
          // No token stored — user is not logged in
          setLoading(false);
          return;
        }

        // Optimistically restore user from cache so UI is instant
        if (storedUserStr) {
          try {
            const cachedUser = JSON.parse(storedUserStr);
            setUser(cachedUser);
            setToken(storedToken);
          } catch (e) {}
        } else {
          setToken(storedToken);
        }

        // Verify token is still valid with the backend
        try {
          const res = await authService.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            setToken(storedToken);
            // Refresh cached user data
            await storageSet('chatify_user', JSON.stringify(res.user));
          } else {
            // Token is no longer valid
            await performLogout(false);
          }
        } catch (err) {
          // Network error — keep cached user/token so user isn't logged out offline
          // If it's a 401, the response interceptor in api.js will fire chatify_auth_expired
          if (err.response?.status === 401) {
            await performLogout(false);
          } else {
            // Network error: keep state, let user retry
            console.warn('[AuthContext] Session verification network error — keeping cached session:', err.message);
          }
        }
      } catch (err) {
        console.error('[AuthContext] Session restore error:', err.message);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ── Auth Expired Event Listener ───────────────────────────────────────────
  // Listens for the 'chatify_auth_expired' custom event fired by api.js 401 interceptor.
  // This allows clean React Router navigation instead of hard page reload.
  useEffect(() => {
    const handleAuthExpired = async () => {
      await performLogout(true);
    };
    window.addEventListener('chatify_auth_expired', handleAuthExpired);
    return () => window.removeEventListener('chatify_auth_expired', handleAuthExpired);
  }, [navigate]);

  // ── Internal Logout Helper ────────────────────────────────────────────────
  const performLogout = async (shouldNavigate = true) => {
    await storageRemove('chatify_token');
    await storageRemove('chatify_user');
    setToken(null);
    setUser(null);
    if (shouldNavigate) {
      navigate('/login', { replace: true });
    }
  };

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authService.login({ email, password });
      if (res.success && res.token) {
        await storageSet('chatify_token', res.token);
        await storageSet('chatify_user', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // ── Login with OTP ────────────────────────────────────────────────────────
  const loginWithOTP = async (email, otp) => {
    setLoading(true);
    try {
      const res = await authService.verifyOTP(email, otp, 'login');
      if (res.success && res.token) {
        await storageSet('chatify_token', res.token);
        await storageSet('chatify_user', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message || 'OTP verification failed' };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'OTP verification failed';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // ── Register ──────────────────────────────────────────────────────────────
  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await authService.register({ name, email, password });
      if (res.success && res.token) {
        await storageSet('chatify_token', res.token);
        await storageSet('chatify_user', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message || 'Registration failed' };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Registration failed';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // ── Google Auth ───────────────────────────────────────────────────────────
  const loginWithGoogle = async (payload) => {
    setLoading(true);
    try {
      const res = await authService.googleAuth(payload);
      if (res.success && res.token) {
        await storageSet('chatify_token', res.token);
        await storageSet('chatify_user', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message || 'Google authentication failed' };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Google authentication failed';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      if (token) {
        await authService.logout().catch(() => {});
      }
    } finally {
      await performLogout(true);
    }
  };

  // ── Update User Profile ───────────────────────────────────────────────────
  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const nextUser = { ...prev, ...updatedFields };
      storageSet('chatify_user', JSON.stringify(nextUser));
      return nextUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        login,
        loginWithOTP,
        register,
        loginWithGoogle,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
