import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { canAccessFeature, FeatureKey } from '../config/features';
import { OfflineSyncManager } from '../services/OfflineSyncManager';
import { storage, STORAGE_KEYS } from '../services/storage';

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
    return storage.local.get<User>(STORAGE_KEYS.USER);
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  const login = useCallback((user: User, token: string) => {
    setCurrentUser(user);
    storage.local.set(STORAGE_KEYS.USER, user);
    storage.local.setString(STORAGE_KEYS.TOKEN, token);
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
    storage.local.remove(STORAGE_KEYS.USER);
    storage.local.remove(STORAGE_KEYS.TOKEN);
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
    const userEmail = params.get('user_email');
    const avatarUrl = params.get('avatar_url');

    if (authToken && userId) {
      const newUser: User = {
        id: userId,
        email: userEmail || '',
        name: userName || '高中學員',
        avatarUrl: avatarUrl || '',
      };
      login(newUser, authToken);

      // 清除 URL 上的 OAuth 參數
      params.delete('auth_token');
      params.delete('user_id');
      params.delete('user_name');
      params.delete('user_email');
      params.delete('avatar_url');
      const newQuery = params.toString();
      const newUrl = window.location.pathname + (newQuery ? `?${newQuery}` : '') + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [login]);

  // 2. 驗證現有 Token 是否有效並同步最新個人檔案
  useEffect(() => {
    const token = storage.local.getString(STORAGE_KEYS.TOKEN);
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (res) => {
          if (res.ok) {
            const userData = (await res.json()) as Partial<User>;
            if (userData && userData.id) {
              const updatedUser: User = {
                id: userData.id,
                email: userData.email || '',
                name: userData.name || '高中學員',
                avatarUrl: userData.avatarUrl || '',
              };
              setCurrentUser(updatedUser);
              storage.local.set(STORAGE_KEYS.USER, updatedUser);
            }
          } else {
            // Token 失效，轉為訪客身分
            setCurrentUser(null);
            storage.local.remove(STORAGE_KEYS.USER);
            storage.local.remove(STORAGE_KEYS.TOKEN);
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
