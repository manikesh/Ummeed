import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../contexts/AuthContext';
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

export function LoginScreen({ intendedRole }: { intendedRole: AppRole }) {
  const { sendOtp } = useAuth();
  const { push } = useNav();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSend = async () => {
    setErr(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErr('Please enter a valid email.');
      return;
    }
    if (!fullName.trim()) {
      setErr('Please enter your full name.');
      return;
    }
    setLoading(true);
    try {
      await sendOtp(email, intendedRole, fullName, phone);
      Alert.alert('Code sent', 'Check your email for the 6-digit code.');
      push({ name: 'otp', email, intendedRole });
    } catch (e: any) {
      setErr(e?.message ?? 'Could not send code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen title="Sign in" subtitle={`Signing in as: ${ROLE_LABEL[intendedRole]}`}>
      <Text style={styles.help}>
        We will email you a 6-digit code. No password needed.
      </Text>
      <View style={{ height: spacing.md }} />

      <Input
        label="Full name"
        placeholder="e.g. Ankita Sharma"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
        testID="login-name"
      />
      <Input
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        testID="login-email"
      />
      <Input
        label="Phone (optional)"
        placeholder="+91…"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        testID="login-phone"
      />
      {err ? <Text style={styles.err}>{err}</Text> : null}
      <View style={{ height: spacing.sm }} />
      <Button title="Send code" onPress={onSend} loading={loading} testID="login-send" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  help: { color: colors.textMuted, fontSize: font.body, lineHeight: 24 },
  err: { color: colors.danger, fontSize: font.body, marginBottom: spacing.sm, fontWeight: font.weightSemi },
});
