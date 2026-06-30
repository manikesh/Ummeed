import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View, Pressable } from 'react-native';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { isValidPhone, normalizePhone, useAuth } from '../../contexts/AuthContext';
import { useNav } from '../../contexts/NavContext';
import type { AppRole } from '../../lib/types';
import { colors, font, spacing } from '../../theme';

const ROLE_LABEL: Record<AppRole, string> = {
  patient: 'Patient / Survivor',
  doctor: 'Doctor',
  ngo: 'NGO / Caregiver / Volunteer',
  counselor: 'Counselor',
  legal_aid: 'Legal Aid',
  volunteer: 'Volunteer',
  admin: 'Admin',
};

export function LoginScreen({ intendedRole, isSignUpInit }: { intendedRole?: AppRole; isSignUpInit?: boolean }) {
  const { sendOtp } = useAuth();
  const { push } = useNav();
  const [isSignUp, setIsSignUp] = useState(isSignUpInit ?? !!intendedRole);
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const toggleMode = (targetSignUp: boolean) => {
    if (targetSignUp && !intendedRole) {
      push({ name: 'role-select' });
      return;
    }
    setIsSignUp(targetSignUp);
    setErr(null);
  };

  const onSend = async () => {
    setErr(null);
    if (isSignUp && !fullName.trim()) {
      setErr('Please enter your full name.');
      return;
    }
    if (!isValidPhone(phone)) {
      setErr('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    const normalized = normalizePhone(phone);
    setLoading(true);
    try {
      await sendOtp(normalized, intendedRole, isSignUp, isSignUp ? fullName : undefined);
      Alert.alert('Dev mode', `OTP delivery is bypassed. Use code 123456 on the next screen to ${isSignUp ? 'register' : 'sign in'}.`);
      push({ name: 'otp', phone: normalized, intendedRole, isSignUp });
    } catch (e: any) {
      setErr(e?.message ?? 'Could not send code.');
    } finally {
      setLoading(false);
    }
  };

  const activeRole = intendedRole || 'patient';

  return (
    <Screen 
      title={isSignUp ? 'Create Account' : 'Sign In'} 
      subtitle={isSignUp ? `Registering as: ${ROLE_LABEL[activeRole]}` : 'Welcome back! Enter your details to access your account.'}
    >
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <Pressable 
          style={[styles.tab, !isSignUp && styles.tabActive]} 
          onPress={() => toggleMode(false)}
          testID="tab-signin"
        >
          <Text style={[styles.tabText, !isSignUp && styles.tabTextActive]}>Sign In</Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, isSignUp && styles.tabActive]} 
          onPress={() => toggleMode(true)}
          testID="tab-signup"
        >
          <Text style={[styles.tabText, isSignUp && styles.tabTextActive]}>Register</Text>
        </Pressable>
      </View>

      <Text style={styles.help}>
        {isSignUp 
          ? 'Enter your name and mobile number. We will send a 6-digit code to verify your phone.' 
          : 'We will send a 6-digit code to your mobile number. No password needed.'}
      </Text>
      <View style={{ height: spacing.md }} />

      {isSignUp ? (
        <Input
          label="Full name"
          placeholder="e.g. Ankita Sharma"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          testID="login-name"
        />
      ) : null}

      <Input
        label="Mobile number"
        placeholder="10-digit mobile (e.g. 9876543210)"
        value={phone}
        onChangeText={(t) => setPhone(t.replace(/[^\d]/g, '').slice(0, 10))}
        keyboardType="number-pad"
        autoComplete="tel"
        maxLength={10}
        hint="We only support Indian (+91) numbers for now."
        testID="login-phone"
      />
      {err ? <Text style={styles.err}>{err}</Text> : null}
      <View style={{ height: spacing.sm }} />
      <Button 
        title={isSignUp ? 'Register & Send Code' : 'Send Code'} 
        onPress={onSend} 
        loading={loading} 
        testID="login-send" 
      />

      <View style={styles.footerContainer}>
        {isSignUp ? (
          <Pressable onPress={() => toggleMode(false)} testID="link-signin">
            <Text style={styles.footerText}>
              Already have an account? <Text style={styles.footerLink}>Sign In</Text>
            </Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => toggleMode(true)} testID="link-signup">
            <Text style={styles.footerText}>
              Don't have an account? <Text style={styles.footerLink}>Register</Text>
            </Text>
          </Pressable>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: font.body,
    fontWeight: font.weightSemi,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: font.weightBold,
  },
  help: { color: colors.textMuted, fontSize: font.body, lineHeight: 24 },
  err: { color: colors.danger, fontSize: font.body, marginBottom: spacing.sm, fontWeight: font.weightSemi },
  footerContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: font.body,
  },
  footerLink: {
    color: colors.accent,
    fontWeight: font.weightBold,
  },
});
