import { createClient } from '@supabase/supabase-js'

let supabaseInstance = null;

export const initSupabase = (url, key) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('NEXT_PUBLIC_SUPABASE_URL', url);
    localStorage.setItem('NEXT_PUBLIC_SUPABASE_ANON_KEY', key);
  }
  supabaseInstance = createClient(url, key);
  return supabaseInstance;
};

export const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;

  // Try to load from localStorage first (for the app version)
  let url = typeof window !== 'undefined' ? localStorage.getItem('NEXT_PUBLIC_SUPABASE_URL') : null;
  let key = typeof window !== 'undefined' ? localStorage.getItem('NEXT_PUBLIC_SUPABASE_ANON_KEY') : null;

  // In local development, seamlessly fallback to .env.local variables
  if (process.env.NODE_ENV === 'development') {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    }
  }

  if (url && key) {
    try {
      supabaseInstance = createClient(url, key);
      return supabaseInstance;
    } catch (e) {
      // Invalid URL or Key, clear them so they can be re-entered
      return null;
    }
  }

  return null;
};

export const clearSupabase = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('NEXT_PUBLIC_SUPABASE_URL');
    localStorage.removeItem('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  supabaseInstance = null;
};
