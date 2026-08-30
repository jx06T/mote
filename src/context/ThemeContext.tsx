import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage, STORAGE_KEYS, AppPreferences } from '../services/storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getInitialTheme(): ThemeMode {
  const storedTheme = storage.local.getString(STORAGE_KEYS.THEME);
  if (storedTheme === 'dark' || storedTheme === 'light' || storedTheme === 'system') {
    return storedTheme;
  }
  // Check preferences as fallback
  const prefs = storage.local.get<AppPreferences>(STORAGE_KEYS.PREFERENCES);
  if (prefs?.darkMode !== undefined) {
    return prefs.darkMode ? 'dark' : 'light';
  }
  // Check document classList as fallback
  if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
    return 'dark';
  }
  return 'light';
}

function applyThemeToDOM(isDark: boolean) {
  const root = document.documentElement;
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // 同步更新 PWA 頂部狀態列 theme-color
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', isDark ? '#1A1815' : '#FAF8F5');
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme);
  const [isDark, setIsDark] = useState<boolean>(() => {
    const initial = getInitialTheme();
    return initial === 'dark' || (initial === 'system' && getSystemTheme());
  });

  const updateTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    storage.local.setString(STORAGE_KEYS.THEME, newTheme);

    const activeDark = newTheme === 'dark' || (newTheme === 'system' && getSystemTheme());
    setIsDark(activeDark);
    applyThemeToDOM(activeDark);

    // 同步更新 preferences
    const existingPrefs = storage.local.get<AppPreferences>(STORAGE_KEYS.PREFERENCES) || {};
    storage.local.set(STORAGE_KEYS.PREFERENCES, {
      ...existingPrefs,
      darkMode: activeDark,
    });
  }, []);

  const toggleTheme = useCallback(() => {
    updateTheme(isDark ? 'light' : 'dark');
  }, [isDark, updateTheme]);

  // 1. 初始化 DOM 主題狀態
  useEffect(() => {
    const activeDark = theme === 'dark' || (theme === 'system' && getSystemTheme());
    setIsDark(activeDark);
    applyThemeToDOM(activeDark);
  }, [theme]);

  // 2. 監聽作業系統深淺色偏好變更 (當 theme === 'system' 時)
  useEffect(() => {
    if (theme !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
      applyThemeToDOM(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // 3. 跨瀏覽器分頁 (Storage Event) 同步主題變更
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.THEME && e.newValue) {
        const incoming = e.newValue as ThemeMode;
        if (incoming === 'dark' || incoming === 'light' || incoming === 'system') {
          setThemeState(incoming);
          const activeDark = incoming === 'dark' || (incoming === 'system' && getSystemTheme());
          setIsDark(activeDark);
          applyThemeToDOM(activeDark);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        setTheme: updateTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
