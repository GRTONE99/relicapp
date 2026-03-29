import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Safari Private Browsing blocks localStorage entirely — accessing it throws
// a SecurityError. Fall back to an in-memory store so the client initialises
// cleanly in all contexts (private mode, WebViews, older iOS Safari).
function safeStorage(): Storage {
  try {
    localStorage.setItem("__test__", "1");
    localStorage.removeItem("__test__");
    return localStorage;
  } catch {
    // In-memory fallback — session won't persist across page loads in private
    // mode, but auth calls will work correctly within the session.
    const store: Record<string, string> = {};
    return {
      getItem: (k) => store[k] ?? null,
      setItem: (k, v) => { store[k] = v; },
      removeItem: (k) => { delete store[k]; },
      clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
      key: (i) => Object.keys(store)[i] ?? null,
      get length() { return Object.keys(store).length; },
    };
  }
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: safeStorage(),
    persistSession: true,
    autoRefreshToken: true,
  },
});
