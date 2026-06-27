import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type Nav =
  // public
  | { name: 'welcome' }
  | { name: 'role-select' }
  | { name: 'login'; intendedRole: import('../lib/types').AppRole }
  | { name: 'otp'; email: string; intendedRole: import('../lib/types').AppRole }
  | { name: 'pending-approval' }
  // patient
  | { name: 'patient-home' }
  | { name: 'patient-profile' }
  | { name: 'burn-incident' }
  | { name: 'medical-records' }
  | { name: 'hospital-search' }
  | { name: 'ngo-search' }
  | { name: 'emergency' }
  | { name: 'connect'; targetRole: 'doctor' | 'ngo' }
  // doctor
  | { name: 'doctor-home' }
  | { name: 'doctor-profile' }
  | { name: 'doctor-patients' }
  // ngo
  | { name: 'ngo-home' }
  | { name: 'ngo-profile' }
  | { name: 'ngo-patients' }
  // admin
  | { name: 'admin-home' }
  | { name: 'admin-approvals' }
  | { name: 'admin-hospitals' }
  | { name: 'admin-content' };

interface NavCtx {
  stack: Nav[];
  current: Nav;
  push: (n: Nav) => void;
  replace: (n: Nav) => void;
  reset: (n: Nav) => void;
  back: () => void;
  canBack: boolean;
}

const NavContext = createContext<NavCtx | undefined>(undefined);

export function NavProvider({ initial, children }: { initial: Nav; children: React.ReactNode }) {
  const [stack, setStack] = useState<Nav[]>([initial]);

  const push = useCallback((n: Nav) => setStack((s) => [...s, n]), []);
  const replace = useCallback(
    (n: Nav) => setStack((s) => [...s.slice(0, -1), n]),
    [],
  );
  const reset = useCallback((n: Nav) => setStack([n]), []);
  const back = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);

  const value = useMemo<NavCtx>(
    () => ({
      stack,
      current: stack[stack.length - 1],
      push,
      replace,
      reset,
      back,
      canBack: stack.length > 1,
    }),
    [stack, push, replace, reset, back],
  );

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav(): NavCtx {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used inside NavProvider');
  return ctx;
}
