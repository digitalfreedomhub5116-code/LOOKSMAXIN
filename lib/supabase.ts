import { createClient } from '@supabase/supabase-js';

/**
 * Lynx AI — Supabase Client
 *
 * Replace the values below with your actual Supabase project credentials.
 * Find them at: Supabase Dashboard → Project Settings → API
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
// NOTE: These values come from .env — now pointing to Pro plan project (mxcvwkdkjsailyoestlv)

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Use AsyncStorage for React Native persistent sessions
    // We'll configure this properly once auth is wired up
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable for React Native
  },
});
