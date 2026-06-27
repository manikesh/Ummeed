import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { AppRole, Profile } from '../lib/types';

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * Dev OTP bypass
 * The Supabase project is on the free tier and email-template editing is
 * blocked, which means the real OTP code can't be delivered as plain text to
 * the user. As a temporary stand-in, the app accepts the hardcoded OTP
 * "123456" for ANY email. Behind the scenes we sign in (or sign up) the user
 * with a deterministic password derived from their email, so a real Supabase
 * session is created and RLS continues to work normally.
 *
 * To switch back to real email OTP later, set USE_OTP_BYPASS = false,
 * configure a custom SMTP provider in Supabase, and replace the body of
 * sendOtp / verifyOtp with supabase.auth.signInWithOtp / verifyOtp.
 * ──────────────────────────────────────────────────────────────────────────────
 */
const USE_OTP_BYPASS = true;
const BYPASS_CODE = '123456';
const devPassword = (email: string) => `ummeed-dev::${email.trim().toLowerCase()}::v1`;

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  sendOtp: (email: string, intendedRole: AppRole, fullName?: string, phone?: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

// Module-scoped cache: the role / name / phone the user just entered on the
// Login screen — used by verifyOtp if we need to sign-up the user on the fly.
let pendingSignup: {
  email: string;
  role: AppRole;
  fullName?: string;
  phone?: string;
} | null = null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.warn('[Auth] loadProfile error', error.message);
      setProfile(null);
      return;
    }
    setProfile((data as Profile) ?? null);
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      if (data.session?.user) {
        await loadProfile(data.session.user.id);
      }
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, s) => {
      setSession(s);
      if (s?.user) {
        await loadProfile(s.user.id);
      } else {
        setProfile(null);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  // sendOtp: in bypass mode we don't actually send anything; we just remember
  // the intended role/name so verifyOtp can create the account on the fly.
  const sendOtp = useCallback(
    async (email: string, intendedRole: AppRole, fullName?: string, phone?: string) => {
      const normalized = email.trim().toLowerCase();
      pendingSignup = { email: normalized, role: intendedRole, fullName, phone };

      if (USE_OTP_BYPASS) {
        // No-op in bypass. We just preserve the metadata for verifyOtp.
        return;
      }
      const { error } = await supabase.auth.signInWithOtp({
        email: normalized,
        options: {
          shouldCreateUser: true,
          data: { role: intendedRole, full_name: fullName ?? '', phone: phone ?? '' },
        },
      });
      if (error) throw error;
    },
    [],
  );

  // verifyOtp: in bypass mode any 123456 signs the user in (or up). Behind the
  // scenes we use email + deterministic password so we always get a real
  // Supabase session and RLS still applies.
  const verifyOtp = useCallback(async (email: string, token: string) => {
    const normalized = email.trim().toLowerCase();

    if (USE_OTP_BYPASS) {
      if (token.trim() !== BYPASS_CODE) {
        throw new Error(`Invalid code. (Hint: in dev mode the code is ${BYPASS_CODE}.)`);
      }
      const password = devPassword(normalized);

      // 1) try signin
      const signIn = await supabase.auth.signInWithPassword({ email: normalized, password });
      if (!signIn.error) return;

      // 2) sign up (auto-confirm is on, so this creates a session immediately)
      const meta = pendingSignup && pendingSignup.email === normalized
        ? { role: pendingSignup.role, full_name: pendingSignup.fullName ?? '', phone: pendingSignup.phone ?? '' }
        : { role: 'patient' as AppRole, full_name: '', phone: '' };
      const signUp = await supabase.auth.signUp({
        email: normalized,
        password,
        options: { data: meta },
      });
      if (signUp.error) throw signUp.error;

      // 3) if signUp didn't return a session (rare on free tier even with
      // autoconfirm), try signing in once more.
      if (!signUp.data.session) {
        const retry = await supabase.auth.signInWithPassword({ email: normalized, password });
        if (retry.error) throw retry.error;
      }
      return;
    }

    const { error } = await supabase.auth.verifyOtp({
      email: normalized,
      token: token.trim(),
      type: 'email',
    });
    if (error) throw error;
  }, []);

  const value = useMemo<AuthState>(
    () => ({ session, profile, loading, refreshProfile, signOut, sendOtp, verifyOtp }),
    [session, profile, loading, refreshProfile, signOut, sendOtp, verifyOtp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
