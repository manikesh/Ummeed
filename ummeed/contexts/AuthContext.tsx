import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { AppRole, Profile } from '../lib/types';

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * Phone-OTP auth (dev bypass mode)
 *
 * The user signs in with a 10-digit Indian mobile number. Supabase free tier
 * has no SMS provider configured, so we use a stand-in:
 *   - The app accepts the hardcoded OTP "123456" for any phone number.
 *   - Behind the scenes the phone is mapped to a synthetic email
 *     `p{phone}@ummeed.local` and signed in with a deterministic password,
 *     so a REAL Supabase session is created and RLS still applies.
 *
 * To switch to real SMS OTP later:
 *   1. In Supabase Auth → Providers → Phone, enable a provider (Twilio,
 *      MessageBird etc.) and add credentials.
 *   2. Set USE_OTP_BYPASS = false below.
 *   3. The non-bypass branches already call signInWithOtp / verifyOtp with
 *      `{ phone, type: 'sms' }` — they will start working automatically.
 * ──────────────────────────────────────────────────────────────────────────────
 */
const USE_OTP_BYPASS = true;
const BYPASS_CODE = '123456';

/** Normalise to bare 10-digit Indian mobile (strips +91, leading 0, spaces). */
export function normalizePhone(raw: string): string {
  const digits = (raw || '').replace(/\D+/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

/** True if the input is a valid 10-digit Indian mobile number. */
export function isValidPhone(raw: string): boolean {
  const p = normalizePhone(raw);
  return /^[6-9]\d{9}$/.test(p);
}

/** E.164 form for storage / display (always +91...). */
export function toE164(raw: string): string {
  return `+91${normalizePhone(raw)}`;
}

/** Map a phone number to a deterministic synthetic email for Supabase auth. */
function phoneToEmail(raw: string): string {
  return `p${normalizePhone(raw)}@ummeed.local`;
}

const devPassword = (phone: string) =>
  `ummeed-dev::${normalizePhone(phone)}::v1`;

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Send the OTP to a phone number (bypassed in dev — accepts 123456). */
  sendOtp: (phone: string, intendedRole: AppRole | undefined, isSignUp: boolean, fullName?: string) => Promise<void>;
  /** Verify the OTP. token must be the 6-digit code. */
  verifyOtp: (phone: string, token: string, isSignUp: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

// Module-scoped cache: the role / name the user just entered on the Login
// screen — used by verifyOtp if we need to sign-up the user on the fly.
let pendingSignup: {
  phone: string;
  role: AppRole;
  fullName?: string;
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

    async function initAuth() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!mounted) return;
        setSession(data.session ?? null);
        if (data.session?.user) {
          await loadProfile(data.session.user.id);
        }
      } catch (err) {
        console.warn('[Auth] Error initializing session:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initAuth();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, s) => {
      if (!mounted) return;
      setSession(s);
      try {
        if (s?.user) {
          await loadProfile(s.user.id);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.warn('[Auth] Error loading profile on auth change:', err);
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

  // sendOtp: in bypass mode we don't send anything; just remember the
  // metadata so verifyOtp can sign the user up on the fly.
  const sendOtp = useCallback(
    async (phone: string, intendedRole: AppRole | undefined, isSignUp: boolean, fullName?: string) => {
      if (!isValidPhone(phone)) {
        throw new Error('Please enter a valid 10-digit Indian mobile number.');
      }
      const p = normalizePhone(phone);

      // Pre-verification: check if the phone number exists in public.profiles
      const formattedPhone = toE164(p);
      let phoneExists = false;
      try {
        const { data: exists, error } = await supabase.rpc('check_phone_exists', { p_phone: formattedPhone });
        if (!error) {
          phoneExists = !!exists;
        } else {
          console.warn('[Auth] check_phone_exists RPC error, falling back to direct profiles query:', error.message);
          const { data: directData } = await supabase
            .from('profiles')
            .select('id')
            .eq('phone', formattedPhone)
            .maybeSingle();
          phoneExists = !!directData;
        }
      } catch (err) {
        console.warn('[Auth] Pre-verification lookup failed:', err);
      }

      if (isSignUp) {
        if (phoneExists) {
          throw new Error('An account with this mobile number already exists. Please sign in instead.');
        }
      } else {
        if (!phoneExists) {
          throw new Error('No account found for this mobile number. Please register first.');
        }
      }

      pendingSignup = { phone: p, role: intendedRole ?? 'patient', fullName };

      if (USE_OTP_BYPASS) {
        return; // no-op
      }
      // Real SMS OTP path (works once a phone provider is configured in Supabase).
      const { error } = await supabase.auth.signInWithOtp({
        phone: toE164(p),
        options: {
          shouldCreateUser: isSignUp,
          data: isSignUp
            ? { role: intendedRole ?? 'patient', full_name: fullName ?? '', phone: toE164(p) }
            : undefined,
        },
      });
      if (error) throw error;
    },
    [],
  );

  // verifyOtp: in bypass mode any 123456 signs the user in (or up).
  const verifyOtp = useCallback(async (phone: string, token: string, isSignUp: boolean) => {
    if (!isValidPhone(phone)) {
      throw new Error('Please enter a valid 10-digit Indian mobile number.');
    }
    const p = normalizePhone(phone);

    if (USE_OTP_BYPASS) {
      if (token.trim() !== BYPASS_CODE) {
        throw new Error(`Invalid code. (Hint: in dev mode the code is ${BYPASS_CODE}.)`);
      }
      const syntheticEmail = phoneToEmail(p);
      const password = devPassword(p);

      if (!isSignUp) {
        // Sign In path: try to sign in
        const signIn = await supabase.auth.signInWithPassword({
          email: syntheticEmail,
          password,
        });
        if (signIn.error) {
          throw new Error('No account found for this mobile number. Please register first.');
        }
        return;
      }

      // Registration path: sign up directly (will fail if email/user already exists)
      const meta =
        pendingSignup && pendingSignup.phone === p
          ? {
              role: pendingSignup.role,
              full_name: pendingSignup.fullName ?? '',
              phone: toE164(p),
            }
          : { role: 'patient' as AppRole, full_name: '', phone: toE164(p) };

      const signUp = await supabase.auth.signUp({
        email: syntheticEmail,
        password,
        options: { data: meta },
      });

      if (signUp.error) {
        if (signUp.error.message.includes('already') || signUp.error.status === 400) {
          throw new Error('An account with this mobile number already exists. Please sign in instead.');
        }
        throw signUp.error;
      }

      // 3) retry signin if needed
      if (!signUp.data.session) {
        const retry = await supabase.auth.signInWithPassword({
          email: syntheticEmail,
          password,
        });
        if (retry.error) throw retry.error;
      }
      return;
    }

    // Real SMS OTP path.
    const { error } = await supabase.auth.verifyOtp({
      phone: toE164(p),
      token: token.trim(),
      type: 'sms',
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
