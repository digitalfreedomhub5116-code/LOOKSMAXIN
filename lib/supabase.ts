import { createClient } from '@supabase/supabase-js';

/**
 * Lynx AI — Supabase Client
 *
 * Replace the values below with your actual Supabase project credentials.
 * Find them at: Supabase Dashboard → Project Settings → API
 */

const SUPABASE_URL = 'https://jtcqyxrbvxzhzzgrmsom.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_g2L0rujZkZS_mpbC3BhSQA_-Kns1bc0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Use AsyncStorage for React Native persistent sessions
    // We'll configure this properly once auth is wired up
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable for React Native
  },
});
