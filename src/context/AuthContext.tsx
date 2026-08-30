import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { canAccessFeature, FeatureKey } from '../config/features';
import { OfflineSyncManager } from '../services/OfflineSyncManager';

interface AuthContextType {
  currentUser: User | null;
  isLoggedIn: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (user: User, token: string) => void;
  logout: () => Promise<void>;
  checkAccess: (feature: FeatureKey) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mote_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  const login = useCallback((user: User, token: string) => {
    setCurrentUser(user);
    localStorage.setItem('mote_user', JSON.stringify(user));
    localStorage.setItem('mote_token', token);
    // 自動在背景將本機暫存同步至雲端
    OfflineSyncManager.syncToCloud().catch((err) => {
      console.warn('[Auto Sync After Login Warning]', err);
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors
    }
    setCurrentUser(null);
    localStorage.removeItem('mote_user');
    localStorage.removeItem('mote_token');
    OfflineSyncManager.clearOfflineData();
  }, []);

  const checkAccess = useCallback(
    (feature: FeatureKey) => {
      return canAccessFeature(feature, !!currentUser);
    },
    [currentUser]
  );

  // 1. 偵測 Google OAuth 回呼 URL 參數
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authToken = params.get('auth_token');
    const userId = params.get('user_id');
    const userName = params.get('user_name');

    if (authToken && userId) {
      const newUser: User = {
        id: userId,
        email: 'student@mote.app',
        name: userName || '高中學員',
        avatarUrl: '',
      };
      login(newUser, authToken);

      // 清除 URL 上的 OAuth 參數
      params.delete('auth_token');
      params.delete('user_id');
      params.delete('user_name');
      const newQuery = params.toString();
      const newUrl = window.location.pathname + (newQuery ? `?${newQuery}` : '') + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [login]);

  // 2. 驗證現有 Token 是否有效
  useEffect(() => {
    const token = localStorage.getItem('mote_token');
    if (token && currentUser) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) {
            // Token 失效，轉為訪客身分
            setCurrentUser(null);
            localStorage.removeItem('mote_user');
            localStorage.removeItem('mote_token');
          }
        })
        .catch(() => {
          // 網路離線時保留本機狀態
        });
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoggedIn: !!currentUser,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        login,
        logout,
        checkAccess,
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
