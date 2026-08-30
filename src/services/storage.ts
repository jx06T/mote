/**
 * Mote 系統統一儲存抽象層 (Unified Storage Layer)
 * 提供型別安全、防崩潰與集中的 LocalStorage / SessionStorage 存取介面
 */

export const STORAGE_KEYS = {
  THEME: 'mote_theme',
  PREFERENCES: 'mote_preferences',
  TOKEN: 'mote_token',
  USER: 'mote_user',
  CLIENT_ID: 'mote_client_id',
  QUICK_NOTES: 'mote_quick_notes',
  MATERIALS: 'mote_materials',
  ESSAYS: 'mote_essays',
  ESSAY_OPS_PREFIX: 'mote_essay_ops_',
  VOCABULARY: 'mote_vocabulary',
  PROMPTS: 'mote_prompts',
  EXAMS: 'mote_exams',
  WEAKNESSES: 'mote_weaknesses',
} as const;

export const SESSION_KEYS = {
  GUEST_BANNER_DISMISSED: 'mote_guest_banner_dismissed',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS] | string;
export type SessionKey = (typeof SESSION_KEYS)[keyof typeof SESSION_KEYS] | string;

export interface AppPreferences {
  darkMode?: boolean;
  fontSize?: 'normal' | 'large';
  editorFocusMode?: boolean;
}

function safeGetLocal<T>(key: StorageKey, defaultValue: T | null = null): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[Storage] Failed to get or parse localStorage key "${key}":`, err);
    return defaultValue;
  }
}

function safeSetLocal<T>(key: StorageKey, value: T): boolean {
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (err) {
    console.warn(`[Storage] Failed to set localStorage key "${key}":`, err);
    return false;
  }
}

function safeGetStringLocal(key: StorageKey, defaultValue: string | null = null): string | null {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? val : defaultValue;
  } catch (err) {
    console.warn(`[Storage] Failed to get string from localStorage key "${key}":`, err);
    return defaultValue;
  }
}

function safeSetStringLocal(key: StorageKey, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn(`[Storage] Failed to set string in localStorage key "${key}":`, err);
    return false;
  }
}

function safeRemoveLocal(key: StorageKey): void {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[Storage] Failed to remove localStorage key "${key}":`, err);
  }
}

function safeGetSession<T>(key: SessionKey, defaultValue: T | null = null): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[Storage] Failed to get or parse sessionStorage key "${key}":`, err);
    return defaultValue;
  }
}

function safeSetSession<T>(key: SessionKey, value: T): boolean {
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    sessionStorage.setItem(key, serialized);
    return true;
  } catch (err) {
    console.warn(`[Storage] Failed to set sessionStorage key "${key}":`, err);
    return false;
  }
}

function safeGetStringSession(key: SessionKey, defaultValue: string | null = null): string | null {
  try {
    const val = sessionStorage.getItem(key);
    return val !== null ? val : defaultValue;
  } catch (err) {
    console.warn(`[Storage] Failed to get string from sessionStorage key "${key}":`, err);
    return defaultValue;
  }
}

function safeSetStringSession(key: SessionKey, value: string): boolean {
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn(`[Storage] Failed to set string in sessionStorage key "${key}":`, err);
    return false;
  }
}

function safeRemoveSession(key: SessionKey): void {
  try {
    sessionStorage.removeItem(key);
  } catch (err) {
    console.warn(`[Storage] Failed to remove sessionStorage key "${key}":`, err);
  }
}

export const storage = {
  local: {
    get: safeGetLocal,
    set: safeSetLocal,
    getString: safeGetStringLocal,
    setString: safeSetStringLocal,
    remove: safeRemoveLocal,
  },
  session: {
    get: safeGetSession,
    set: safeSetSession,
    getString: safeGetStringSession,
    setString: safeSetStringSession,
    remove: safeRemoveSession,
  },

  /**
   * 取得或初始化客戶端唯一識別碼 (用於向量時鐘或離線節點標識)
   */
  getClientId(): string {
    let clientId = safeGetStringLocal(STORAGE_KEYS.CLIENT_ID);
    if (!clientId) {
      clientId = `mote_node_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      safeSetStringLocal(STORAGE_KEYS.CLIENT_ID, clientId);
    }
    return clientId;
  },

  /**
   * 匯出所有本機資料作為 JSON 備份物件
   */
  exportBackup(): Record<string, any> {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      theme: safeGetStringLocal(STORAGE_KEYS.THEME, 'light'),
      preferences: safeGetLocal(STORAGE_KEYS.PREFERENCES, {}),
      quickNotes: safeGetLocal(STORAGE_KEYS.QUICK_NOTES, []),
      materials: safeGetLocal(STORAGE_KEYS.MATERIALS, []),
      essays: safeGetLocal(STORAGE_KEYS.ESSAYS, []),
      vocabulary: safeGetLocal(STORAGE_KEYS.VOCABULARY, []),
      prompts: safeGetLocal(STORAGE_KEYS.PROMPTS, []),
      exams: safeGetLocal(STORAGE_KEYS.EXAMS, []),
      weaknesses: safeGetLocal(STORAGE_KEYS.WEAKNESSES, []),
    };
  },

  /**
   * 清除所有本機訪客寫作暫存資料 (登出或重設時調用)
   */
  clearGuestData(): void {
    safeRemoveLocal(STORAGE_KEYS.QUICK_NOTES);
    safeRemoveLocal(STORAGE_KEYS.MATERIALS);
    safeRemoveLocal(STORAGE_KEYS.ESSAYS);
    safeRemoveLocal(STORAGE_KEYS.VOCABULARY);
    safeRemoveLocal(STORAGE_KEYS.PROMPTS);
    safeRemoveLocal(STORAGE_KEYS.EXAMS);
    safeRemoveLocal(STORAGE_KEYS.WEAKNESSES);

    // 清理任何以 mote_essay_ops_ 開頭的 key
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_KEYS.ESSAY_OPS_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => safeRemoveLocal(k));
    } catch (err) {
      console.warn('[Storage] Failed to clear essay operations keys:', err);
    }
  },
};
