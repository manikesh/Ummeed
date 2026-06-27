import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

/**
 * Embedded fallbacks for the Ummeed Supabase project.
 *
 * These are the PUBLIC anon key + project URL — Supabase explicitly designs
 * the anon key to be shipped on-device. Row-Level Security policies protect
 * the data. Keeping these as fallbacks means the app works on any clone of
 * the repo even without a local `.env` file.
 *
 * Override at build time via .env:
 *   EXPO_PUBLIC_SUPABASE_URL=...
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
 */
const DEFAULT_SUPABASE_URL = 'https://vlztioqltxykcusrxsmi.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsenRpb3FsdHh5a2N1c3J4c21pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMTcyMTcsImV4cCI6MjA5Nzg5MzIxN30.ULNbjGA-dUKE8SDoMy1I9AUb72MAhzER4EAEFCEFQ4E';

const supabaseUrl =
  (process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_URL.trim()) ||
  DEFAULT_SUPABASE_URL;
const supabaseAnonKey =
  (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.trim()) ||
  DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
