import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { canAccessFeature, FeatureKey } from '../config/features';

interface AuthContextType {
  currentUser: User | null;
  isLoggedIn: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (user: User, token: string) => void;
  logout: () => void;
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
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('mote_user');
    localStorage.removeItem('mote_token');
  }, []);

  const checkAccess = useCallback(
    (feature: FeatureKey) => {
      return canAccessFeature(feature, !!currentUser);
    },
    [currentUser]
  );

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
